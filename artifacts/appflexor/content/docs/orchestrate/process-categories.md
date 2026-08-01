# Process Categories

## Purpose

**Process Categories** provide the second level of organisation in the Appflexor process catalogue, sitting beneath **Business Areas**. Where a Business Area represents a broad organisational domain (e.g., Human Resources), a Process Category groups related workflows within that domain into a specific topic or function (e.g., Leave Management, Recruitment, Performance Review). Together they form the two-level navigation hierarchy that end users see when browsing available processes.

---

## Key Concepts

| Term | Description |
|---|---|
| **Process Category** | A named sub-grouping within a Business Area that organises processes by topic or functional area. |
| **Business Area** | The parent domain that contains one or more Process Categories. |
| **Process Map** | The configuration that assigns a deployed process to a specific Category (and Business Area), making it appear in the user catalogue. |
| **Category Code** | A short unique identifier for the Category, used in process mappings and API references. |

---

## Step-by-Step Usage

### 1 — Open Process Category Management

1. Navigate to **Orchestrate → Configure Processes**.
2. Select the **Process Categories** tab.
3. The list shows all categories, their parent Business Area, code, and name.

### 2 — Create a Process Category

1. Click **Add New**.
2. Fill in:
   - **Business Area** — select the parent domain this category belongs to.
   - **Name** — the display label shown in the catalogue (e.g., `Leave Management`).
   - **Code** — a short unique identifier (e.g., `LEAVE`). Combined with the Business Area code to form a full reference.
   - **Description** *(optional)* — explains the scope of processes in this category.
3. Click **Save**. The category is immediately available for use in Process Maps.

### 3 — Edit a Process Category

1. Locate the category in the list.
2. Click the **Edit** icon.
3. Update the Name or Description as needed.
4. Click **Save**.

> ⚠️ Changing the Code after processes have been mapped to this category will break those mappings. Avoid renaming Codes in production.

### 4 — Delete a Process Category

1. Click the **Delete** icon.
2. Confirm the deletion.

> ⚠️ **Caution:** Removing a category that processes are mapped to will hide those processes from the end-user catalogue. Reassign affected Process Maps first.

### 5 — Assign Processes to a Category

1. Go to **Orchestrate → Configure Processes → Process Map**.
2. Select or create a Process Map.
3. Set the **Business Area** and **Process Category** dropdowns.
4. Complete the process definition, form, site, and group fields.
5. Save — the process is now listed in the catalogue under the chosen category.

### 6 — View Categories by Business Area

In the category list, use the **Business Area** filter to show only categories belonging to a specific domain — useful when managing large catalogues.

---

## Best Practices

- **Use meaningful names.** Category names should reflect the business topic, not technical terms — "Leave Management" is better than "HR_PROC_TYPE_2".
- **Aim for 3–8 categories per Business Area.** Fewer than 3 may mean you don't need categories yet; more than 8 makes the catalogue hard to scan.
- **Align categories with team ownership.** Each category should have a clear business owner who is responsible for the processes within it.
- **Don't create categories with only one process.** If a category would contain only one item, consider whether the Business Area level is sufficient, or whether more processes will follow.
- **Plan before you build.** Define your full Business Area → Category → Process hierarchy before configuring Appflexor. Reorganising an established catalogue requires updating all affected Process Maps and re-communicating navigation changes to users.
- **Use consistent naming conventions.** Decide on singular vs. plural ("Leave Management" vs. "Leaves"), title case vs. sentence case, and apply it uniformly across all categories.
