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
const { getTaskList, claimAvailableTask, saveDialerLog, completeDialerTask } = await import(moduleUrl(source));
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
    {
      label: "CRM name with empty phone",
      variables: {
        phone: { valueInfo: {}, type: "String", value: "" },
        name: { valueInfo: {}, type: "String", value: "Demo Lead" },
        auditPrevVars: { valueInfo: {}, type: "String", value: "{}" },
      },
      expectedName: "Demo Lead", expectedPhone: "",
    },
    {
      label: "empty preferred fields fall back to name and phone",
      variables: {
        lead_name: { value: "  " }, phone_number: { value: null },
        name: { value: "Demo Lead" }, phone: { value: "+12025550100" },
      },
      expectedName: "Demo Lead", expectedPhone: "+12025550100",
    },
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
        assert.equal(result.tasks[0].name, scenario.expectedName ?? "Call Customer");
        if ("expectedPhone" in scenario) assert.equal(result.tasks[0].phone, scenario.expectedPhone);
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

test("claim, save and complete use the confirmed CRM contracts", async (t) => {
  const calls = [];
  const ownedTask = { ...task, assignee: session.username, processInstanceId: "process-1" };
  const variables = { name: { value: "Demo Lead" }, phone: { value: "" } };
  let saveFails = false;
  let completeFails = true;
  let claimFails = true;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    const body = JSON.parse(options.body);
    const key = new URL(url, "http://example.test").searchParams.get("service.key");
    calls.push({ key, body });
    if (key === "update.formData") {
      return Response.json(saveFails
        ? { C_STATUS: "FAILED", C_MESSAGE: "Save rejected" }
        : { C_STATUS: "SUCCESS", C_DATA: [{ formData: { id: "log-1" } }] });
    }
    if (key === "complete.task") {
      return Response.json(completeFails
        ? { data: { status: "FAIL", message: "Completion rejected" } }
        : { status: "SUCCESS" });
    }
    if (body.path.endsWith("/claim")) {
      if (claimFails) return Response.json({ message: "Already claimed" }, { status: 409 });
      assert.deepEqual(body.data, { userId: session.username });
      return new Response(null, { status: 204 });
    }
    if (body.path.includes("/variables?")) return Response.json({ status: "SUCCESS", data: variables });
    if (body.path === "/process-instance/process-1") {
      return Response.json({ status: "SUCCESS", data: { businessKey: "LEAD-001" } });
    }
    return Response.json({ status: "SUCCESS", data: ownedTask });
  });
  try {
    await assert.rejects(claimAvailableTask(session, task.id), /Already claimed/);
    assert.equal(calls.length, 1, "Failed claim must not load/dial a task");
    claimFails = false;
    const claimed = await claimAvailableTask(session, task.id);
    assert.equal(claimed.name, "Demo Lead");
    assert.equal(claimed.phone, "", "Tasks without phones can still be logged");

    saveFails = true;
    await assert.rejects(completeDialerTask(session, claimed, "HOT", "Interested"), /Save rejected/);
    assert.equal(calls.filter(c => c.key === "complete.task").length, 0);

    saveFails = false;
    await saveDialerLog(session, claimed, "HOT", "Interested");
    assert.equal(calls.filter(c => c.key === "complete.task").length, 0, "Save alone does not complete");
    const saved = calls.filter(c => c.key === "update.formData").at(-1).body;
    assert.deepEqual(saved, {
      saveOrUpdate: "Yes",
      data: [{
        formId: "dialer_log", entity: "dialer_log", action: "update",
        mode: "formData", id: "new", fileData: [],
        formData: { name: "Demo Lead", phone: "", status: "HOT", comments: "Interested", business_key: "LEAD-001" },
      }],
    });
    const successfulSaveCount = calls.filter(c => c.key === "update.formData").length;
    await assert.rejects(completeDialerTask(session, claimed, "HOT", "Interested"), /log was saved, but task completion failed/);
    completeFails = false;
    assert.deepEqual(await completeDialerTask(session, claimed, "HOT", "Interested"), { id: task.id, completed: true });
    assert.equal(calls.filter(c => c.key === "update.formData").length, successfulSaveCount,
      "Completion retries reuse a confirmed identical save");
    assert.deepEqual(calls.filter(c => c.key === "complete.task").at(-1).body, {
      path: "/task/available-task/complete", method: "POST",
      data: { businessKey: "LEAD-001", variables: { status: { value: "HOT" } } },
    });
  } finally {
    t.mock.restoreAll();
  }
});
