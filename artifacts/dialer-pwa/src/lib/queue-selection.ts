import type { DialerTask } from "./crm";
import { telHref } from "./dialer";

export type TaskFilter = "ALL" | "HOT" | "RECALL" | "REJECTION" | "UNSET";
export const DEFAULT_TASK_FILTER: TaskFilter = "UNSET";
const FILTER_STORAGE_PREFIX = "dialer:task-filter:";

function isTaskFilter(value: unknown): value is TaskFilter {
  return value === "ALL" || value === "HOT" || value === "RECALL" ||
    value === "REJECTION" || value === "UNSET";
}

export function readTaskFilterPreference(username: string, storage: Pick<Storage, "getItem"> | null): TaskFilter {
  try {
    const stored = storage?.getItem(`${FILTER_STORAGE_PREFIX}${encodeURIComponent(username)}`);
    return isTaskFilter(stored) ? stored : DEFAULT_TASK_FILTER;
  } catch {
    return DEFAULT_TASK_FILTER;
  }
}

export function saveTaskFilterPreference(
  username: string, filter: TaskFilter, storage: Pick<Storage, "setItem"> | null,
): void {
  try {
    storage?.setItem(`${FILTER_STORAGE_PREFIX}${encodeURIComponent(username)}`, filter);
  } catch {
    // Session storage can be blocked; the in-memory selection still works.
  }
}

export function matchesQueueFilters(task: DialerTask, filter: TaskFilter, search: string): boolean {
  if (filter === "UNSET" ? !!task.status : filter !== "ALL" && task.status !== filter) return false;
  const text = search.trim().toLowerCase();
  if (!text) return true;
  const digits = text.replace(/\D/g, "");
  return task.name.toLowerCase().includes(text) || task.taskName.toLowerCase().includes(text) ||
    (digits.length > 0 && task.phone.replace(/\D/g, "").includes(digits));
}

export function nextQueueTask(
  tasks: DialerTask[], completedId: string, filter: TaskFilter, search: string,
  previousOrder: string[] = [],
): DialerTask | undefined {
  const eligible = tasks.filter(task =>
    task.id !== completedId && matchesQueueFilters(task, filter, search) && telHref(task.phone));
  const index = previousOrder.indexOf(completedId);
  if (index < 0) return eligible[0];
  const sequence = [...previousOrder.slice(index + 1), ...previousOrder.slice(0, index)];
  const byId = new Map(eligible.map(task => [task.id, task]));
  for (const id of sequence) {
    const task = byId.get(id);
    if (task) return task;
  }
  return eligible[0];
}
