export const OUTCOMES = ["RECALL", "DEMO", "VISIT", "BOARD", "COLD", "CLOSE"] as const;
export type Outcome = (typeof OUTCOMES)[number];

export const OUTCOME_META: Record<Outcome, { label: string; hint: string; color: string }> = {
  RECALL: { label: "Recall", hint: "Call back later", color: "var(--recall)" },
  DEMO: { label: "Demo", hint: "Schedule a product demo", color: "var(--primary)" },
  VISIT: { label: "Visit", hint: "Schedule an in-person visit", color: "var(--accent)" },
  BOARD: { label: "Board", hint: "Move to the board", color: "var(--primary)" },
  COLD: { label: "Cold", hint: "No current interest", color: "var(--muted-foreground)" },
  CLOSE: { label: "Close", hint: "Close the opportunity", color: "var(--destructive)" },
};

export function isOutcome(v: unknown): v is Outcome {
  return typeof v === "string" && (OUTCOMES as readonly string[]).includes(v);
}

export function isScheduledOutcome(v: unknown): boolean {
  return v === "RECALL" || v === "DEMO" || v === "VISIT";
}

/** Leading + allowed, then digits, spaces, ( ) - only. Returns null if not a usable number. */
export function sanitizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!/^\+?[0-9\s()\-]+$/.test(trimmed)) return null;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 3) return null;
  return (trimmed.startsWith("+") ? "+" : "") + digits;
}

export function telHref(raw: string | null | undefined): string | null {
  const s = sanitizePhone(raw);
  return s ? `tel:${s}` : null;
}

export function errStatus(e: unknown): number | undefined {
  const s = (e as { status?: unknown } | null)?.status;
  return typeof s === "number" ? s : undefined;
}

export function errMessage(e: unknown, fallback = "Something went wrong."): string {
  const status = errStatus(e);
  const data = (e as { data?: { error?: unknown } } | null)?.data;
  if (data && typeof data.error === "string" && data.error) return data.error;
  if (status === undefined) {
    if (typeof navigator !== "undefined" && !navigator.onLine) return "You are offline. Reconnect and try again.";
    return "Cannot reach the dialer service. Check your connection and try again.";
  }
  if (status === 401) return "Your session has ended. Sign in again.";
  if (status >= 500) return "The Appflexor service is not responding right now. Try again shortly.";
  return fallback;
}

export function formatDate(v: string | null | undefined, withTime = false): string | null {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleString(undefined, withTime
    ? { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "numeric", month: "short", year: "numeric" });
}

/** Convert a CRM ISO timestamp to the value expected by datetime-local inputs. */
export function toDateTimeLocal(v: string | null | undefined): string {
  if (!v) return "";
  const date = new Date(v);
  if (Number.isNaN(date.getTime())) return "";
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export function isOverdue(v: string | null | undefined): boolean {
  if (!v) return false;
  const d = new Date(v);
  return !isNaN(d.getTime()) && d.getTime() < Date.now();
}

/* Drafts — sessionStorage only, keyed by user + task */
const PREFIX = "dialer:draft:";
export type Draft = { status: Outcome | ""; comments: string; recallDateTime: string };
const key = (user: string, id: string) => `${PREFIX}${encodeURIComponent(user)}:${id}`;

export function loadDraft(user: string, id: string): Draft | null {
  try {
    const raw = sessionStorage.getItem(key(user, id));
    if (!raw) return null;
    const p = JSON.parse(raw);
    return {
      status: isOutcome(p.status) ? p.status : "",
      comments: typeof p.comments === "string" ? p.comments : "",
      recallDateTime: typeof p.recallDateTime === "string" ? p.recallDateTime : "",
    };
  } catch { return null; }
}
export function saveDraft(user: string, id: string, d: Draft) {
  try { sessionStorage.setItem(key(user, id), JSON.stringify(d)); } catch { /* storage full or blocked */ }
}
export function removeDraft(user: string, id: string) {
  try { sessionStorage.removeItem(key(user, id)); } catch { /* ignore */ }
}
export function hasDraft(user: string, id: string) {
  try { return sessionStorage.getItem(key(user, id)) !== null; } catch { return false; }
}
export function clearAllDrafts() {
  try {
    const ks: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) { const k = sessionStorage.key(i); if (k?.startsWith(PREFIX)) ks.push(k); }
    ks.forEach((k) => sessionStorage.removeItem(k));
  } catch { /* ignore */ }
}
