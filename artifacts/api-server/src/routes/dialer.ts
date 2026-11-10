import { randomBytes } from "node:crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  DialerLoginBody, DialerLoginResponse, GetDialerSessionResponse,
  GetDialerTasksResponse, GetDialerTaskParams, GetDialerTaskResponse,
  CompleteDialerTaskParams, CompleteDialerTaskBody, CompleteDialerTaskResponse,
} from "@workspace/api-zod";
import { asObject, bpm, DialerError, mapLead, outcomeVariables, unwrap, upstream } from "../lib/dialer-upstream";

const router: IRouter = Router();
const COOKIE = "dialer_session";
const SESSION_DURATION = 8 * 60 * 60 * 1000;
type Session = { token: string; username: string; taskDefinitionKey: string; expires: number };
// POC sessions deliberately live only in memory; restart requires a new login.
const sessions = new Map<string, Session>();
const completing = new Set<string>();
const loginAttempts = new Map<string, { count: number; until: number }>();
const cleanup = setInterval(() => {
  for (const [key, value] of sessions) if (value.expires <= Date.now()) sessions.delete(key);
  for (const [key, value] of loginAttempts) if (value.until <= Date.now()) loginAttempts.delete(key);
}, 60_000);
cleanup.unref();

function cookieId(req: Request): string {
  const match = req.headers.cookie?.split(";").map(item => item.trim()).find(item => item.startsWith(`${COOKIE}=`));
  const id = match?.slice(COOKIE.length + 1) ?? "";
  return /^[a-f0-9]{64}$/.test(id) ? id : "";
}
function sessionFor(req: Request): Session {
  const session = sessions.get(cookieId(req));
  if (!session || session.expires <= Date.now()) {
    sessions.delete(cookieId(req));
    throw new DialerError(401, "Sign in with your Appflexor account to continue.");
  }
  return session;
}
function clearSession(req: Request, res: Response) {
  sessions.delete(cookieId(req));
  res.clearCookie(COOKIE, { path: "/api/dialer", httpOnly: true, sameSite: "strict" });
}
function report(req: Request, res: Response, error: unknown) {
  if (error instanceof DialerError) {
    if (error.status === 401) clearSession(req, res);
    res.status(error.status).json({ error: error.message });
  } else {
    req.log.error({ message: error instanceof Error ? error.message : "Unknown error" }, "Dialer request failed");
    res.status(500).json({ error: "The dialer could not process this request. Try again." });
  }
}
function publicSession(session: Session) {
  return { username: session.username, taskDefinitionKey: session.taskDefinitionKey };
}
async function ownedTask(session: Session, id: string) {
  if (!id || id.length > 200 || !/^[\w:.-]+$/.test(id)) throw new DialerError(400, "Invalid task id.");
  const task = asObject(await bpm(session.token, `/task/${encodeURIComponent(id)}`));
  if (!task.id) throw new DialerError(404, "This task is no longer available.");
  if (task.assignee !== session.username || (session.taskDefinitionKey && task.taskDefinitionKey !== session.taskDefinitionKey)) {
    throw new DialerError(403, "This dialing task is not assigned to you.");
  }
  return task;
}
async function variablesFor(session: Session, id: string) {
  const result = await bpm(session.token, `/task/${encodeURIComponent(id)}/variables?deserializeValues=false`);
  if (result === null || typeof result !== "object" || Array.isArray(result)) {
    throw new DialerError(502, "Appflexor returned an invalid task-variable response.");
  }
  return asObject(result);
}

router.use("/dialer", (_req, res, next) => {
  res.setHeader("Cache-Control", "no-store, private");
  res.setHeader("Pragma", "no-cache");
  next();
});

router.post("/dialer/login", async (req, res): Promise<void> => {
  const parsed = DialerLoginBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.username.trim()) {
    res.status(400).json({ error: "Enter a username and password." });
    return;
  }
  const ip = req.ip ?? "unknown";
  let attempts = loginAttempts.get(ip);
  if (!attempts || attempts.until < Date.now()) {
    attempts = { count: 0, until: Date.now() + 5 * 60_000 };
    loginAttempts.set(ip, attempts);
  }
  if (++attempts.count > 30) {
    res.status(429).json({ error: "Too many sign-in attempts. Please wait five minutes." });
    return;
  }
  try {
    const username = parsed.data.username.trim();
    const login = asObject(await upstream("app", "login", { username, password: parsed.data.password }));
    const token = asObject(login.C_DATA).AUTH_KEY ?? login.AUTH_KEY;
    if (typeof token !== "string" || !token) throw new DialerError(401, "Appflexor did not return a valid login session.");
    // Resolve the canonical user identity exactly as Appflexor does.
    const profileResult = asObject(unwrap(await upstream("app", "masterKey.tenantData", {
      dataKeys: [{ serviceParams: "", dataKey: "profile", serviceKey: "sys.user.profile", mode: "formData" }],
    }, token)));
    const profile = Array.isArray(profileResult.profile) ? asObject(profileResult.profile[0]) : {};
    const canonicalUsername = typeof profile.username === "string" && profile.username ? profile.username : username;
    // Rotate the session with one Set-Cookie header, not a clear+set pair.
    sessions.delete(cookieId(req));
    const id = randomBytes(32).toString("hex");
    const session: Session = {
      token, username: canonicalUsername,
      taskDefinitionKey: parsed.data.taskDefinitionKey?.trim() ?? "",
      expires: Date.now() + SESSION_DURATION,
    };
    sessions.set(id, session);
    res.cookie(COOKIE, id, {
      httpOnly: true, sameSite: "strict", path: "/api/dialer",
      secure: req.secure || req.get("x-forwarded-proto") === "https",
      maxAge: SESSION_DURATION,
    });
    loginAttempts.delete(ip);
    res.json(DialerLoginResponse.parse(publicSession(session)));
  } catch (error) { report(req, res, error); }
});

router.get("/dialer/session", (req, res): void => {
  try { res.json(GetDialerSessionResponse.parse(publicSession(sessionFor(req)))); }
  catch (error) { report(req, res, error); }
});

router.post("/dialer/logout", async (req, res): Promise<void> => {
  const session = sessions.get(cookieId(req));
  clearSession(req, res);
  if (session) {
    try { await upstream("app", "logout", {}, session.token); }
    catch { req.log.warn("Upstream logout unavailable; local dialer session revoked"); }
  }
  res.sendStatus(204);
});

router.get("/dialer/tasks", async (req, res): Promise<void> => {
  try {
    const session = sessionFor(req);
    const query = new URLSearchParams({
      assignee: session.username, active: "true", sortBy: "dueDate", sortOrder: "asc",
      firstResult: "0", maxResults: "101",
    });
    if (session.taskDefinitionKey) query.set("taskDefinitionKey", session.taskDefinitionKey);
    const response = await bpm(session.token, `/task?${query}`);
    if (!Array.isArray(response)) throw new DialerError(502, "Appflexor returned an invalid task list.");
    const rows = response.slice(0, 100);
    const tasks: ReturnType<typeof mapLead>[] = [];
    // Bound upstream concurrency; do not silently skip variable-fetch failures.
    for (let offset = 0; offset < rows.length; offset += 5) {
      const batch = await Promise.all(rows.slice(offset, offset + 5).map(async raw => {
        const task = asObject(raw);
        if (!task.id || task.assignee !== session.username) throw new DialerError(502, "Appflexor returned a task outside your assignment.");
        return mapLead(task, await variablesFor(session, String(task.id)));
      }));
      tasks.push(...batch.filter(task => /^\+?[\d\s().-]+$/.test(task.phone) && /\d/.test(task.phone)));
    }
    res.json(GetDialerTasksResponse.parse({ tasks, hasMore: response.length > 100, scannedCount: rows.length }));
  } catch (error) { report(req, res, error); }
});

router.get("/dialer/tasks/:id", async (req, res): Promise<void> => {
  const params = GetDialerTaskParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid task id." }); return; }
  try {
    const session = sessionFor(req);
    const task = await ownedTask(session, params.data.id);
    const lead = mapLead(task, await variablesFor(session, params.data.id));
    if (!lead.phone || !/^\+?[\d\s().-]+$/.test(lead.phone)) throw new DialerError(400, "This task does not contain a valid lead phone number.");
    res.json(GetDialerTaskResponse.parse(lead));
  } catch (error) { report(req, res, error); }
});

router.post("/dialer/tasks/:id/complete", async (req, res): Promise<void> => {
  const params = CompleteDialerTaskParams.safeParse(req.params);
  const input = CompleteDialerTaskBody.safeParse(req.body);
  if (!params.success || !input.success) {
    res.status(400).json({ error: "Choose HOT, RECALL or REJECTION and supply valid comments." });
    return;
  }
  let lock = "";
  try {
    const session = sessionFor(req);
    lock = `${session.username}:${params.data.id}`;
    if (completing.has(lock)) { lock = ""; throw new DialerError(409, "This task is already being completed. Please wait."); }
    completing.add(lock);
    const task = await ownedTask(session, params.data.id);
    const variables = await variablesFor(session, params.data.id);
    if (!mapLead(task, variables).phone) throw new DialerError(400, "This is not a lead dialing task.");
    await bpm(session.token, `/task/${encodeURIComponent(params.data.id)}/complete`, "POST", {
      variables: outcomeVariables(variables, input.data.status, input.data.comments),
    });
    res.json(CompleteDialerTaskResponse.parse({ id: params.data.id, completed: true }));
  } catch (error) { report(req, res, error); }
  finally { if (lock) completing.delete(lock); }
});

export default router;
