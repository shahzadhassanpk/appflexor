import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";

function moduleUrl(source) {
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  });
  return `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
}
const dialerUrl = moduleUrl(await readFile(new URL("../src/lib/dialer.ts", import.meta.url), "utf8"));
const source = (await readFile(new URL("../src/lib/queue-selection.ts", import.meta.url), "utf8"))
  .replace('"./dialer"', JSON.stringify(dialerUrl));
const {
  DEFAULT_TASK_FILTER, nextQueueTask, matchesQueueFilters,
  readTaskFilterPreference, saveTaskFilterPreference,
} = await import(moduleUrl(source));
const lead = (id, status, phone = "+15550101001") => ({
  id, status, phone, name: `Lead ${id}`, taskName: "Call Customer",
});
const tasks = [lead("hot", "HOT"), lead("recall-1", "RECALL"), lead("unset", ""),
  lead("recall-no-phone", "RECALL", ""), lead("recall-2", "RECALL"), lead("rejection", "REJECTION")];

test("auto-dial stays in each selected status", () => {
  for (const [filter, id] of [["UNSET", "unset"], ["RECALL", "recall-1"], ["HOT", "hot"], ["REJECTION", "rejection"], ["ALL", "hot"]]) {
    assert.equal(nextQueueTask(tasks, "completed", filter, "")?.id, id);
  }
});
test("auto-dial follows the existing sequence rather than switching status or restarting", () => {
  const order = tasks.map(task => task.id);
  assert.equal(nextQueueTask(tasks.slice().reverse(), "recall-1", "RECALL", "", order)?.id, "recall-2");
  assert.equal(nextQueueTask(tasks, "recall-2", "RECALL", "", order)?.id, "recall-1");
});
test("auto-dial stops when the selected status has no remaining dialable tasks", () => {
  assert.equal(nextQueueTask(tasks, "unset", "UNSET", ""), undefined);
  assert.equal(nextQueueTask(tasks.filter(t => t.id !== "recall-2"), "recall-1", "RECALL", ""), undefined);
});
test("auto-dial uses the same search criteria as the displayed list", () => {
  assert.equal(nextQueueTask(tasks, "completed", "RECALL", "recall-2")?.id, "recall-2");
  assert.equal(nextQueueTask(tasks, "completed", "HOT", "recall-2"), undefined);
  assert.equal(matchesQueueFilters(lead("changed", "HOT"), "RECALL", ""), false);
  assert.equal(matchesQueueFilters(lead("phone", "RECALL", "+1 (555) 010-1001"), "RECALL", "555010"), true);
});
test("selected status filter defaults to Unset and persists per user for the session", () => {
  const values = new Map();
  const storage = {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
  };
  assert.equal(DEFAULT_TASK_FILTER, "UNSET");
  assert.equal(readTaskFilterPreference("agent one", storage), "UNSET");
  saveTaskFilterPreference("agent one", "RECALL", storage);
  assert.equal(readTaskFilterPreference("agent one", storage), "RECALL");
  assert.equal(readTaskFilterPreference("agent two", storage), "UNSET");
  values.set("dialer:task-filter:agent%20one", "NOT_A_FILTER");
  assert.equal(readTaskFilterPreference("agent one", storage), "UNSET");
  assert.equal(readTaskFilterPreference("agent one", {
    getItem() { throw new Error("storage blocked"); },
  }), "UNSET");
});
