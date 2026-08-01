# Web Content, Forms, Data Lists & SQL APIs

## Purpose

This area covers the full suite of **low-code content and data tools** available to administrators. It encompasses:

- **Web Content** — creating and publishing posts, articles, and digital content for your sites.
- **Forms** — designing data-capture forms used in pages and process steps.
- **Data Lists** — configuring structured list views that display, filter, and act on data.
- **SQL APIs** — building REST endpoints that expose database query results to internal and external consumers.
- **Document Repository** — managing a shared file and document library with versioning, permissions, and collaboration features.

---

## Key Concepts

| Term | Description |
|---|---|
| **Post / Content Item** | A named piece of digital content (article, announcement, knowledge-base entry) published on a site page. |
| **Form** | A low-code data-entry screen with fields, validation, and submit actions. Identified by a Form Key. |
| **Data List** | A configured view that retrieves and displays data as a table, gallery, listing, cart, or grouped layout. |
| **SQL API** | A REST endpoint backed by a SQL query against a connected database. |
| **Data Source** | A database connection (PostgreSQL) used by Data Lists and SQL APIs. |
| **Document Repository (DMS)** | A folder-based file library with versioning, activity logs, permissions, likes, favourites, and comments. |
| **Custom Action** | A button on a Form or Data List that triggers a downstream process, API call, or navigation action. |
| **Bulk Action** | An action that operates on multiple selected rows in a Data List simultaneously. |
| **Visibility Control** | Rules that show or hide Data List columns based on user role or data values. |

---

## Web Content

### Create a Content Post

1. Navigate to **Administrate Websites → Pages** and open or create a page with a **Post** component.
2. Inside the Post component, click **Add New**.
3. Enter a **Title**, **Body** (rich text), and optional **Tags** or **Category**.
4. Set the **Publish Date** and **Status** (Draft / Published).
5. Click **Save**. Published posts appear immediately on the page.

### Edit or Unpublish Content

- Click **Edit** on any post to update its content.
- Change the Status back to **Draft** to remove it from public view without deleting it.

---

## Forms (Form Builder)

### Create a Form

1. Go to **Administrate → Forms & Data → Forms**.
2. Click **Add New**, enter a **Name** and **Form Key**.
3. Design fields on the canvas (see the [Forms guide](../capture/forms.md) for full field reference).
4. Add **Custom Actions** if the form should trigger downstream processes.
5. Click **Save**.

### Embed a Form on a Page

1. In the **Page Designer**, drag a **Form** component onto the canvas.
2. Set the **Form Key** to the key of the form you created.
3. Set the display **Mode** (`render` for editable, `readonly` for view-only).
4. Save the page.

---

## Data Lists

### Create a Data List

1. Go to **Administrate → Forms & Data → Data Lists**.
2. Click **Add New**.
3. Configure:
   - **Name** and **Data List Key**.
   - **Data Source** — the SQL API or process data feed to query.
   - **Fields** — choose which columns to display; set labels, order, and visibility.
   - **View Type** — Table, Gallery, Listing, Cart, or Grouped Table.
4. Click **Save**.

### Configure Columns and Order

1. Open the Data List and go to **Fields**.
2. Drag fields to reorder columns.
3. Set each field's **Label**, **Width**, and **Visibility Control** rules.
4. Mark columns as **Sortable** or **Searchable** as needed.

### Add Actions to a Data List

- **Default Actions** — Edit, View, Delete per row (configure which appear and their permissions).
- **Custom Actions** — click **Custom Actions → Add** to define a button that triggers a process, API call, or page navigation for the selected row.
- **Bulk Actions** — click **Bulk Actions → Add** to define actions that operate on multiple selected rows at once (e.g., bulk approve, bulk export).

### Embed a Data List on a Page

1. In the **Page Designer**, drag a **Data List** component onto the canvas.
2. Set the **Data List Key**.
3. Configure optional filters or conditions to pre-filter the displayed data.
4. Save the page.

### Import / Export Data Lists

- **Export** — click **Export** to download the Data List definition as a file (for backup or migration).
- **Import** — click **Import** and upload a previously exported definition file to restore or copy a Data List between environments.

---

## SQL APIs

### Create a SQL API

1. Go to **Administrate → Forms & Data → SQL APIs**.
2. Click **Add New**.
3. Set:
   - **Service Key** — unique endpoint identifier (e.g., `hr.leave.pending`).
   - **Data Source** — the connected database to query.
   - **SQL Query** — the SELECT statement to execute.
4. Click **Save**. The endpoint is immediately active.

For full details on SQL APIs and calling them from external systems, see the [APIs guide](../capture/apis.md).

---

## Document Repository

### Browse and Upload Documents

1. Navigate to a site page containing the **Repository** component.
2. Browse folders in the left panel.
3. Click **Upload** to add files. Documents are stored with version history automatically.

### Document Operations

| Action | How |
|---|---|
| **Preview** | Click the document name — PDF and image files open in an inline viewer. |
| **Download** | Click the Download icon. |
| **Revise** | Upload a new version via **Revise** — the previous version is preserved in **Revision History**. |
| **Move** | Drag to a different folder or use **Move** from the action menu. |
| **Delete (Recycle Bin)** | Deleted documents go to the **Recycle Bin** and can be restored within the retention period. |
| **Favourite** | Click the star icon to bookmark frequently accessed documents. |
| **Like / Comment** | Social-style engagement on documents shared with a team. |
| **Permissions** | Set which groups can view, edit, or delete a document via the **Permissions** panel. |
| **Activity Log** | View the full history of who accessed, modified, or commented on a document. |

---

## Best Practices

- **Use Data Lists instead of hard-coded tables.** Data Lists are maintainable, searchable, and support actions — raw HTML tables cannot be updated without a developer.
- **Leverage Custom Actions for approvals.** Rather than building separate approval UIs, add a "Approve" Custom Action to a Data List that triggers the relevant process step.
- **Use Visibility Controls to simplify views.** Show columns only to the roles that need them — administrators and end users often need very different views of the same data.
- **Version control documents via Revise, not re-upload.** Always use the Revise action to replace a document — this preserves the revision chain and audit trail.
- **Set permissions on sensitive documents.** Restrict access to HR, legal, or financial documents at the folder or document level using the Permissions panel.
- **Use Bulk Actions for operational efficiency.** If managers routinely approve or reject batches of requests, create a Bulk Action to process them in one click instead of one by one.
