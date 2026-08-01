# Appflexor APIs

## Purpose

Appflexor APIs let you expose your business data and processes to external systems through SQL-backed REST endpoints. Without writing backend code, you can configure a **Data API** that queries your connected database, returns structured JSON, and can be consumed by external applications, integrations, or third-party tools. Combined with **Process APIs**, external systems can start, advance, and complete Appflexor workflows programmatically.

---

## Key Concepts

| Term | Description |
|---|---|
| **Data API** | A configured REST endpoint that runs a named SQL query against a connected data source and returns results as JSON. |
| **Service Key** | The unique identifier for an API endpoint. External callers reference this key in their requests. |
| **Data Source** | A database connection (PostgreSQL, or Elasticsearch) configured under **Data Sources** and referenced by a Data API. |
| **API Key** | A secret token that authenticates external callers to your Data API endpoints. |
| **Process API** | The BPM service layer that allows external systems to start, interact with, and query the status of running processes. |
| **DB Explorer** | A read-only tool to browse your connected database schema — tables, columns, constraints, and live data — to help craft accurate queries. |

---

## Data APIs — Step-by-Step

### 1 — Configure a Data Source

Before creating a Data API, you need a connected database.

1. Go to **Administrate → Forms & Data → Data Sources**.
2. Click **Add New**.
3. Fill in:
   - **Code** — short internal identifier (e.g., `hr_db`).
   - **Name** — human-readable label.
   - **Driver** — database driver (e.g., PostgreSQL).
   - **URL** — JDBC connection string.
   - **User / Password** — database credentials.
   - **Description** — optional notes.
4. Click **Save**. A toast confirms "Datasource Saved Successfully."
5. Use **DB Explorer** (tab in Forms & Data) to browse the schema and verify connectivity.

### 2 — Browse the Schema (DB Explorer)

1. Go to **Administrate → Forms & Data → DB Explorer**.
2. Select a **Data Source** from the dropdown.
3. Browse **Tables**, **Columns**, and **Constraints**.
4. Click a table to preview live data — useful for building correct SQL queries.

### 3 — Create a Data API

1. Go to **Administrate → Forms & Data → SQL APIs**.
2. Click **Add New**.
3. Configure:
   - **App** — the application/site this API belongs to.
   - **Service Key** — unique key used by callers (e.g., `hr.employee.list`).
   - **Data Source** — select the database connection from step 1.
   - **SQL Query** — the SELECT statement to run when the endpoint is called.
4. Click **Save**. The API is immediately active.

### 4 — Call the Data API

External systems call the API using the Service Key:

```
GET /api/service?service.key=<your-service-key>
Authorization: Bearer <API_KEY>
```

The response returns a JSON object with the query results under a data key matching your Service Key name.

### 5 — Edit or Delete a Data API

- Click the **Edit** icon to modify the SQL query, data source, or service key.
- Click **Delete** to remove the endpoint. Coordinate with any external consumers before deleting.

### 6 — Export API Definitions

1. Select one or more APIs in the list.
2. Click **Export** to download a definition file for backup or migration between environments.

---

## Process APIs — Overview

Appflexor's BPM layer exposes process operations via the internal BPM service URL. External systems can:

| Operation | Description |
|---|---|
| **Start a process** | Trigger a new process instance by providing the process definition key and start-form data. |
| **Complete a task** | Submit form data to advance a running process instance through a user task. |
| **Query process status** | Retrieve the current state, active tasks, and variables of a running process instance. |
| **List processes** | Get a list of deployed processes and their definitions. |

Process API calls are authenticated using the same API Key mechanism as Data APIs.

---

## Best Practices

- **Use specific Service Keys.** Follow a `domain.entity.operation` naming pattern (e.g., `hr.leave.pending`) to keep APIs organised and discoverable.
- **Limit SQL scope.** Write SELECT-only queries with WHERE clauses and LIMIT — never expose unfiltered full-table scans via a public API.
- **Parameterise queries.** Use query parameters passed by the caller in your SQL WHERE clauses to filter results dynamically, rather than hard-coding values.
- **Rotate API Keys regularly.** Treat API Keys as secrets — rotate them periodically and revoke unused ones promptly.
- **Use DB Explorer to validate SQL.** Browse real schema data before finalising your query to avoid column-name errors in production.
- **Version your Service Keys.** When making breaking changes to a query's output structure, create a new key (e.g., `hr.employee.list.v2`) and deprecate the old one — do not change the schema of an existing live key.
- **Test with a read-only database user.** Connect Data Sources using a database account with SELECT-only privileges to prevent accidental writes through the API layer.
