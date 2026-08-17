# External System Integration - Appflexor Connector

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

---

# AppFlexor Connector — Idempotency & Task Recovery Developer Guide

## 1. Purpose

An **AppFlexor Connector** is a remote worker that receives service tasks through the **AppFlexor Connector API** and executes connector-specific business operations.

The connector maintains its own local task state to ensure that:

- Duplicate task deliveries do not cause duplicate processing.
- Connector crashes do not permanently lose tasks.
- Incomplete tasks can be recovered after restart.
- Successfully completed operations are not unnecessarily executed again.
- Camunda remains the source of truth for process completion and retry.

The connector's local database is **independent of the AppFlexor Runtime database**.

---

## 2. Responsibility Boundary

There are two separate idempotency concerns.

### 2.1 AppFlexor Platform

The AppFlexor platform controls **task dispatch idempotency**:

```text
Camunda Service Task
        ↓
AppFlexor Task Dispatcher
        ↓
AppFlexor Runtime DB
        ↓
AppFlexor Connector API
```

The AppFlexor Runtime DB answers:

> Has this Camunda external task already been dispatched?

### 2.2 Connector

The remote connector controls **execution idempotency**:

```text
AppFlexor Connector API
        ↓
Connector
        ↓
Connector Local DB
        ↓
Business Operation
        ↓
AppFlexor API
        ↓
Camunda
```

The connector's local DB answers:

> Has this task already been received, processed, or completed by this connector?

These databases should **not be shared**.

---

## 3. Connector Task Lifecycle

A connector should maintain the following lifecycle:

```text
RECEIVED
    ↓
PROCESSING
    ↓
COMPLETED
```

Failure:

```text
RECEIVED
    ↓
PROCESSING
    ↓
FAILED
```

Crash:

```text
PROCESSING
    ↓
Connector crashes
    ↓
PROCESSING
    ↓
Connector restarts
    ↓
Recovery
    ↓
PROCESSING
```

The connector should not rely on the AppFlexor Connector API alone for recovery.

---

## 4. Local Database

A minimal local task table:

```sql
CREATE TABLE connector_task (
    external_task_id   VARCHAR(255) PRIMARY KEY,

    tenant_id          VARCHAR(100) NOT NULL,

    status             VARCHAR(30) NOT NULL DEFAULT 'RECEIVED',

    received_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processing_at      TIMESTAMPTZ,
    completed_at       TIMESTAMPTZ,

    last_error         TEXT,

    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Recommended status values:

```text
RECEIVED
PROCESSING
COMPLETED
FAILED
```

If a connector can process the same `external_task_id` across multiple independent environments, use:

```sql
PRIMARY KEY (tenant_id, external_task_id)
```

instead.

---

## 5. Receiving a Task

When a task arrives through the **AppFlexor Connector API**, the connector should **not immediately execute the business operation**.

First, persist the task locally:

```text
AppFlexor Connector API
        ↓
Validate request
        ↓
Check local DB
        ↓
Create task record
        ↓
Start processing
```

Use an atomic insert:

```sql
INSERT INTO connector_task (
    external_task_id,
    tenant_id,
    status,
    received_at
)
VALUES (
    $1,
    $2,
    'RECEIVED',
    NOW()
)
ON CONFLICT (external_task_id)
DO NOTHING;
```

---

## 6. Duplicate Task Delivery

The AppFlexor Connector API may deliver the same task more than once.

For example:

```text
AppFlexor Connector API
        ↓
Task ABC
        ↓
Connector
        ↓
Local DB
```

If task `ABC` is delivered again:

```text
AppFlexor Connector API
        ↓
Task ABC
        ↓
Connector
        ↓
Local DB already contains ABC
```

The connector must **not automatically execute the business operation again**.

Check the existing status.

### COMPLETED

Ignore the duplicate delivery.

The business operation has already succeeded.

### PROCESSING

Do not start another concurrent execution.

The task is already being processed.

### RECEIVED

The task was received but processing did not start or complete.

It can be processed.

### FAILED

Apply the connector's retry policy.

---

## 7. Atomic Claim for Processing

Before executing the business operation, atomically transition:

```text
RECEIVED → PROCESSING
```

Use:

```sql
UPDATE connector_task
SET
    status = 'PROCESSING',
    processing_at = NOW(),
    updated_at = NOW()
WHERE external_task_id = $1
  AND status = 'RECEIVED'
RETURNING external_task_id;
```

If a row is returned, processing ownership was acquired.

If no row is returned:

- Another execution already owns the task, or
- The task has already completed.

This prevents two connector processes from processing the same task simultaneously.

---

## 8. Business Processing

Only after successfully claiming the task should the connector execute the actual operation.

```text
AppFlexor Connector API
        ↓
Local DB
        ↓
RECEIVED
        ↓
Atomic claim
        ↓
PROCESSING
        ↓
Business operation
```

Examples include:

- Create customer
- Send email
- Create invoice
- Update CRM
- Call external API
- Process document

The connector should **not mark the task completed before the business operation succeeds**.

---

## 9. Successful Processing

After the business operation succeeds:

```sql
UPDATE connector_task
SET
    status = 'COMPLETED',
    completed_at = NOW(),
    updated_at = NOW(),
    last_error = NULL
WHERE external_task_id = $1
  AND status = 'PROCESSING';
```

Then notify AppFlexor:

```text
Connector
    ↓
AppFlexor Complete Task API
    ↓
Camunda /external-task/{id}/complete
```

### Recommended ordering

```text
Business operation succeeds
        ↓
Local DB → COMPLETED
        ↓
AppFlexor Complete Task API
        ↓
Camunda completed
```

This prevents a connector restart from treating a successfully completed business operation as unfinished.

---

## 10. Connector Crash Recovery

Consider:

```text
AppFlexor Connector API
        ↓
Connector
        ↓
PROCESSING
        ↓
Business operation
        ↓
Connector crashes
```

The local DB remains:

```text
external_task_id = ABC
status = PROCESSING
processing_at = 10:00
```

When the connector starts again, it should scan for stale processing tasks.

Example:

```sql
SELECT *
FROM connector_task
WHERE status = 'PROCESSING'
  AND processing_at < NOW() - INTERVAL '10 minutes';
```

The timeout should be configurable.

For example:

```text
PROCESSING timeout = 10 minutes
```

means:

> If a task has been processing for more than 10 minutes, consider the previous execution potentially abandoned.

---

## 11. Recovery Worker

The connector should run a background recovery process:

```text
Connector starts
      ↓
Recovery scheduler
      ↓
Find stale PROCESSING tasks
      ↓
Attempt recovery
```

For each stale task:

```text
PROCESSING
    ↓
Recovery
    ↓
PROCESSING
```

However, **do not blindly execute the business operation again**.

The previous execution may have succeeded immediately before the connector crashed.

---

## 12. Crash Consistency Problem

Consider:

```text
Connector
    ↓
External System
    ↓
Create record succeeds
    ↓
Connector crashes
    ↓
Local DB still says PROCESSING
```

After restart, the connector sees:

```text
PROCESSING
```

It cannot know whether:

- The external operation never happened, or
- The external operation succeeded but the connector crashed.

Therefore:

> **Local task status alone cannot guarantee exactly-once business execution.**

The connector should use a **business-operation idempotency key** whenever the external system supports it.

---

## 13. Business Idempotency Key

Use:

```text
external_task_id
```

as the default operation idempotency key.

For example:

```text
external_task_id:
c8208f17-907b-11f1-a3f8-0242ac130005
```

If the external API supports idempotency keys:

```http
Idempotency-Key: c8208f17-907b-11f1-a3f8-0242ac130005
```

A retry after a crash can then safely return an already-processed result instead of performing the operation again.

---

## 14. If the External API Does Not Support Idempotency

Use a business identifier supported by the external system.

Examples:

```text
businessKey = REC-001
```

or:

```text
invoiceNumber = INV-10025
```

or:

```text
customerReference = CUSTOMER-001
```

The connector should query the external system before repeating a potentially destructive operation.

Example:

```text
Recover task
     ↓
Check external system
     ↓
Does REC-001 already exist?
     ├── YES → Treat operation as successful
     └── NO  → Execute operation
```

---

## 15. Connector Failure

If business processing fails:

```text
PROCESSING
     ↓
Business operation failed
```

Update local state:

```sql
UPDATE connector_task
SET
    status = 'FAILED',
    last_error = $2,
    updated_at = NOW()
WHERE external_task_id = $1;
```

The connector then determines whether this is:

### 15.1 Connector-Local Retry

For temporary technical failures such as:

- HTTP timeout
- Connection refused
- Temporary API outage
- Rate limit

the connector may retry locally.

### 15.2 Camunda Retry

For a failure that should cause the Camunda process to retry:

```text
Connector
     ↓
AppFlexor API
     ↓
Camunda /external-task/{id}/failure
```

Example:

```json
{
  "workerId": "my-connector-worker",
  "errorMessage": "External CRM unavailable",
  "retries": 2,
  "retryTimeout": 60000
}
```

Camunda then controls the next process-level attempt.

---

## 16. Local Retry vs. Camunda Retry

These are different mechanisms.

### Connector-Local Retry

```text
AppFlexor Connector API
        ↓
Connector
        ↓
Temporary technical failure
        ↓
Connector retries locally
```

The task remains within the connector's current execution lifecycle.

### Camunda Retry

```text
Connector
        ↓
AppFlexor API
        ↓
Camunda /failure
        ↓
Camunda decrements retries
        ↓
External task becomes available
        ↓
AppFlexor dispatches task again
        ↓
AppFlexor Connector API
        ↓
Connector
```

This represents a **new delivery attempt of the same Camunda external task**.

---

## 17. Handling Camunda Retry

The connector must not permanently reject a task simply because:

```text
external_task_id already exists
```

The same Camunda external task ID can be delivered again after a Camunda retry.

Therefore, `external_task_id` is sufficient to identify the business task, but not necessarily every delivery attempt.

If delivery attempts need to be tracked, maintain:

```text
attempt_number
```

For example:

```text
ABC
 ├── attempt 1 → FAILED
 ├── attempt 2 → FAILED
 └── attempt 3 → COMPLETED
```

The connector should use the delivery/attempt information supplied by the AppFlexor task contract when available.

---

## 18. AppFlexor Connector API Acknowledgement

The AppFlexor Connector API should distinguish between **task acceptance** and **task completion**.

Recommended flow:

```text
AppFlexor Connector API
        ↓
Validate task
        ↓
Persist task locally
        ↓
Return accepted
        ↓
Process asynchronously
```

For example:

```http
POST /connector/tasks
```

Response:

```json
{
  "accepted": true,
  "externalTaskId": "c8208f17-907b-11f1-a3f8-0242ac130005"
}
```

The connector then processes the task independently.

The API should not remain open while a potentially long-running business operation executes.

---

## 19. Recovery Scheduler

The connector should have a background recovery job.

Example:

```text
Every 1 minute
      ↓
Find stale PROCESSING tasks
      ↓
Attempt recovery
```

Query:

```sql
SELECT *
FROM connector_task
WHERE status = 'PROCESSING'
  AND processing_at < NOW() - INTERVAL '10 minutes';
```

For each task:

```text
Check business idempotency
        ↓
Already completed externally?
    /             \
  YES              NO
   ↓                ↓
COMPLETED       Retry operation
   ↓                ↓
AppFlexor       SUCCESS/FAILURE
```

---

## 20. Connector State Machine

The connector should enforce valid state transitions:

```text
RECEIVED
    │
    ▼
PROCESSING
    │
    ├──────────────► FAILED
    │
    ▼
COMPLETED
```

Recovery:

```text
PROCESSING
    │
    │ timeout
    ▼
RECOVERY
    │
    ▼
PROCESSING
```

Do not allow:

```text
COMPLETED → PROCESSING
```

unless the task represents a legitimate new delivery attempt.

---

## 21. Recommended Connector Architecture

```text
                AppFlexor Connector API
                         │
                         ▼
                ┌─────────────────┐
                │ Request Handler │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │ Connector DB    │
                │                 │
                │ RECEIVED        │
                │ PROCESSING      │
                │ COMPLETED       │
                │ FAILED          │
                └────────┬────────┘
                         │
                    Atomic Claim
                         │
                         ▼
                ┌─────────────────┐
                │ Task Processor  │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │ Business        │
                │ Connector       │
                └────────┬────────┘
                         │
                    ┌────┴────┐
                    │         │
                 SUCCESS    FAILURE
                    │         │
                    ▼         ▼
               COMPLETED    FAILED
                    │
                    ▼
             AppFlexor API
                    │
                    ▼
                 Camunda
```

---

## 22. Core Design Principles

A connector implementation should follow these principles:

1. **Persist before processing**  
   Never rely only on the incoming API request.

2. **Claim atomically**  
   Only one connector execution should own a task at a time.

3. **Make business operations idempotent**  
   Use `external_task_id` or an appropriate business identifier whenever possible.

4. **Persist completion before notifying AppFlexor**  
   This protects against connector crashes between business completion and the Camunda completion call.

5. **Recover stale processing tasks**  
   A connector restart must be able to identify abandoned work.

6. **Separate local retry from Camunda retry**  
   Technical retries can remain inside the connector; process retries should be reported to Camunda.

7. **Keep connector state local**  
   The connector should not depend on the AppFlexor Runtime DB for its execution state.

8. **Treat duplicate deliveries as normal**  
   Distributed systems can deliver the same task more than once.

9. **Never assume exactly-once delivery guarantees exactly-once business execution**  
   Business-level idempotency is still required.

---

## 23. Responsibility Model

| Component | Responsibility |
|---|---|
| **Camunda** | Process state and process-level retries |
| **AppFlexor Task Dispatcher** | Fetch, lock and dispatch external tasks |
| **AppFlexor Runtime DB** | Dispatch idempotency |
| **AppFlexor Connector API** | Deliver tasks to remote connectors |
| **Connector Local DB** | Connector task state and crash recovery |
| **Connector** | Business operation execution |
| **External System** | Business-level idempotency where supported |
| **AppFlexor API** | Bridge between connector and Camunda |

> **The AppFlexor platform guarantees controlled task dispatch; the connector guarantees safe task execution and recovery using its own local state.**
