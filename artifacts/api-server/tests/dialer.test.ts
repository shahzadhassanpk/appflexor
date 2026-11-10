import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import type { AddressInfo } from "node:net";
import app from "../src/app";
import { mapLead, outcomeVariables } from "../src/lib/dialer-upstream";

const nativeFetch = globalThis.fetch;
const fixtureTask = {
  id: "dialer-test-task", assignee: "dialer-agent", name: "Call lead",
  taskDefinitionKey: "callLead", due: "2026-11-10T12:00:00Z", created: "2026-11-09T09:00:00Z",
};
const fixtureVariables = {
  lead_name: { value: "Test Lead", type: "String" },
  phone_number: { value: "+1 202 555 0100", type: "String" },
  lead_status: { value: "RECALL", type: "String" },
  comments: { value: "Initial note", type: "String" },
};
let cookie = "";
let base = "";
let completionFails = false;
let wrongAssignee = false;
let completeCalls = 0;
let lastCompletion: unknown;
let rejectLogin = false;
const server = app.listen(0, "127.0.0.1");

before(async () => {
  if (!server.listening) await new Promise<void>(resolve => server.once("listening", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/dialer`;
  // Only the external Appflexor boundary is mocked; local routes and cookies are real.
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    assert.equal(url.origin, "https://demo.appflexor.com");
    const request = JSON.parse(String(init?.body ?? "{}"));
    const key = url.searchParams.get("service.key");
    const json = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
    if (key === "login") return json(rejectLogin
      ? { C_STATUS: "FAIL", C_MESSAGE: "Invalid login" }
      : { C_STATUS: "SUCCESS", C_DATA: { AUTH_KEY: "synthetic-upstream-test-token" } });
    if (key === "masterKey.tenantData") return json({ C_STATUS: "SUCCESS", C_DATA: { profile: [{ username: "dialer-agent" }] } });
    if (key === "logout") return json({ C_STATUS: "SUCCESS" });
    assert.equal(key, "bpm.data");
    assert.equal(new Headers(init?.headers).get("AUTH_KEY"), "synthetic-upstream-test-token");
    if (request.path.startsWith("/task?")) {
      const query = new URL(request.path, "https://engine.test").searchParams;
      assert.equal(query.get("assignee"), "dialer-agent");
      assert.equal(query.get("taskDefinitionKey"), "callLead");
      return json({ data: [fixtureTask] });
    }
    if (request.path.endsWith("/complete")) {
      completeCalls++;
      lastCompletion = request;
      return json(completionFails ? { C_STATUS: "FAIL", C_MESSAGE: "Engine rejected completion" } : { C_STATUS: "SUCCESS", data: null });
    }
    if (request.path.includes("/variables?")) return json({ data: fixtureVariables });
    if (request.path === "/task/dialer-test-task") return json({ data: { ...fixtureTask, assignee: wrongAssignee ? "another-agent" : fixtureTask.assignee } });
    throw new Error("Unexpected upstream request");
  };
});
after(async () => {
  globalThis.fetch = nativeFetch;
  server.closeAllConnections();
  await new Promise<void>(resolve => server.close(() => resolve()));
});

async function request(path: string, method = "GET", body?: unknown) {
  return nativeFetch(`${base}${path}`, {
    method,
    headers: { ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...(cookie ? { Cookie: cookie } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

test("signed-out requests cannot read lead tasks", async () => {
  assert.equal((await request("/tasks")).status, 401);
  assert.equal((await request("/session")).status, 401);
});
test("invalid credentials remain signed out and do not create a cookie", async () => {
  assert.equal((await request("/login", "POST", { username: "", password: "" })).status, 400);
  rejectLogin = true;
  const response = await request("/login", "POST", { username: "test", password: "synthetic" });
  assert.equal(response.status, 401);
  assert.ok(!response.headers.get("set-cookie")?.includes("Max-Age=28800"));
  rejectLogin = false;
});
test("login resolves canonical identity and returns an HttpOnly session, never an upstream token", async () => {
  const response = await request("/login", "POST", { username: "dialer-agent", password: "synthetic", taskDefinitionKey: "callLead" });
  assert.equal(response.status, 200);
  const setCookie = response.headers.get("set-cookie")!;
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /SameSite=Strict/);
  cookie = setCookie.split(";")[0]!;
  assert.deepEqual(await response.json(), { username: "dialer-agent", taskDefinitionKey: "callLead" });
  assert.equal((await request("/session")).status, 200);
});
test("task queue uses assignment and maps live task variables into lead fields", async () => {
  const response = await request("/tasks");
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.tasks[0].phone, "+1 202 555 0100");
  assert.equal(body.tasks[0].name, "Test Lead");
  assert.equal(body.tasks[0].status, "RECALL");
  assert.equal(body.tasks[0].dueDate, fixtureTask.due);
});
test("detail and completion reject tasks owned by another user", async () => {
  wrongAssignee = true;
  assert.equal((await request("/tasks/dialer-test-task")).status, 403);
  assert.equal((await request("/tasks/dialer-test-task/complete", "POST", { status: "HOT", comments: "" })).status, 403);
  assert.equal(completeCalls, 0);
  wrongAssignee = false;
});
test("completion validates outcomes and preserves upstream failure instead of reporting success", async () => {
  assert.equal((await request("/tasks/dialer-test-task/complete", "POST", { status: "INVALID", comments: "" })).status, 400);
  completionFails = true;
  const response = await request("/tasks/dialer-test-task/complete", "POST", { status: "HOT", comments: "Interested" });
  assert.equal(response.status, 502);
  assert.equal((await response.json()).error, "Engine rejected completion");
  completionFails = false;
});
test("successful completion sends the existing variable names and Camunda String types", async () => {
  const response = await request("/tasks/dialer-test-task/complete", "POST", { status: "REJECTION", comments: "Not interested" });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { id: "dialer-test-task", completed: true });
  assert.deepEqual(lastCompletion, {
    path: "/task/dialer-test-task/complete", method: "POST",
    data: { variables: { lead_status: { value: "REJECTION", type: "String" }, comments: { value: "Not interested", type: "String" } } },
  });
});
test("logout revokes the server session", async () => {
  assert.equal((await request("/logout", "POST")).status, 204);
  assert.equal((await request("/session")).status, 401);
});
test("field aliases and safe empty defaults are deterministic", () => {
  assert.equal(mapLead(fixtureTask, { phoneNumber: { value: "123" }, customerName: { value: "Example" } }).name, "Example");
  assert.deepEqual(outcomeVariables({}, "HOT", ""), {
    status: { value: "HOT", type: "String" }, comments: { value: "", type: "String" },
  });
});
