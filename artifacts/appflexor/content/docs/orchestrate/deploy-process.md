# Deploy Process

## Purpose

**Deploy Process** publishes a BPMN workflow file to the Appflexor process engine (Camunda), making it available for users to start and interact with. After uploading you configure each task in the diagram — assigning owners, linking forms, and wiring service integrations — all without leaving the platform.

---

## Key Concepts

| Term | Description |
|---|---|
| **BPMN File** | An XML-based workflow definition (`.bpmn`) produced by tools such as Camunda Modeler. |
| **Process Definition Key** | The unique identifier declared inside the BPMN file. Extracted automatically on upload; used by the engine and by API calls to start instances. |
| **Process Title** | A human-readable name shown in the process catalogue and task inbox. Auto-populated from the BPMN but editable. |
| **Deploy** | Saving the BPMN record and pushing it to the process engine so it can be instantiated. |
| **Element Tabs** | The configuration panels (User Tasks, Service Tasks, Start Events, Variables) shown after a process is saved. |

---

## Step-by-Step

### 1 — Open Deploy Processes

1. Navigate to **Orchestrate → Configure Processes**.
2. Click the **Deploy Processes** tab.
3. The list shows all previously deployed process definitions with their title, process definition key, and BPMN file name.

### 2 — Upload and Deploy a New Process

1. Click **Add New**.
2. In the modal, click **Choose File** and select your `.bpmn` file.
3. The platform immediately:
   - Uploads the file to the server.
   - Parses the BPMN XML and extracts all `<bpmn:process>` elements.
   - Auto-fills **Title** and **Process Definition Key** from the first process found.
4. If the BPMN contains multiple processes, select the correct one — the title and key update accordingly.
5. Review or edit:
   - **Title** — display name shown to users.
   - **Process Definition Key** — must match the `id` attribute of the `<bpmn:process>` element exactly.
6. A BPMN diagram viewer renders the uploaded diagram for visual confirmation.
7. Click **Save**. The process is registered and element-configuration tabs appear.

### 3 — Update an Existing Process

1. Locate the process in the list and click the **Edit** icon.
2. Upload a new `.bpmn` file — the title and key are re-extracted automatically.
3. Review the updated diagram and re-verify element configuration.
4. Click **Save**. The engine now uses the new version; running instances continue on their previous version until they complete.

### 4 — Delete a Deployed Process

1. Click the **Delete** icon next to the process.
2. Confirm the deletion.

> ⚠️ **Caution:** Deleting a process definition removes it from the catalogue. Active instances started from it will continue to completion, but no new instances can be started.

---

## Configuring Process Elements

After saving a process, four configuration tabs appear below the diagram: **User Tasks**, **Service Tasks**, **Start Events**, and **Variables**. Each tab lists the matching elements found in the BPMN.

### User Tasks — Assign

Sets who receives each human task in the task inbox.

1. Click the **Assign** button next to a user task.
2. Choose an assignment mode:
   - **Individual** — select a specific user from the directory.
   - **Group** — assign the task to a group; any group member can claim it.
   - **Expression** — enter a Camunda EL expression such as `${initiator}` or `${someVariable}` to resolve the assignee dynamically at runtime.
3. Click **Apply**.

The task chip in the list updates to show the assigned user or group name.

### User Tasks — Configure Form

Attaches a data-capture form to the task step.

1. Click the **Configure** button next to a user task.
2. Choose a mode:
   - **Form Key** — select an Appflexor form from the searchable list.
   - **Expression** — enter an EL expression that resolves to a form key at runtime.
3. Click **Apply**.

### Start Events — Configure Form

Attaches a form to the process start event, presented when a user initiates the process.

Works identically to **User Tasks — Configure Form** above.

### Service Tasks — Configure

Wires an automated task to one of three execution backends. Click the **Configure** button next to a service task, then select a type from the toggle bar.

#### AppFlexor Connector

Routes the task to an external Kafka-based worker via the `appflexor.connector` worker topic.

| Field | Description |
|---|---|
| **Connector Topic** | The Kafka topic your external worker subscribes to (e.g. `my.connector.topic`). Stored as the `kafka.topic` input parameter. |
| **Input Parameters** | Optional key/value pairs passed to the worker. Values support Camunda expressions such as `${execution.businessKey}`. |

> ℹ️ The BPMN worker topic is always `appflexor.connector` — the Connector Topic field sets the routing key your worker uses internally.

#### App Service

Calls a built-in Appflexor platform service. Worker topic: `app.service.api`.

Choose a **Service** from the dropdown:

| Service | Purpose | Key Fields |
|---|---|---|
| **Fetch / Read data** (`get.formData`) | Reads records from a data service and stores the response in a process variable. | Service Key (e.g. `sys.user.list`), Service Params, Result Variable |
| **Create / Update / Delete** (`update.formData`) | Writes records to a database table. | Table (formId), Action (create / update / delete), Record ID, Data Fields |
| **Send Email** (`send.email`) | Dispatches a registered email template. | Email Key, Context Params |

All field values support Camunda expressions, e.g. `${execution.businessKey}` or `${someVariable}`.

#### AI Agent

Delegates the task to a configured AI agent. Worker topic: `ai.run.agent`.

| Field | Description |
|---|---|
| **AI Agent** | Select the agent from the list of agents configured in **Administrate → AI Services**. |
| **Task** | Select the specific task definition for this agent (loaded after the agent is selected). |
| **Payload Parameters** | Key/value pairs sent to the agent. The first two rows (`business_key` and `message`) are fixed and required. Add extra rows for any additional context the agent needs. |

> ℹ️ The `business_key` and `message` payload fields cannot be removed — they are the minimum contract expected by all AI agent tasks.

### Variables

Lists process variables defined in the BPMN. Click **Edit** to rename a variable's display label without changing the underlying variable name in the engine.

---

## Best Practices

- **Design in Camunda Modeler first.** Model and validate your BPMN externally before uploading — the platform does not have a built-in BPMN editor.
- **Keep Process Definition Keys stable.** The key is referenced by API calls and Process Map configurations. Changing it after deployment breaks existing integrations.
- **Version with new records rather than overwriting.** When making significant changes, create a new Deploy Process entry with a versioned key (e.g. `leave-request-v2`) to avoid disrupting running instances.
- **Re-verify element configuration after uploading a new BPMN.** Replacing the file resets any task-level properties that no longer match elements in the updated diagram.
- **Use expressions for dynamic assignment.** In processes where the initiator should own subsequent tasks, use `${initiator}` as the assignee expression on the relevant user tasks.
- **Test in a non-production environment first.** Deploy to a staging site before pushing to production to catch flow errors early.
