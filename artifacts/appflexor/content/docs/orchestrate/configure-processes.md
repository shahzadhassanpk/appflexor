# Configure Processes

## Purpose

Use **Configure Processes** to organize deployed BPMN definitions into the Appflexor process catalogue and control who can start or access them. The workspace manages Business Areas, Governing Bodies, Process Categories, process maps, start forms, user groups, sites, and visibility settings.

---

## Workspace Overview

| Area | What it does |
|---|---|
| **Business Areas and Processes** | Shows mapped processes grouped by Business Area, with process and Business Area counts. |
| **Governing Bodies** | Maintains the accountable teams that own approval and policy decisions. |
| **Process Categories** | Maintains the strategic categories used to classify processes. |
| **Process Map** | Connects a deployed process to its catalogue position and access settings. |

---

## Open Configure Processes

1. Navigate to **Orchestrate → Configure Processes**.
2. The Process Configuration workspace lists Business Areas on the left and reference data panels on the right.
3. Use the **Configure** action to open the full-screen Process Map workspace.

If your Orchestrate landing page opens the broader Process Configuration screen first, select **Configure** there to reach the Process Map workspace.

---

## Browse the Process Catalogue

The catalogue is grouped by **Business Area**. Each group shows its title, description, process count, and child processes. Process rows can show Governing Body and Category badges when those relationships are configured.

1. Use **Search business areas or processes…** to search Business Area titles or keys, or process titles or keys.
2. Matching Business Areas expand automatically while searching.
3. Use the chevron beside a Business Area to expand or collapse its process list.
4. Select a process title to open its BPMN diagram.

> ℹ️ A process appears in this tree only after it has a Process Map assignment to a Business Area.

---

## Manage Reference Data

### Business Areas

Select **Business Area** in the Business Areas and Processes panel, then enter:

- **Title** — the name shown in the catalogue.
- **Key** — the identifier used when matching a process to the area.
- **Description** *(optional)* — an explanation of the area’s scope.

Select **Save**. Use the Edit and Delete actions on an existing area to maintain it. Title and Key are required.

### Governing Bodies

1. Select **Add New** in **Governing Bodies**.
2. Enter a required **Title** and **Key**.
3. Select **Save**.

Assign a Governing Body to each process map to identify the team responsible for approvals and policy.

### Process Categories

1. Select **Add New** in **Process Categories**.
2. Enter a required **Title** and **Key**.
3. Select **Save**.

Categories describe the strategic purpose of a process and help organize the process catalogue.

> ⚠️ Before deleting a reference item, review its displayed process count and update affected Process Maps first. Deletion requires confirmation and does not automatically reassign mappings.

---

## Configure a Process Map

### Before you begin

Make sure you have:

- A deployed BPMN process. See [Deploy Process](deploy-process.md).
- At least one Business Area, Governing Body, and Process Category.
- A start form.
- At least one User Group and Site.

### Create or update a mapping

1. Select **Configure**.
2. In the Process Map list, select **Add New** or the Edit action.
3. Complete the configuration panels.
4. Select **Save Changes**.
5. Close the Configure workspace to reload the main catalogue.

### Process details

| Field | Description |
|---|---|
| **Process** | The deployed BPMN definition to expose. |
| **Process Title** | The display name for the process. |
| **Sub Title** | A short supporting label. |
| **Description** | Optional rich-text explanation. |

### Governance

| Field | Description |
|---|---|
| **Business Area** | The business domain that groups the process. |
| **Governing Body** | The team accountable for approvals and policy. |
| **Category** | The strategic classification for the process. |

### Access control

| Field | Description |
|---|---|
| **Start Form** | The form shown when a user starts the process. |
| **User Group(s)** | The groups allowed to initiate and access the process. At least one is required. |
| **Site(s)** | The sites where the process is visible. At least one is required. |

### Behavior and advanced settings

| Setting | Effect |
|---|---|
| **Is Active** | Makes the process available to end users. Inactive processes are hidden. |
| **Hide Inbox Start** | Removes the process from Inbox quick-start options without deleting its configuration. |
| **Submit Label** | Optional text for the start-form submission action. |
| **Process Start URL** | A read-only start link available after the mapping is first saved. Use **Copy Link** to copy it. |

> ℹ️ Save requires a configured process, title, governance details, start form, at least one User Group, and at least one Site.

---

## Best Practices

- **Build the reference structure first.** Create Business Areas, Governing Bodies, and Categories before mapping processes.
- **Map every deployed process deliberately.** A process needs a Business Area mapping to appear in the catalogue tree.
- **Keep access narrow.** Assign only the User Groups and Sites that should start or access the process.
- **Use inactive status for temporary withdrawal.** Mark a process inactive instead of deleting its map when it may return later.
- **Use Hide Inbox Start selectively.** It is useful when a process should be started from a direct link or another journey.
- **Review the BPMN diagram before changing access.** Confirm you are configuring the intended workflow.