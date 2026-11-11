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
  recallDateTime: string;
  taskName: string;
  created: string | null;
  detailsError?: string;
  businessKey?: string;
  processInstanceId?: string;
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
  const envelopes = [asObject(payload)];
  let inner = unwrap(payload);
  for (let depth = 0; depth < 3 && inner && typeof inner === "object" && !Array.isArray(inner); depth++) {
    envelopes.push(asObject(inner));
    const next = unwrap(inner);
    if (next === inner) break;
    inner = next;
  }
  const failureStatuses = ["UNAUTHORIZED", "UNAUTHORISED", "FAIL", "FAILED", "FAILURE", "ERROR"];
  const object = envelopes.find(item =>
    failureStatuses.includes(String(item.C_STATUS ?? item.status ?? "").toUpperCase())) ?? envelopes[0];
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

function findField(variables: Record<string, unknown>, aliases: readonly string[], skipEmpty = false) {
  const keys = Object.keys(variables);
  for (const alias of aliases) {
    const key = keys.find(item => item.toLowerCase() === alias.toLowerCase());
    if (!key) continue;
    const raw = variables[key];
    const value = Object.hasOwn(asObject(raw), "value") ? asObject(raw).value : raw;
    const text = typeof value === "string" || typeof value === "number" ? String(value) : "";
    if (skipEmpty && !text.trim()) continue;
    return { key, value: skipEmpty ? text.trim() : text };
  }
  return { key: aliases[0], value: "" };
}

function taskDueDate(task: Record<string, unknown>, variables: Record<string, unknown>): string | null {
  for (const field of ["due", "dueDate", "due_date"]) {
    const value = task[field];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return findField(variables, FIELD_ALIASES.due, true).value || null;
}

function mapTask(task: Record<string, unknown>, variables: Record<string, unknown>): DialerTask {
  const dueDate = taskDueDate(task, variables);
  return {
    id: String(task.id),
    name: findField(variables, FIELD_ALIASES.name, true).value || String(task.name ?? "Unnamed lead"),
    phone: findField(variables, FIELD_ALIASES.phone, true).value,
    dueDate,
    status: findField(variables, FIELD_ALIASES.status, true).value,
    comments: findField(variables, FIELD_ALIASES.comments).value,
    recallDateTime: dueDate ?? "",
    taskName: String(task.name ?? "Lead dialing"),
    created: typeof task.created === "string" ? task.created : null,
    businessKey: findField(variables, ["business_key", "businessKey"], true).value ||
      (typeof task.businessKey === "string" ? task.businessKey : ""),
    processInstanceId: typeof task.processInstanceId === "string" ? task.processInstanceId : undefined,
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

async function variablesForTasks(
  session: DialerSession,
  tasks: Record<string, unknown>[],
  signal?: AbortSignal,
): Promise<Map<string, { variables?: Record<string, unknown>; error?: unknown }>> {
  if (!tasks.length) return new Map();
  const keys = tasks.map(task => ({
    key: `task_${String(task.id)}`,
    request: {
      method: "GET",
      path: `/task/${encodeURIComponent(String(task.id))}/variables?deserializeValues=false`,
      data: {},
    },
  }));
  const response = asObject(await postService(
    "bpm",
    "bpm.multiKey.data",
    { dataKeys: keys },
    session.authKey,
    signal,
  ));
  const results = new Map<string, { variables?: Record<string, unknown>; error?: unknown }>();
  tasks.forEach(task => {
    const id = String(task.id);
    const key = `task_${id}`;
    const envelope = asObject(response[key] ?? asObject(response.C_DATA)[key] ?? asObject(response.data)[key]);
    const value = unwrap(envelope);
    const valueObject = asObject(value);
    const resultStatus = String(valueObject.type ?? valueObject.status ?? "");
    if (/exception|error|failed|failure/i.test(resultStatus)) {
      results.set(id, { error: new CrmError(502, String(valueObject.message ?? "Could not load task variables.")) });
    } else if (Object.keys(valueObject).length) {
      results.set(id, { variables: valueObject });
    } else {
      results.set(id, { error: new CrmError(502, "Appflexor returned invalid task variables.") });
    }
  });
  return results;
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

  const rows = response.slice(0, 100).map(asObject);
  rows.forEach(task => {
    if (typeof task.id !== "string" || !task.id) {
      throw new CrmError(502, "Appflexor returned a task without an id.");
    }
    if (kind === "assigned" && task.assignee !== session.username) {
      throw new CrmError(502, "Appflexor returned a task outside your assignment.");
    }
    if (kind === "available" && task.assignee != null && task.assignee !== "") {
      throw new CrmError(502, "Appflexor returned an assigned task in the available queue.");
    }
  });
  const eligibleRows = rows.filter(task => !(session.taskDefinitionKey && kind === "assigned" && task.taskDefinitionKey !== session.taskDefinitionKey));
  let variableResults: Map<string, { variables?: Record<string, unknown>; error?: unknown }>;
  try {
    variableResults = await variablesForTasks(session, eligibleRows, signal);
  } catch (error) {
    if (kind !== "available" || signal?.aborted ||
        (error instanceof DOMException && error.name === "AbortError") ||
        (error instanceof CrmError && error.status === 401)) throw error;
    variableResults = new Map(eligibleRows.map(task => [String(task.id), { error }]));
  }
  const tasks: DialerTask[] = [];
  eligibleRows.forEach(task => {
      const result = variableResults.get(String(task.id));
      if (result?.error && kind !== "available") throw result.error;
      const variables = result?.variables || {};
      const detailsError = result?.error instanceof Error ? result.error.message : undefined;
      const lead = mapTask(task, variables);
      // Some task-list responses omit a due date that the task-detail API
      // already returns after a successful RECALL save.
      if (kind === "assigned" && lead.status === "RECALL" && !lead.dueDate) {
        // The queue variables are already batched; task-level due dates are
        // still read from the task response when available.
        lead.dueDate = taskDueDate(task, variables);
        lead.recallDateTime = lead.dueDate ?? "";
      }
      tasks.push(kind === "available" ? { ...lead, ...(detailsError ? { detailsError } : {}) } : lead);
  });
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
  return mapTask(raw, await variablesFor(session, id, signal));
}

export async function claimTask(session: DialerSession, id: string): Promise<void> {
  // Camunda's atomic claim operation arbitrates races between agents.
  await bpmRequest(session, `/task/${encodeURIComponent(id)}/claim`, "POST", { userId: session.username });
}

export async function claimAvailableTask(session: DialerSession, id: string): Promise<DialerTask> {
  await claimTask(session, id);
  try {
    return await getAssignedTask(session, id);
  } catch (error) {
    if (error instanceof CrmError && error.status === 401) throw error;
    throw new CrmError(502, `The task was claimed, but its details could not be loaded. Refresh Assigned to reopen it. ${error instanceof Error ? error.message : ""}`);
  }
}

// Retain the last successful save in this browser session. Completion retries
// must not create a second log after a confirmed save and a failed completion.
const savedLogs = new Map<string, string>();

function saveKey(session: DialerSession, task: DialerTask) {
  return JSON.stringify([session.username, session.authKey, task.id]);
}

function validateLog(status: Outcome, comments: string) {
  if (!isOutcome(status) || comments.length > 10000) {
    throw new CrmError(400, "Choose HOT, RECALL or REJECTION and provide comments of up to 10000 characters.");
  }
}

function recallDateTimeToIso(value: string): string {
  const parsed = value ? new Date(value) : new Date(Number.NaN);
  if (!Number.isFinite(parsed.getTime())) {
    throw new CrmError(400, "Choose a valid next-call date and time for a RECALL.");
  }
  const pad = (part: number) => String(part).padStart(2, "0");
  const offset = -parsed.getTimezoneOffset();
  const zone = `${offset >= 0 ? "+" : "-"}${pad(Math.floor(Math.abs(offset) / 60))}${pad(Math.abs(offset) % 60)}`;
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}` +
    `T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}:${pad(parsed.getSeconds())}.000${zone}`;
}

async function ownedTaskWithBusinessKey(session: DialerSession, id: string): Promise<DialerTask> {
  const task = await getAssignedTask(session, id);
  if (!task.businessKey && task.processInstanceId) {
    const instance = asObject(await bpmRequest(session, `/process-instance/${encodeURIComponent(task.processInstanceId)}`));
    task.businessKey = typeof instance.businessKey === "string" ? instance.businessKey : "";
  }
  if (!task.businessKey) {
    throw new CrmError(400, "This task has no business key. Add business_key/businessKey to its variables or set the process instance business key before saving.");
  }
  return task;
}

export async function saveDialerLog(
  session: DialerSession,
  task: DialerTask,
  status: Outcome,
  comments: string,
  recallDateTime = "",
): Promise<void> {
  validateLog(status, comments);
  const recallIso = status === "RECALL" ? recallDateTimeToIso(recallDateTime) : "";
  const current = await ownedTaskWithBusinessKey(session, task.id);
  const fields = {
    id: task.id,
    name: current.name,
    phone: current.phone,
    status,
    comments,
    business_key: current.businessKey,
  };
  const fingerprint = JSON.stringify(fields);
  const key = saveKey(session, task);
  if (savedLogs.get(key) !== fingerprint) {
    const payload = await postService("app", "update.formData", {
      datasource: "",
      saveOrUpdate: "Yes",
      data: [{
        formId: "dialer_log",
        entity: "dialer_log",
        action: "update",
        mode: "formData",
        id: task.id,
        fileData: [],
        formData: fields,
      }],
    }, session.authKey);
    const object = asObject(payload);
    if (String(object.C_STATUS ?? object.status ?? "").toUpperCase() !== "SUCCESS") {
      throw new CrmError(502, "Appflexor did not confirm that the dialer log was saved. The task was not completed.");
    }
    savedLogs.set(key, fingerprint);
  }
  try {
    await bpmRequest(session, `/task/${encodeURIComponent(task.id)}/variables`, "POST", {
      modifications: {
        status: { value: status, type: "String" },
        comments: { value: comments, type: "String" },
      },
    });
    const confirmed = await variablesFor(session, task.id);
    if (findField(confirmed, ["status"], true).value !== status) {
      throw new CrmError(502, "Appflexor did not return the saved status when the task variables were reloaded.");
    }
    if (findField(confirmed, ["comments"]).value !== comments) {
      throw new CrmError(502, "Appflexor did not return the saved comments when the task variables were reloaded.");
    }
    if (status === "RECALL") {
      const path = `/task/${encodeURIComponent(task.id)}`;
      const before = asObject(await bpmRequest(session, path));
      if (before.assignee !== session.username) {
        throw new CrmError(409, "This task is no longer assigned to you. Refresh before saving.");
      }
      // Camunda's PUT updates the full task, not just the supplied fields.
      // Preserve all writable task properties; never reassign an unowned task.
      const writableFields = [
        "name", "description", "assignee", "owner", "delegationState",
        "followUp", "priority", "parentTaskId", "caseInstanceId", "tenantId",
      ];
      const update = Object.fromEntries(writableFields
        .filter(field => Object.hasOwn(before, field))
        .map(field => [field, before[field]]));
      await bpmRequest(session, path, "PUT", { ...update, due: recallIso });
      const updatedTask = asObject(await bpmRequest(session, path));
      if (updatedTask.assignee !== session.username) {
        throw new CrmError(409, "The due-date update did not preserve your task assignment. The task was not completed; refresh your queue.");
      }
      const updatedDue = taskDueDate(updatedTask, {});
      if (!updatedDue || new Date(updatedDue).getTime() !== new Date(recallIso).getTime()) {
        throw new CrmError(502, "Appflexor did not return the updated task due date.");
      }
    }
  } catch (error) {
    if (error instanceof CrmError && error.status === 401) throw error;
    throw new CrmError(error instanceof CrmError ? error.status : 502,
      `The dialer log was saved, but updating task status, comments or due date failed. Retry Save to update the task without creating another identical log. The task was not completed. ${error instanceof Error ? error.message : ""}`);
  }
}

export async function completeDialerTask(
  session: DialerSession,
  task: DialerTask,
  status: Outcome,
  comments: string,
  recallDateTime = "",
): Promise<DialerCompletion> {
  await saveDialerLog(session, task, status, comments, recallDateTime);
  try {
    const current = await ownedTaskWithBusinessKey(session, task.id);
    const payload = await postService("bpm", "complete.task", {
      path: `/task/${encodeURIComponent(task.id)}/complete`,
      method: "POST",
      data: {
        businessKey: current.businessKey,
        variables: { status: { value: status } },
      },
    }, session.authKey);
    const result = asObject(unwrap(payload));
    if (typeof result.type === "string" && /exception|error/i.test(result.type)) {
      throw new CrmError(502, String(result.message ?? "The process engine rejected completion."));
    }
  } catch (error) {
    if (error instanceof CrmError && error.status === 401) throw error;
    throw new CrmError(error instanceof CrmError ? error.status : 502,
      `The dialer log was saved, but task completion failed. Your task remains assigned; retry Complete without changing the fields to reuse the saved log. ${error instanceof Error ? error.message : ""}`);
  }
  savedLogs.delete(saveKey(session, task));
  return { id: task.id, completed: true };
}

export async function completeAssignedTask(
  session: DialerSession, id: string, status: Outcome, comments: string, recallDateTime = "",
): Promise<DialerCompletion> {
  const task = await getAssignedTask(session, id);
  return completeDialerTask(session, task, status, comments, recallDateTime || task.recallDateTime);
}

export async function logoutFromCrm(session: DialerSession): Promise<void> {
  savedLogs.clear();
  try {
    await postService("app", "logout", {}, session.authKey);
  } catch {
    // Clear the local browser session even if the upstream logout endpoint is unavailable.
  }
}

export const assignedTasksKey = ["crm", "assigned-tasks"] as const;
export const availableTasksKey = ["crm", "available-tasks"] as const;
export const taskDetailKey = (id: string) => ["crm", "task", id] as const;
