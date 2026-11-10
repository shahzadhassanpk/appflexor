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
const source = (await readFile(new URL("../src/lib/crm.ts", import.meta.url), "utf8"))
  .replace('"@/lib/dialer"', JSON.stringify(dialerUrl))
  .replace("import.meta.env.BASE_URL", '"/dialer/"');
const { getTaskList } = await import(moduleUrl(source));
const session = { username: "agent", authKey: "synthetic-test-token", taskDefinitionKey: "" };
const task = {
  id: "available-task", name: "Call Customer", assignee: null,
  taskDefinitionKey: "Activity_1lih84z", due: null, formKey: "dialer_log",
};

test("available task cards do not depend on phone variables", async (t) => {
  for (const scenario of [
    { label: "no variables", variables: {} },
    { label: "unrecognized phone format", variables: { phone: { value: "not supplied" } } },
    { label: "valid lead variables", variables: { phone: { value: "+12025550100" } } },
    { label: "variable service failure", failure: true },
  ]) {
    await t.test(scenario.label, async () => {
      const calls = [];
      t.mock.method(globalThis, "fetch", async (url, options) => {
        assert.equal(url, "/dialer/bpm/service?service.key=bpm.data");
        assert.equal(options.headers.AUTH_KEY, session.authKey);
        const body = JSON.parse(options.body);
        calls.push(body);
        if (body.path === "/task?candidateGroup=DIALER_APP&unassigned=true") {
          return Response.json({ data: [task], status: "SUCCESS" });
        }
        assert.equal(body.path, "/task/available-task/variables?deserializeValues=false");
        return Response.json(scenario.failure
          ? { status: "FAIL", message: "Variables unavailable" }
          : { status: "SUCCESS", data: scenario.variables });
      });
      try {
        const result = await getTaskList(session, "available");
        assert.equal(result.tasks.length, 1);
        assert.equal(result.tasks[0].name, "Call Customer");
        assert.equal(result.tasks[0].id, task.id);
        assert.equal(result.scannedCount, 1);
        assert.equal(Boolean(result.tasks[0].detailsError), Boolean(scenario.failure));
        assert.deepEqual(calls[0], {
          method: "GET", path: "/task?candidateGroup=DIALER_APP&unassigned=true", data: {},
        });
      } finally {
        t.mock.restoreAll();
      }
    });
  }
});
