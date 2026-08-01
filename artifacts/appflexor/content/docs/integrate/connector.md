# Appflexor Connector

## Purpose

The **Appflexor Connector** lets you integrate your existing external systems — ERP, CRM, HRMS, databases, or any custom application — directly into Appflexor business processes as **External Workers**. Instead of replacing your existing systems, the Connector pattern lets Appflexor orchestrate work across them: a process step can invoke an external system, wait for it to complete, then continue with the result. This enables end-to-end automation that spans multiple systems without custom middleware.

---

## Key Concepts

| Term | Description |
|---|---|
| **External Worker** | A service running outside Appflexor that polls for tasks assigned to it, executes work in an external system, and reports completion back to Appflexor. |
| **Process Engine** | The BPM execution engine registered in Appflexor (Camunda v7, Camunda v8, or Joget) that manages process instances and assigns work to workers. |
| **Service Task** | A BPMN process step with a topic/service key that is handled by an External Worker rather than a human user. |
| **Topic** | The named channel an External Worker subscribes to. The worker receives only Service Tasks whose topic matches its subscription. |
| **Process Definition Key** | The identifier of the BPMN process that contains Service Tasks for external workers. |
| **Completion Payload** | The data (variables) the External Worker sends back to Appflexor when it completes a task — these become process variables available to subsequent steps. |
| **BPM API URL** | The endpoint External Workers call to poll for tasks and submit completions. Configured per registered Process Engine. |

---

## How the Connector Pattern Works

```
Appflexor Process
       │
       ▼
  [Service Task]  ──── topic: "create-invoice" ────►  External Worker
  (waits for                                            (calls ERP system,
   completion)                                          creates invoice)
       │                                                      │
       │◄──────────── completes task + returns invoice_id ───┘
       ▼
  [Next Step]
```

1. The process reaches a **Service Task** and parks — it does not time out.
2. The External Worker polls Appflexor via the BPM API, requesting tasks matching its **Topic**.
3. Appflexor returns the task ID, process variables, and any input data.
4. The External Worker performs the work in the target external system.
5. The worker calls the BPM API to complete the task, optionally returning output variables.
6. Appflexor resumes the process from the next step.

---

## Step-by-Step Setup

### 1 — Register a Process Engine

1. Navigate to **Orchestrate → Configure Processes → Process Engine**.
2. Click **Add New**.
3. Fill in:
   - **Engine Type** — select Camunda v7, Camunda v8, or Joget.
   - **Service URL** — the BPM engine's base URL (e.g., `https://bpm.your-domain.com/engine-rest`).
   - **Username / Password** — credentials for the engine's REST API.
   - **Active** — toggle on to enable this engine.
4. Click **Save**. The engine is now available for process deployment and worker polling.

### 2 — Design the BPMN Process with Service Tasks

In your BPMN modeller (e.g., Camunda Modeler):

1. Add a **Service Task** to your process diagram.
2. Set the task's **Implementation** to `External`.
3. Set the **Topic** to a unique name your External Worker will subscribe to (e.g., `create-invoice`).
4. Map any input variables the worker will need, and declare expected output variables.
5. Save the `.bpmn` file.

### 3 — Deploy the Process to Appflexor

1. Go to **Orchestrate → Deploy Processes**.
2. Click **Add New** or select an existing process definition.
3. Upload the `.bpmn` file.
4. Select the **Process Engine** registered in step 1.
5. Click **Deploy Process**. Appflexor deploys it to the engine and makes it available to start.

### 4 — Build and Run an External Worker

An External Worker is a standalone service (any language) that:

1. **Polls** the BPM API for tasks:
   ```
   GET {BPM_API_URL}/external-task/fetchAndLock
   Body: { workerId: "my-worker", topics: [{ topicName: "create-invoice", lockDuration: 30000 }] }
   ```

2. **Processes** each returned task — calling your ERP, HRMS, or other system.

3. **Completes** the task when done:
   ```
   POST {BPM_API_URL}/external-task/{taskId}/complete
   Body: { workerId: "my-worker", variables: { invoice_id: { value: "INV-001", type: "String" } } }
   ```

4. **Reports failure** if the external system errors:
   ```
   POST {BPM_API_URL}/external-task/{taskId}/failure
   Body: { workerId: "my-worker", errorMessage: "ERP timeout", retries: 2, retryTimeout: 60000 }
   ```

### 5 — Monitor External Task Execution

1. Go to **Orchestrate → Monitor Processes**.
2. Use the **Process Monitor** to filter running instances by name or ID.
3. Open **Camunda Cockpit** (available via the "Open Cockpit" link) to inspect external task queues, incidents, and retry states in detail.

---

## Best Practices

- **Keep workers stateless.** Each External Worker invocation should be self-contained — store any state in process variables, not in the worker's memory, so multiple instances can run safely.
- **Set realistic lock durations.** Choose a `lockDuration` long enough for your external system to respond (plus retry margin), but not so long that a crashed worker holds locks for hours.
- **Implement retries and failure reporting.** Always call the failure endpoint with a retry count and timeout when an external system errors — this lets Appflexor automatically retry without human intervention.
- **Use meaningful topic names.** Choose topic names that describe the business operation, not the technical system — `create-invoice` is better than `erp-call-post`.
- **Secure the BPM API URL.** Restrict access to the BPM engine's REST API to known worker IP ranges. External Workers should communicate over TLS.
- **Log worker activity.** Log every task fetch, completion, and failure in your External Worker with the task ID and process instance ID — essential for debugging incidents.
- **Test with the Process Monitor.** After deploying a new integration, run a test process instance and watch the Monitor to confirm external tasks are picked up, completed, and that variables flow correctly into the next step.
