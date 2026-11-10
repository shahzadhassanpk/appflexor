// Match the Dialer Vite proxy; production API calls use the same CRM deployment.
const APPFLEXOR_ORIGIN = "https://crm.step2agility.com";

export class DialerError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type JsonObject = Record<string, unknown>;
export function asObject(value: unknown): JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as JsonObject
    : {};
}

export async function upstream(
  service: "app" | "bpm",
  key: string,
  body: unknown,
  token?: string,
): Promise<unknown> {
  let response: globalThis.Response;
  try {
    response = await fetch(`${APPFLEXOR_ORIGIN}/${service}/service?service.key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { AUTH_KEY: token } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(25000),
      redirect: "error",
    });
  } catch {
    throw new DialerError(502, "Appflexor is not reachable. Check your connection and try again.");
  }
  if (response.status === 401 || response.status === 403) {
    throw new DialerError(401, "Your Appflexor session has expired or access was denied. Sign in again.");
  }
  if (response.status === 404) {
    throw new DialerError(404, "This task is no longer available. Refresh your task list.");
  }
  const text = await response.text();
  let payload: unknown = null;
  try {
    payload = text.trim() ? JSON.parse(text) : null;
  } catch {
    throw new DialerError(502, "Appflexor returned an unreadable response. Please try again.");
  }
  const object = asObject(payload);
  const status = String(object.C_STATUS ?? object.status ?? "").toUpperCase();
  if (["UNAUTHORIZED", "UNAUTHORISED"].includes(status)) {
    throw new DialerError(401, "Your Appflexor session has expired. Sign in again.");
  }
  if (!response.ok || ["FAIL", "FAILED", "FAILURE", "ERROR"].includes(status)) {
    const message = String(object.C_MESSAGE ?? object.message ?? "Appflexor could not process this request.").slice(0, 500);
    throw new DialerError(key === "login" ? 401 : response.status === 409 ? 409 : 502, message);
  }
  return payload;
}

export function unwrap(payload: unknown): unknown {
  const object = asObject(payload);
  if (Object.hasOwn(object, "data")) return object.data;
  if (Object.hasOwn(object, "C_DATA")) return object.C_DATA;
  return payload;
}

export async function bpm(token: string, path: string, method = "GET", data: unknown = {}): Promise<unknown> {
  const result = unwrap(await upstream("bpm", "bpm.data", { path, method, data }, token));
  const object = asObject(result);
  if (typeof object.type === "string" && /exception|error/i.test(object.type)) {
    throw new DialerError(502, String(object.message ?? "The process engine rejected this request.").slice(0, 500));
  }
  return result;
}

const FIELD_ALIASES = {
  name: ["lead_name", "leadName", "customer_name", "customerName", "full_name", "fullName", "name"],
  phone: ["phone_number", "phoneNumber", "phone", "mobile_number", "mobileNumber", "mobile", "contact_number", "contactNumber"],
  status: ["status", "lead_status", "leadStatus", "call_status", "callStatus"],
  comments: ["comments", "comment", "call_comments", "callComments", "notes"],
  due: ["due_date", "dueDate", "due"],
};

export function findField(variables: JsonObject, aliases: string[]): { key: string; value: string } {
  const allKeys = Object.keys(variables);
  const key = aliases.map(alias => allKeys.find(item => item.toLowerCase() === alias.toLowerCase()))
    .find(item => item !== undefined);
  if (!key) return { key: aliases[0]!, value: "" };
  const raw = variables[key];
  const value = Object.hasOwn(asObject(raw), "value") ? asObject(raw).value : raw;
  return { key, value: typeof value === "string" || typeof value === "number" ? String(value) : "" };
}

export function mapLead(task: JsonObject, variables: JsonObject) {
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

export function outcomeVariables(variables: JsonObject, status: string, comments: string) {
  return {
    [findField(variables, FIELD_ALIASES.status).key]: { value: status, type: "String" },
    [findField(variables, FIELD_ALIASES.comments).key]: { value: comments, type: "String" },
  };
}
