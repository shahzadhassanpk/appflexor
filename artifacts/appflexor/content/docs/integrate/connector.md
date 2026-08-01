# Appflexor Connector

## Purpose

The **Appflexor Connector** is a ready-to-run Node.js worker that integrates your external systems — ERP, CRM, HRMS, databases, or any custom application — directly into Appflexor business processes. Instead of polling Camunda for work, it connects to Appflexor's **WebSocket push channel**: Appflexor pushes tasks to the worker the moment they are ready, eliminating polling delays and excess API calls. The worker authenticates via the Appflexor login API, subscribes to one or more named topics, and calls the Appflexor BPM proxy to complete each task.

---

## How It Works

```
Appflexor Process
       │
       ▼
  [Service Task]  ──── topic: "demo-worker" ────►  Connector (Node.js)
  (waits for                                         1. receives task via WebSocket
   completion)                                       2. runs your custom logic
       │                                             3. completes task via BPM API
       │◄──────────────── task complete ────────────┘
       ▼
  [Next Step]
```

**Connection lifecycle:**

1. **Authenticate** — POST to `AUTH_URL` with `LOGIN` / `PASSWORD` credentials. Appflexor returns an `AUTH_KEY` session token.
2. **Connect** — Open a WebSocket to `WS_URL` with the `AUTH_KEY` in the connection headers.
3. **Subscribe** — After the socket opens, send a subscribe message listing the topics and group ID.
4. **Receive tasks** — Appflexor pushes a message for each matching Service Task. The message contains the topic name and a JSON payload with the `taskId` and `workerId`.
5. **Complete tasks** — POST to the BPM API via `BPM_URL`, passing the task ID and worker ID. Appflexor proxies the call to Camunda and resumes the process.
6. **Reconnect** — If the WebSocket closes for any reason, the connector waits 5 seconds and restarts the entire flow (re-authenticates and reconnects).

---

## Key Concepts

| Term | Description |
|---|---|
| **Topic** | The named channel a Service Task publishes on. The connector subscribes to one or more topics and only receives tasks that match. |
| **AUTH_KEY** | The session token returned by the Appflexor login API. Sent as the `AUTH_KEY` header on all subsequent API and WebSocket calls. |
| **Group ID** | Identifies a pool of worker instances sharing the same subscription. Tasks are distributed across workers in the same group. |
| **BPM Proxy** | The `BPM_URL` endpoint (`/bpm/service?service.key=bpm.data`) that the connector calls to complete tasks. Appflexor forwards these to the underlying Camunda engine — no direct Camunda access is needed. |
| **taskId** | The Camunda external task ID pushed by Appflexor. Required in the completion call. |
| **workerId** | Identifies which worker instance is completing the task. Returned by Appflexor in the push payload. |

---

## Environment Variables

All configuration is supplied through environment variables. Set these as **Replit Secrets** (for credentials) or **shared env vars** (for URLs and non-sensitive config) before starting the worker.

| Variable | Description | Example |
|---|---|---|
| `LOGIN` | Appflexor username (**secret**) | `admin` |
| `PASSWORD` | Appflexor password (**secret**) | `••••••••` |
| `AUTH_URL` | Login endpoint | `https://demo.step2agility.com/app/service?service.key=login` |
| `BPM_URL` | BPM proxy endpoint for task completion | `https://demo.step2agility.com/bpm/service?service.key=complete.task` |
| `WS_URL` | WebSocket push endpoint | `wss://demo.step2agility.com/worker` |
| `TOPICS` | JSON array of topic objects to subscribe to | `[{"topic":"demo-worker"}]` |
| `GROUP_ID` | Worker group identifier | `camunda` |

> **Note:** Replace `demo.step2agility.com` with your own Appflexor instance hostname. The endpoint paths (`/app/service`, `/bpm/service`, `/worker`) remain the same across all instances.

---

## Step-by-Step Setup

### 1 — Design the BPMN Process with a Service Task

In Camunda Modeler:

1. Add a **Service Task** to your BPMN diagram.
2. Set the task's **Implementation** to `External`.
3. Set the **Topic** to match one of the topics in the connector's `TOPICS` list (e.g. `demo-worker`).
4. Save and export the `.bpmn` file.

### 2 — Deploy the Process

1. Navigate to **Orchestrate → Configure Processes → Deploy Processes**.
2. Click **Add New**, upload the `.bpmn` file, and click **Save**.
3. The process is now live and will park at any Service Task with a matching topic until the connector completes it.

### 3 — Configure the Connector

Set the environment variables listed above. In Replit:

- Add `LOGIN` and `PASSWORD` via **Tools → Secrets** (🔒).
- `AUTH_URL`, `BPM_URL`, `WS_URL`, `TOPICS`, and `GROUP_ID` are already set as shared env vars — update them if your instance hostname is different.

To subscribe to multiple topics, provide a JSON array in `TOPICS`:

```
TOPICS=[{"topic":"demo-worker"},{"topic":"invoice-worker"}]
```

### 4 — Start the Worker

In Replit, start the **appflexor-connector: worker** workflow from the Workflows panel. The console shows connection progress:

```
🔐 Credentials loaded for user: {"username":"admin"}
✅ Auth token received
✅ Connected to WebSocket server
✅ Subscription sent for topics: [{"topic":"demo-worker"}]
```

The worker is now live and waiting for tasks. When a process reaches a matching Service Task, you will see:

```
📨 Processing topic: demo-worker
🔄 Completing task abc123
✅ Task completed: abc123
```

### 5 — Add Your Business Logic

By default the connector completes every task immediately without doing any external work — this is a pass-through stub. To integrate a real system, edit `appflexor-worker.js` and add your logic inside `completeTask` before the completion call:

```js
async function completeTask(authKey, payload) {
  try {
    console.log("🔄 Completing task", payload.taskId);
    const path     = `/external-task/${payload.taskId}/complete`;
    const workerId = payload.workerId || "default-worker";

    // ── ADD YOUR LOGIC HERE ──────────────────────────────────────────
    // e.g. call an ERP, update a database, send an email, etc.
    // const result = await myErpClient.createInvoice(payload);
    // ────────────────────────────────────────────────────────────────

    await axios.post(BPM_URL, { method: "POST", path, data: { workerId } }, {
      headers: { AUTH_KEY: authKey },
    });
    console.log("✅ Task completed:", payload.taskId);
  } catch (err) {
    console.error("❌ Failed to complete task:", err.message);
  }
}
```

The full task `payload` received from Appflexor looks like:

```json
{
  "taskId": "abc123",
  "workerId": "default-worker"
}
```

Process variables set on the Service Task by the BPMN designer are available on the payload and can be used in your integration logic.

---

## Authentication Flow (Reference)

The connector calls the standard Appflexor login endpoint:

```
POST https://{your-instance}/app/service?service.key=login
Content-Type: application/json

{
  "username": "admin",
  "password": "••••••••"
}
```

Response:

```json
{
  "C_DATA": {
    "AUTH_KEY": "eyJ..."
  }
}
```

The `AUTH_KEY` value is then sent as a header on every subsequent request:
- **WebSocket connection:** `AUTH_KEY: eyJ...` in the upgrade headers
- **BPM completion call:** `AUTH_KEY: eyJ...` in the POST headers

---

## Completion API (Reference)

Task completion is proxied through Appflexor rather than calling Camunda directly:

```
POST https://{your-instance}/bpm/service?service.key=bpm.data
AUTH_KEY: {auth_key}
Content-Type: application/json

{
  "method": "POST",
  "path": "/external-task/{taskId}/complete",
  "data": {
    "workerId": "{workerId}"
  }
}
```

---

## Monitoring

1. Navigate to **Orchestrate → Configure Processes → Monitor Processes**.
2. The process instance will advance past the Service Task once the connector completes it.
3. If the connector fails to complete a task, the instance stays parked at the Service Task — visible in Camunda Cockpit as an open external task or incident.

---

## Best Practices

- **Keep workers stateless.** Each task completion should be self-contained. Store outcome data as process variables rather than in the worker's memory.
- **Handle errors gracefully.** If your external system call fails, log the error and consider calling the failure endpoint manually so Camunda can retry or escalate rather than leaving the task locked.
- **Use meaningful topic names.** Name topics after the business operation, not the technical system — `create-invoice` is clearer than `erp-post-call`.
- **Run one worker per topic group.** If you have high task volumes, run multiple instances of the connector with the same `GROUP_ID` — Appflexor distributes tasks across them automatically.
- **Rotate credentials periodically.** Update `LOGIN` and `PASSWORD` in Replit Secrets and restart the workflow. The connector re-authenticates on each start.
- **Watch the reconnect log.** A repeated `🔌 WebSocket closed — reconnecting in 5s…` message indicates a persistent auth or network issue. Check that `AUTH_URL` and credentials are correct.
