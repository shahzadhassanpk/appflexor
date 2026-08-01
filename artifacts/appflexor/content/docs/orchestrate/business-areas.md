# Business Areas

## Purpose

A **Business Area** is the top-level organisational domain that groups related processes together. Business Areas represent the major functions or divisions of your organisation — such as Human Resources, Finance, Operations, or Customer Service. They provide the first level of navigation in the process catalogue and help users quickly locate the workflows relevant to their role.

---

## Key Concepts

| Term | Description |
|---|---|
| **Business Area** | A named organisational domain used to categorise processes (e.g., "Human Resources", "Finance"). |
| **Process Category** | A sub-grouping within a Business Area that organises processes by topic or function. |
| **Process Map** | The configuration that links a deployed process to a Business Area, Category, site, groups, and forms. |
| **Process Catalogue** | The end-user view of all available processes, organised by Business Area and Category. |

---

## Step-by-Step Usage

### 1 — Open Business Area Management

1. Navigate to **Orchestrate → Configure Processes**.
2. Select the **Business Areas** tab.
3. The list shows all existing Business Areas with their name, code, and status.

### 2 — Create a Business Area

1. Click **Add New**.
2. Fill in:
   - **Name** — the display name shown to users (e.g., `Human Resources`).
   - **Code** — a short, unique identifier (e.g., `HR`). Used internally for lookups and mappings.
   - **Description** *(optional)* — a brief explanation of which processes belong here.
3. Click **Save**. The Business Area is now available for use in Process Maps.

### 3 — Edit a Business Area

1. Locate the Business Area in the list.
2. Click the **Edit** icon.
3. Update the Name or Description (the Code cannot be changed after creation to avoid breaking existing mappings).
4. Click **Save**.

### 4 — Delete a Business Area

1. Click the **Delete** icon next to the Business Area.
2. Confirm the deletion.

> ⚠️ **Caution:** Deleting a Business Area that has active Process Maps will break those mappings. Reassign or remove associated Process Maps before deleting.

### 5 — Map a Process to a Business Area

Once a Business Area exists, link processes to it via the **Process Map** configuration:

1. Go to **Orchestrate → Configure Processes → Process Map**.
2. Select or create a Process Map entry.
3. Choose the **Business Area** from the dropdown.
4. Assign a **Process Category** within that area.
5. Complete the remaining mapping fields (process definition, form, site, groups).
6. Click **Save**.

The process now appears in the end-user process catalogue under the chosen Business Area and Category.

---

## Best Practices

- **Mirror your real organisational structure.** Name Business Areas after actual business functions so users find processes intuitively without needing instructions.
- **Keep the number of Business Areas small.** Aim for 5–10 top-level areas. Too many areas fragment the catalogue and make navigation harder.
- **Use Codes consistently.** Choose short, uppercase codes (e.g., `HR`, `FIN`, `OPS`) and apply them consistently — they appear in logs, API responses, and mapping references.
- **Plan the hierarchy before building.** Sketch out Business Areas and their Process Categories on paper before configuring them in Appflexor — restructuring later requires updating all Process Maps.
- **Don't overlap domains.** Assign each process to exactly one Business Area. If a process genuinely spans two areas, place it in the primary owner's area and cross-reference it in documentation.
