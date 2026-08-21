# Deploy Process

## Purpose

**Deploy Process** publishes a BPMN workflow definition to the Appflexor process engine, making it available for process mapping and execution. Use this guide for uploading, reviewing, updating, and removing deployed process definitions.

> ℹ️ Process visibility, start forms, user-group access, and catalogue placement are documented separately in [Configure Processes](configure-processes.md).

---

## Key Concepts

| Term | Description |
|---|---|
| **BPMN File** | An XML-based workflow definition (`.bpmn`) produced by tools such as Camunda Modeler. |
| **Process Definition Key** | The unique identifier declared inside the BPMN file and used by the process engine. |
| **Process Title** | The human-readable name shown for the deployed definition. |
| **Deploy** | Registering the BPMN definition and pushing it to the configured process engine. |
| **Element Configuration** | The User Tasks, Service Tasks, Start Events, and Variables settings available for a deployed definition. |

---

## Step-by-Step

### 1 — Open the Deploy workspace

1. Navigate to **Orchestrate → Deploy Process**.
2. Open the **Deploy** workspace.
3. The list shows deployed process definitions with their title, definition key, BPMN file, deployment version, and last-updated date.

### 2 — Upload and deploy a new process

1. Select **Add New**.
2. Choose a `.bpmn` file.
3. The platform uploads the file and extracts the available BPMN process definitions.
4. Review the extracted **Process Title** and **Process Definition Key**.
5. If the file contains multiple process definitions, select the intended process.
6. Review the rendered BPMN diagram.
7. Select **Save** to register and deploy the process.

### 3 — Update an existing process

1. Locate the process in the deployment list and select its Edit action.
2. Upload the replacement `.bpmn` file.
3. Review the extracted title, definition key, and diagram.
4. Save the updated definition.

Recheck the process element configuration after replacing a BPMN file, especially if task or event IDs changed.

### 4 — Delete a deployed process

1. Select the Delete action next to the process.
2. Confirm the deletion.

> ⚠️ **Caution:** Removing a deployment can prevent new process instances from starting from that definition. Review related Process Maps before deleting it.

---

## Configure Process Elements

After a process is saved, the deployment workspace provides configuration panels for elements found in the BPMN:

- **User Tasks** — assign task ownership and configure task forms.
- **Service Tasks** — configure connector, App Service, or AI Agent execution.
- **Start Events** — configure the form shown when a user starts the process.
- **Variables** — review process variables and edit their display labels.

### User Tasks

Use **Assign** to choose an individual, group, or Camunda expression for the task owner. Use **Configure** to attach a form by selecting a form key or entering an expression. Apply the changes after completing the dialog.

### Service Tasks

Service tasks can use one of these execution backends:

| Backend | Use |
|---|---|
| **AppFlexor Connector** | Route work to an external worker using a connector topic and optional input parameters. |
| **App Service** | Call a built-in service such as reading data, updating records, or sending email. |
| **AI Agent** | Run a configured agent task with the selected agent, task definition, and payload parameters. |

Values that support Camunda expressions can be resolved at runtime. For AI Agent tasks, the `business_key` and `message` payload fields are fixed required inputs.

### Variables

Use the Variables panel to review BPMN process variables. Editing a display label changes how the variable is presented without renaming the underlying engine variable.

---

## Best Practices

- **Design and validate BPMN in Camunda Modeler first.** The deployment workspace is not a BPMN authoring tool.
- **Keep Process Definition Keys stable.** Process Maps and API calls can reference the key.
- **Review element configuration after every replacement.** Updated BPMN IDs can invalidate task, event, or variable settings.
- **Version significant changes deliberately.** Use a new definition key when a change should not affect existing mappings or running instances.
- **Deploy to a non-production environment first.** Confirm the process diagram and task behavior before making it available to end users.
