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

test("assigned tasks read due aliases and recover omitted RECALL due dates from details", async (t) => {
  const due = "2027-04-05T13:45:00.000+0000";
  const rows = [
    { ...task, id: "due-task", assignee: session.username, due },
    { ...task, id: "alias-task", assignee: session.username, due: "", dueDate: due },
    { ...task, id: "snake-task", assignee: session.username, due: null, due_date: due },
    { ...task, id: "omitted-task", assignee: session.username, due: null },
  ];
  let detailReads = 0;
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    const body = JSON.parse(options.body);
    if (body.path.startsWith("/task?assignee=")) return Response.json({ status: "SUCCESS", data: rows });
    if (body.path === "/task/omitted-task") {
      detailReads++;
      return Response.json({ status: "SUCCESS", data: { ...rows[3], due } });
    }
    assert.match(body.path, /\/variables\?/);
    return Response.json({ status: "SUCCESS", data: { status: { value: "RECALL" } } });
  });
  try {
    const list = await getTaskList(session, "assigned");
    assert.deepEqual(list.tasks.map(item => item.dueDate), [due, due, due, due]);
    assert.deepEqual(list.tasks.map(item => item.recallDateTime), [due, due, due, due]);
    assert.equal(detailReads, 1);
  } finally {
    t.mock.restoreAll();
  }
});

test("claim, save and complete use the confirmed CRM contracts", async (t) => {
  const calls = [];
  const ownedTask = { ...task, assignee: session.username, processInstanceId: "process-1" };
  const variables = { name: { value: "Demo Lead" }, phone: { value: "" } };
  let saveFails = false;
  let completeFails = true;
  let claimFails = true;
  let statusFails = true;
  let ignoreStatusWrite = true;
  let ignoreCommentsWrite = true;
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
    if (body.path === "/task/available-task/variables") {
      assert.equal(body.method, "POST");
      assert.deepEqual(body.data, { modifications: {
        status: { value: "HOT", type: "String" },
        comments: { value: "Interested", type: "String" },
      } });
      if (statusFails) return Response.json({ status: "FAILED", message: "Status update rejected" });
      if (!ignoreStatusWrite) variables.status = { value: body.data.modifications.status.value };
      if (!ignoreCommentsWrite) variables.comments = { value: body.data.modifications.comments.value };
      return new Response(null, { status: 204 });
    }
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
    await assert.rejects(completeDialerTask(session, claimed, "HOT", "Interested"), /log was saved, but updating task status, comments or due date failed/);
    assert.equal(calls.filter(c => c.key === "complete.task").length, 0,
      "A failed status update must block completion");
    const insertCountBeforeStatusRetry = calls.filter(c => c.key === "update.formData").length;
    statusFails = false;
    await assert.rejects(saveDialerLog(session, claimed, "HOT", "Interested"), /did not return the saved status/);
    assert.equal(calls.filter(c => c.key === "complete.task").length, 0,
      "An acknowledged but unpersisted variable update must not report Save success or complete");
    ignoreStatusWrite = false;
    await assert.rejects(saveDialerLog(session, claimed, "HOT", "Interested"), /did not return the saved comments/);
    ignoreCommentsWrite = false;
    await saveDialerLog(session, claimed, "HOT", "Interested");
    assert.equal(variables.status.value, "HOT", "Save updates the process status variable");
    assert.equal(variables.comments.value, "Interested", "Save updates the process comments variable");
    assert.equal(calls.filter(c => c.key === "update.formData").length, insertCountBeforeStatusRetry,
      "Retrying the status update does not duplicate the confirmed log");
    assert.equal(calls.filter(c => c.key === "complete.task").length, 0, "Save alone does not complete");
    const saved = calls.filter(c => c.key === "update.formData").at(-1).body;
    assert.deepEqual(saved, {
      datasource: "",
      saveOrUpdate: "Yes",
      data: [{
        formId: "dialer_log", entity: "dialer_log", action: "update",
        mode: "formData", id: task.id, fileData: [],
        formData: { id: task.id, name: "Demo Lead", phone: "", status: "HOT", comments: "Interested", business_key: "LEAD-001" },
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

test("changed saves upsert the same task-id dialer log", async (t) => {
  const variables = {
    name: { value: "Demo Lead" }, phone: { value: "+15550101001" },
    business_key: { value: "LEAD-UPSERT" },
  };
  const records = new Map();
  const requests = [];
  const owned = { ...task, id: "upsert-task", assignee: session.username };
  t.mock.method(globalThis, "fetch", async (url, options) => {
    const body = JSON.parse(options.body);
    if (url.includes("service.key=update.formData")) {
      assert.equal(body.saveOrUpdate, "Yes");
      const entry = body.data[0];
      assert.equal(entry.id, owned.id);
      assert.equal(entry.formData.id, owned.id, "Appflexor requires the same id inside formData");
      requests.push(entry);
      records.set(entry.formData.id, entry.formData);
      return Response.json({ C_STATUS: "SUCCESS" });
    }
    if (body.path === `/task/${owned.id}/variables`) {
      Object.assign(variables, body.data.modifications);
      return new Response(null, { status: 204 });
    }
    if (body.path === `/task/${owned.id}` && body.method === "PUT") {
      assert.equal(body.data.assignee, session.username);
      owned.due = body.data.due;
      return new Response(null, { status: 204 });
    }
    if (body.path.includes("/variables?")) return Response.json({ status: "SUCCESS", data: variables });
    if (body.path.startsWith("/task?assignee=")) {
      return Response.json({ status: "SUCCESS", data: [{ ...owned, due: "", dueDate: owned.due }] });
    }
    assert.equal(body.path, `/task/${owned.id}`, "Saving must not call completion");
    return Response.json({ status: "SUCCESS", data: owned });
  });
  try {
    await saveDialerLog(session, owned, "HOT", "First call");
    await saveDialerLog(session, owned, "RECALL", "Call tomorrow", "2027-04-05T13:45");
    assert.equal(requests.length, 2);
    assert.equal(records.size, 1);
    assert.equal(records.get(owned.id).status, "RECALL");
    assert.equal(records.get(owned.id).comments, "Call tomorrow");
    assert.equal("recall_datetime" in records.get(owned.id), false,
      "The recall date belongs in the task due field, not a new log field");
    assert.equal(new Date(owned.due).getTime(), new Date("2027-04-05T13:45").getTime());
    const listed = await getTaskList(session, "assigned");
    assert.equal(listed.tasks[0].dueDate, owned.due);
  } finally {
    t.mock.restoreAll();
  }
});

test("RECALL does not reclaim a reassigned task and rejects assignment loss", async (t) => {
  for (const loseBeforePut of [true, false]) {
    await t.test(loseBeforePut ? "ownership changed before PUT" : "ownership lost after PUT", async () => {
      const owned = { ...task, id: `ownership-${loseBeforePut}`, assignee: session.username };
      const variables = { business_key: { value: "LEAD-OWNER" } };
      let reads = 0;
      let puts = 0;
      let completions = 0;
      t.mock.method(globalThis, "fetch", async (url, options) => {
        const body = JSON.parse(options.body);
        if (url.includes("service.key=update.formData")) return Response.json({ C_STATUS: "SUCCESS" });
        if (url.includes("service.key=complete.task")) { completions++; return new Response(null, { status: 204 }); }
        if (body.path.includes("/variables?")) return Response.json({ data: variables, status: "SUCCESS" });
        if (body.path.endsWith("/variables")) {
          Object.assign(variables, body.data.modifications);
          return new Response(null, { status: 204 });
        }
        if (body.method === "PUT") {
          puts++;
          owned.due = body.data.due;
          owned.assignee = null;
          return new Response(null, { status: 204 });
        }
        reads++;
        if (loseBeforePut && reads === 2) owned.assignee = "another-agent";
        return Response.json({ data: owned, status: "SUCCESS" });
      });
      try {
        await assert.rejects(completeDialerTask(session, owned, "RECALL", "Later", "2027-04-05T13:45"),
          loseBeforePut ? /no longer assigned to you/ : /did not preserve your task assignment/);
        assert.equal(puts, loseBeforePut ? 0 : 1);
        assert.equal(completions, 0);
      } finally {
        t.mock.restoreAll();
      }
    });
  }
});

test("RECALL preserves assignment and writable task properties while updating due", async (t) => {
  const recallTask = {
    ...task, id: "recall-task", assignee: session.username,
    owner: "original-owner", description: "Keep description", priority: 75,
    delegationState: null, followUp: "2027-04-04T12:00:00.000+0000",
    parentTaskId: null, caseInstanceId: null, tenantId: "test-tenant",
  };
  const recallTaskWithDue = { ...recallTask, due: null };
  const recallVariables = {
    name: { value: "Recall Lead" },
    phone: { value: "+15550101111" },
    comments: { value: "Call back" },
    business_key: { value: "LEAD-RECALL" },
  };
  const savedRequests = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    const body = JSON.parse(options.body);
    const key = new URL(url, "http://example.test").searchParams.get("service.key");
    if (key === "update.formData") {
      savedRequests.push(body);
      return Response.json({ C_STATUS: "SUCCESS" });
    }
    if (body.path === `/task/${recallTask.id}/variables`) {
      assert.deepEqual(Object.keys(body.data.modifications).sort(), ["comments", "status"]);
      Object.assign(recallVariables, body.data.modifications);
      return new Response(null, { status: 204 });
    }
    if (body.path === `/task/${recallTask.id}` && body.method === "PUT") {
      const { due, ...preserved } = body.data;
      const expected = Object.fromEntries([
        "name", "description", "assignee", "owner", "delegationState",
        "followUp", "priority", "parentTaskId", "caseInstanceId", "tenantId",
      ].map(key => [key, recallTask[key]]));
      assert.deepEqual(preserved, expected);
      // Model replacement semantics: missing fields would be reset to null.
      for (const key of Object.keys(expected)) recallTaskWithDue[key] = body.data[key] ?? null;
      recallTaskWithDue.due = due;
      return new Response(null, { status: 204 });
    }
    if (body.path === `/task/${recallTask.id}`) return Response.json({ status: "SUCCESS", data: recallTaskWithDue });
    if (body.path.includes("/variables?")) return Response.json({ status: "SUCCESS", data: recallVariables });
    return Response.json({ status: "SUCCESS", data: recallTaskWithDue });
  });
  try {
    await saveDialerLog(session, recallTask, "RECALL", "Call back", "2027-04-05T13:45");
    const log = savedRequests[0].data[0];
    assert.equal(log.id, recallTask.id);
    assert.equal(log.formData.id, recallTask.id);
    assert.equal("recall_datetime" in log.formData, false, "The log does not get a new recall field");
    assert.equal(new Date(recallTaskWithDue.due).getTime(), new Date("2027-04-05T13:45").getTime());
    assert.equal("recall_datetime" in recallVariables, false, "No recall task variable is created");
    assert.equal(recallVariables.status.value, "RECALL");
    assert.equal(recallTaskWithDue.assignee, session.username);
    assert.equal(recallTaskWithDue.owner, "original-owner");
    assert.equal(recallTaskWithDue.priority, 75);
  } finally {
    t.mock.restoreAll();
  }
});
