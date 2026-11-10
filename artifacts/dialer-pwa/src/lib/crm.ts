import { isOutcome, type Outcome } from "@/lib/dialer";

export type DialerSession = {
  username: string;
  authKey: string;
  taskDefinitionKey: string;
};

export type DialerTask = {
  id: string;
  name: string;
  phone: string;
  dueDate: string | null;
  status: string;
  comments: string;
  taskName: string;
  created: string | null;
};

export type DialerTaskList = {
  tasks: DialerTask[];
  hasMore: boolean;
  scannedCount: number;
};

export type DialerCompletion = { id: string; completed: boolean };

export class CrmError extends Error {
  data: { error: string };
  constructor(public status: number, message: string) {
    super(message);
    this.name = "CrmError";
    this.data = { error: message };
  }
}

const SESSION_KEY = "appflexor-dialer-session-v1";
const BASE_PATH = import.meta.env.BASE_URL;

export function readSession(): DialerSession | null {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "null");
    if (!value || typeof value !== "object") return null;
    const session = value as Partial<DialerSession>;
    if (typeof session.username !== "string" || !session.username ||
        typeof session.authKey !== "string" || !session.authKey ||
        typeof session.taskDefinitionKey !== "string") return null;
    return session as DialerSession;
  } catch {
    return null;
  }
}

export function saveSession(session: DialerSession): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    throw new CrmError(400, "Browser session storage is unavailable. Allow site storage to sign in.");
  }
}

export function clearSession(): void {
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* Storage may be blocked. */ }
}

function asObject(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function unwrap(value: unknown): unknown {
  const object = asObject(value);
  if (Object.hasOwn(object, "data")) return object.data;
  if (Object.hasOwn(object, "C_DATA")) return object.C_DATA;
  return value;
}

function signalExpiredSession(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("dialer:unauthorized"));
}

async function postService(
  service: "app" | "bpm",
  serviceKey: string,
  body: unknown,
  authKey?: string,
  signal?: AbortSignal,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(
      `${BASE_PATH}${service}/service?service.key=${encodeURIComponent(serviceKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(authKey ? { AUTH_KEY: authKey } : {}),
        },
        body: JSON.stringify(body),
        signal,
      },
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new CrmError(0, "Cannot reach Appflexor. Check your connection and try again.");
  }
  if (response.status === 401 || response.status === 403) {
    if (authKey) signalExpiredSession();
    throw new CrmError(401, "Your Appflexor session has expired or access was denied. Sign in again.");
  }

  const text = await response.text();
  let payload: unknown;
  try {
    payload = text.trim() ? JSON.parse(text) : null;
  } catch {
    throw new CrmError(502, "Appflexor returned an unreadable response.");
  }
  const object = asObject(payload);
  const statusText = String(object.C_STATUS ?? object.status ?? "").toUpperCase();
  const unauthorized = response.status === 401 || response.status === 403 ||
    statusText === "UNAUTHORIZED" || statusText === "UNAUTHORISED";
  if (unauthorized && authKey) signalExpiredSession();
  if (!response.ok || unauthorized ||
      ["FAIL", "FAILED", "FAILURE", "ERROR"].includes(statusText)) {
    const message = String(object.C_MESSAGE ?? object.message ??
      (unauthorized ? "Your Appflexor session has expired. Sign in again." : "Appflexor could not process this request."));
    throw new CrmError(
      unauthorized || serviceKey === "login" ? 401 : response.ok ? 502 : response.status,
      message.slice(0, 500),
    );
  }
  return payload;
}

export async function loginToCrm(
  username: string,
  password: string,
  taskDefinitionKey = "",
): Promise<DialerSession> {
  const payload = asObject(await postService("app", "login", { username, password }));
  const authKey = asObject(payload.C_DATA).AUTH_KEY ?? payload.AUTH_KEY;
  if (typeof authKey !== "string" || !authKey) {
    throw new CrmError(401, "Appflexor did not return a valid login session.");
  }

  const profile = asObject(unwrap(await postService("app", "masterKey.tenantData", {
    dataKeys: [{ serviceParams: "", dataKey: "profile", serviceKey: "sys.user.profile", mode: "formData" }],
  }, authKey)));
  const firstProfile = Array.isArray(profile.profile) ? asObject(profile.profile[0]) : {};
  const canonicalUsername = typeof firstProfile.username === "string" && firstProfile.username
    ? firstProfile.username
    : username;

  return { username: canonicalUsername, authKey, taskDefinitionKey };
}

async function bpmRequest(
  session: DialerSession,
  path: string,
  method = "GET",
  data: unknown = {},
  signal?: AbortSignal,
): Promise<unknown> {
  const result = unwrap(await postService(
    "bpm",
    "bpm.data",
    { method, path, data },
    session.authKey,
    signal,
  ));
  const object = asObject(result);
  if (typeof object.type === "string" && /exception|error/i.test(object.type)) {
    throw new CrmError(502, String(object.message ?? "The process engine rejected this request.").slice(0, 500));
  }
  return result;
}

const FIELD_ALIASES = {
  name: ["lead_name", "leadName", "customer_name", "customerName", "full_name", "fullName", "name"],
  phone: ["phone_number", "phoneNumber", "phone", "mobile_number", "mobileNumber", "mobile", "contact_number", "contactNumber"],
  status: ["status", "lead_status", "leadStatus", "call_status", "callStatus"],
  comments: ["comments", "comment", "call_comments", "callComments", "notes"],
  due: ["due_date", "dueDate", "due"],
} as const;

function findField(variables: Record<string, unknown>, aliases: readonly string[]) {
  const keys = Object.keys(variables);
  const key = aliases.map(alias => keys.find(item => item.toLowerCase() === alias.toLowerCase()))
    .find((item): item is string => item !== undefined);
  if (!key) return { key: aliases[0], value: "" };
  const raw = variables[key];
  const value = Object.hasOwn(asObject(raw), "value") ? asObject(raw).value : raw;
  return { key, value: typeof value === "string" || typeof value === "number" ? String(value) : "" };
}

function mapTask(task: Record<string, unknown>, variables: Record<string, unknown>): DialerTask {
  return {
    id: String(task.id),
    name: findField(variables, FIELD_ALIASES.name).value || String(task.name ?? "Unnamed lead"),
    phone: findField(variables, FIELD_ALIASES.phone).value,
    dueDate: typeof task.due === "string" ? task.due : findField(variables, FIELD_ALIASES.due).value || null,
    status: findField(variables, FIELD_ALIASES.status).value,
    comments: findField(variables, FIELD_ALIASES.comments).value,
    taskName: String(task.name ?? "Lead dialing"),
    created: typeof task.created === "string" ? task.created : null,
  };
}

async function variablesFor(session: DialerSession, id: string, signal?: AbortSignal) {
  const result = await bpmRequest(
    session,
    `/task/${encodeURIComponent(id)}/variables?deserializeValues=false`,
    "GET",
    {},
    signal,
  );
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new CrmError(502, "Appflexor returned invalid task variables.");
  }
  return asObject(result);
}

export async function getTaskList(
  session: DialerSession,
  kind: "assigned" | "available",
  signal?: AbortSignal,
): Promise<DialerTaskList> {
  const path = kind === "assigned"
    ? `/task?assignee=${encodeURIComponent(session.username)}`
    : "/task?candidateGroup=DIALER_APP&unassigned=true";
  const response = await bpmRequest(session, path, "GET", {}, signal);
  if (!Array.isArray(response)) throw new CrmError(502, "Appflexor returned an invalid task list.");

  const rows = response.slice(0, 100);
  const tasks: DialerTask[] = [];
  for (let offset = 0; offset < rows.length; offset += 5) {
    const batch = await Promise.all(rows.slice(offset, offset + 5).map(async raw => {
      const task = asObject(raw);
      if (typeof task.id !== "string" || !task.id) {
        throw new CrmError(502, "Appflexor returned a task without an id.");
      }
      if (kind === "assigned" && task.assignee !== session.username) {
        throw new CrmError(502, "Appflexor returned a task outside your assignment.");
      }
      if (kind === "available" && task.assignee != null && task.assignee !== "") {
        throw new CrmError(502, "Appflexor returned an assigned task in the available queue.");
      }
      const lead = mapTask(task, await variablesFor(session, task.id, signal));
      if (session.taskDefinitionKey && kind === "assigned" &&
          task.taskDefinitionKey !== session.taskDefinitionKey) return null;
      return /^\+?[\d\s().-]+$/.test(lead.phone) && /\d/.test(lead.phone) ? lead : null;
    }));
    tasks.push(...batch.filter((task): task is DialerTask => task !== null));
  }
  return { tasks, hasMore: response.length > 100, scannedCount: rows.length };
}

export async function getAssignedTask(
  session: DialerSession,
  id: string,
  signal?: AbortSignal,
): Promise<DialerTask> {
  const raw = asObject(await bpmRequest(session, `/task/${encodeURIComponent(id)}`, "GET", {}, signal));
  if (!raw.id) throw new CrmError(404, "This task is no longer available.");
  if (raw.assignee !== session.username ||
      (session.taskDefinitionKey && raw.taskDefinitionKey !== session.taskDefinitionKey)) {
    throw new CrmError(403, "This dialing task is not assigned to you.");
  }
  const task = mapTask(raw, await variablesFor(session, id, signal));
  if (!task.phone || !/^\+?[\d\s().-]+$/.test(task.phone)) {
    throw new CrmError(400, "This task does not contain a valid lead phone number.");
  }
  return task;
}

export async function completeAssignedTask(
  session: DialerSession,
  id: string,
  status: Outcome,
  comments: string,
): Promise<DialerCompletion> {
  if (!isOutcome(status) || comments.length > 10000) {
    throw new CrmError(400, "Choose HOT, RECALL or REJECTION and provide comments of up to 10000 characters.");
  }
  const raw = asObject(await bpmRequest(session, `/task/${encodeURIComponent(id)}`, "GET"));
  if (!raw.id) throw new CrmError(404, "This task is no longer available.");
  if (raw.assignee !== session.username ||
      (session.taskDefinitionKey && raw.taskDefinitionKey !== session.taskDefinitionKey)) {
    throw new CrmError(403, "This dialing task is not assigned to you.");
  }
  const variables = await variablesFor(session, id);
  if (!mapTask(raw, variables).phone) throw new CrmError(400, "This is not a lead dialing task.");
  const statusKey = findField(variables, FIELD_ALIASES.status).key;
  const commentsKey = findField(variables, FIELD_ALIASES.comments).key;
  await bpmRequest(session, `/task/${encodeURIComponent(id)}/complete`, "POST", {
    variables: {
      [statusKey]: { value: status, type: "String" },
      [commentsKey]: { value: comments, type: "String" },
    },
  });
  return { id, completed: true };
}

export async function logoutFromCrm(session: DialerSession): Promise<void> {
  try {
    await postService("app", "logout", {}, session.authKey);
  } catch {
    // Clear the local browser session even if the upstream logout endpoint is unavailable.
  }
}

export const assignedTasksKey = ["crm", "assigned-tasks"] as const;
export const availableTasksKey = ["crm", "available-tasks"] as const;
export const taskDetailKey = (id: string) => ["crm", "task", id] as const;
