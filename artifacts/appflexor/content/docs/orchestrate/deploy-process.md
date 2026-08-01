# Deploy Process

## Purpose

**Deploy Process** publishes a BPMN workflow file to the Appflexor process engine (Camunda), making it available for users to start and interact with. You upload a `.bpmn` file designed in a BPMN modelling tool, the platform parses and stores it, and the process becomes live immediately.

---

## Key Concepts

| Term | Description |
|---|---|
| **BPMN File** | An XML-based workflow definition (`.bpmn`) produced by tools such as Camunda Modeler. |
| **Process Definition Key** | The unique identifier declared inside the BPMN file that the engine uses to reference and start the process. Extracted automatically on upload. |
| **Process Title** | A human-readable name shown in the process catalogue and task inbox. Auto-populated from the BPMN but editable. |
| **Deploy** | The act of saving the BPMN record and pushing it to the process engine so it can be instantiated. |

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
   - Auto-fills **Title** and **Process Definition Key** from the first process found in the file.
4. If the BPMN contains multiple processes, select the correct one from the parsed list — the title and key update accordingly.
5. Review or edit:
   - **Title** — display name shown to users.
   - **Process Definition Key** — must match the `id` attribute of the `<bpmn:process>` element exactly; this is used when starting instances via the API.
6. A BPMN diagram viewer renders the uploaded diagram for visual confirmation.
7. Click **Save**. The process is registered and available to the engine.

### 3 — Update an Existing Process

1. Locate the process in the list and click the **Edit** icon.
2. Upload a new `.bpmn` file to replace the existing one — the title and key are re-extracted automatically.
3. Review the updated diagram in the viewer.
4. Click **Save**. The engine now uses the new version; running instances continue on their previous version until they complete.

### 4 — Delete a Deployed Process

1. Click the **Delete** icon next to the process.
2. Confirm the deletion.

> ⚠️ **Caution:** Deleting a process definition removes it from the catalogue. Active instances that were started from it will continue to completion, but no new instances can be started.

### 5 — View the BPMN Diagram

- Click the **Edit** icon on any process to open its modal.
- The BPMN viewer renders the diagram so you can inspect flow, task names, gateways, and events without opening an external tool.
- Use the viewer controls to zoom and pan across large diagrams.

---

## Best Practices

- **Design in Camunda Modeler first.** Model and validate your BPMN externally before uploading — the platform does not have a built-in BPMN editor.
- **Keep Process Definition Keys stable.** The key is referenced by API calls (`start.process`) and Process Map configurations. Changing it after deployment breaks existing integrations.
- **Version with new records rather than overwriting.** When making significant changes, create a new Deploy Process entry with a versioned key (e.g. `leave-request-v2`) to avoid disrupting running instances.
- **Test in a non-production environment first.** Deploy to a staging site before pushing to production to catch flow errors early.
