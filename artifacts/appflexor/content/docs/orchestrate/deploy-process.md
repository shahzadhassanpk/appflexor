# Deploy Process

## Purpose

The **Deploy Process** action opens the **Process Configuration** workspace. Use this workspace to manage the business catalogue around a deployed BPMN process: Business Areas, Governing Bodies, Process Categories, process visibility, start forms, user-group access, and sites.

The workspace also provides separate full-screen areas to **Deploy** BPMN definitions, **Configure** process maps, and **Monitor** process activity.

---

## Workspace Overview

| Area | What it does |
|---|---|
| **Business Areas and Processes** | Shows mapped processes grouped by Business Area, with process and Business Area counts. |
| **Governing Bodies** | Maintains the accountable teams that own approval and policy decisions for processes. |
| **Process Categories** | Maintains the strategic categories used to classify processes. |
| **Deploy** | Opens the deployment workspace for BPMN process definitions. |
| **Configure** | Opens the Process Map workspace where a deployed process is made available to the right users and sites. |
| **Monitor** | Opens the Process Monitor workspace. |

---

## Open the Process Configuration Workspace

1. From the Control Panel, open **Orchestrate → Deploy Process**.
2. The page lists Business Areas on the left and the available Governing Bodies and Process Categories on the right.
3. Use the header actions to open **Deploy**, **Configure**, or **Monitor** in a full-screen workspace.

> ℹ️ The Help navigation uses the Control Panel label **Deploy Process**. On this page, the **Configure** action is where process mappings and access settings are maintained.

---

## Browse the Process Catalogue

The main catalogue is grouped by **Business Area**. Each group shows:

- The Business Area title and description.
- The number of mapped processes.
- Its child processes, including Governing Body and Category badges when those relationships are configured.

### Search and expand areas

1. Use **Search business areas or processes…** to find a Business Area by title or key, or a process by title or process key.
2. Matching Business Areas expand automatically while searching.
3. Use the chevron beside a Business Area to expand or collapse its process list.
4. Select a process title to open its BPMN diagram in a full-screen viewer.

> ℹ️ A process is shown in the tree only when it is mapped to a Business Area. Configure the process map after deployment to make it appear in the catalogue.

---

## Manage Business Areas

Business Areas are the top-level domains used to group processes, such as *Human Resources*, *Finance*, or *Operations*.

### Add a Business Area

1. In **Business Areas and Processes**, select **Business Area**.
2. Enter:
   - **Title** — the name shown in the catalogue.
   - **Key** — the identifier used when matching processes to the area.
   - **Description** *(optional)* — a short explanation of the area’s scope.
3. Select **Save**.

Title and Key are required. Use the Edit and Delete icons on an existing Business Area to maintain it. Deletion requires confirmation.

---

## Manage Governance and Categories

Use the panels on the right side of the workspace to maintain the reference data used by process maps.

### Governing Bodies

1. Select **Add New** in the **Governing Bodies** panel.
2. Enter a required **Title** and **Key**.
3. Select **Save**.

Each process map can be assigned one Governing Body to identify the team responsible for approvals and policy. The panel shows the number of mapped processes for each body.

### Process Categories

1. Select **Add New** in the **Process Categories** panel.
2. Enter a required **Title** and **Key**.
3. Select **Save**.

Categories describe the strategic purpose of a process. The panel shows the number of mapped processes for each category.

> ⚠️ **Before deleting a Business Area, Governing Body, or Category**, review its displayed process count and update affected process maps first. Deleting a reference item does not automatically reassign its mapped processes.

---

## Configure a Process Map

A **Process Map** connects a deployed BPMN definition to its catalogue position and controls who can start it and where it appears.

### Before you begin

Make sure you have:

- A deployed BPMN process.
- At least one Business Area, Governing Body, and Process Category.
- A start form.
- At least one User Group and Site.

### Create or update a mapping

1. Select **Configure** in the page header.
2. In the full-screen Process Map list, select **Add New** or the Edit icon for an existing mapping.
3. Complete the configuration panels below.
4. Select **Save Changes**.
5. Close the Configure workspace to reload the main process catalogue.

### Process details

| Field | Description |
|---|---|
| **Process** | The deployed BPMN definition to expose in the catalogue. |
| **Process Title** | The display name for the process. |
| **Sub Title** | A short supporting label for the process. |
| **Description** | Optional rich-text explanation of the process and when to use it. |

### Governance

| Field | Description |
|---|---|
| **Business Area** | The business domain that groups the process in the catalogue. |
| **Governing Body** | The team accountable for approvals and policy. |
| **Category** | The strategic classification used to organise the process. |

### Access control

| Field | Description |
|---|---|
| **Start Form** | The form shown when a user starts this process. |
| **User Group(s)** | The groups allowed to initiate and access the process. At least one group is required. |
| **Site(s)** | The sites where the process is visible. At least one site is required. |

### Behavior and advanced settings

| Setting | Effect |
|---|---|
| **Is Active** | Makes the process available to end users. Inactive processes are hidden. |
| **Hide Inbox Start** | Removes the process from Inbox quick-start options without deleting its configuration. |
| **Submit Label** | Optional text for the start-form submission action, such as *Submit for Approval*. |
| **Process Start URL** | A read-only start link available after the mapping is first saved. Use **Copy Link** to copy it. |

> ℹ️ The Save action requires a configured process, title, governance details, start form, and at least one User Group and Site.

---

## Deploy and Monitor

- Select **Deploy** to open the BPMN deployment list, where you can add, edit, search, and remove deployed process definitions.
- Select **Monitor** to open the process monitoring workspace.
- Closing the **Configure** workspace refreshes the Process Configuration page so its Business Area tree reflects the latest mappings.

---

## Best Practices

- **Build the governance structure first.** Create Business Areas, Governing Bodies, and Process Categories before mapping a process.
- **Map every deployed process deliberately.** A process needs a Business Area mapping to appear in the main catalogue tree.
- **Keep access narrow.** Assign only the User Groups and Sites that should be able to start or access the process.
- **Use inactive status for temporary withdrawal.** Mark a process inactive instead of deleting its map when it may return later.
- **Use Hide Inbox Start selectively.** It is useful when a process should be started from a direct link or another journey, but not from the Inbox.
- **Review the BPMN diagram before changing access.** Open the process from the catalogue to confirm you are configuring the intended workflow.
