# Appflexor APIs

## Purpose

Appflexor APIs let you expose your business data and processes to external systems through SQL-backed REST endpoints. Without writing backend code, you can configure a **Data API** that queries your connected database, returns structured JSON, and can be consumed by external applications, integrations, or third-party tools.

---

## Key Concepts

| Term | Description |
|---|---|
| **Service Key** | Query-string identifier that tells the platform which operation to run (e.g. `login`, `multiKey.data`, `update.formData`). |
| **AUTH_KEY** | Session token returned by the Login API. Must be sent as a request header on every subsequent call. |
| **Data Source** | A named database connection configured under **Administrate → Forms & Data → Data Sources**. |
| **Entity** | The table or form object name used when saving or deleting records. |
| **dataKey** | The key under which a query result is returned in the `C_DATA` response object. |

---

## Step 0 — Authenticate: Login API

All platform API calls require an `AUTH_KEY` header. Obtain one by calling the Login API first.

**Request**

```
POST /app/service?service.key=login
Content-Type: application/json
```

```json
{
  "username": "john.doe@example.com",
  "password": "mySecretPassword"
}
```

**Response**

```json
{
  "C_STATUS": "SUCCESS",
  "C_MESSAGE": "Login successful",
  "C_DATA": {
    "AUTH_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

| Field | Description |
|---|---|
| `C_STATUS` | `"SUCCESS"` or `"FAIL"` |
| `C_MESSAGE` | Human-readable status message |
| `C_DATA.AUTH_KEY` | Session token — store this value and include it in every subsequent request header |

**On failure** (`C_STATUS: "FAIL"`) the login was rejected (bad credentials). No `AUTH_KEY` is issued.

> **Usage:** Store `C_DATA.AUTH_KEY` and pass it as the `AUTH_KEY` request header on all following API calls.

---

## Step 1 — Configure a Data Source

Before creating a Data API, connect a database.

1. Go to **Administrate → Forms & Data → Data Sources**.
2. Click **Add New** and fill in:
   - **Code** — short internal identifier (e.g. `hr_db`).
   - **Name** — human-readable label.
   - **Driver** — database driver (e.g. PostgreSQL).
   - **URL** — JDBC connection string.
   - **User / Password** — database credentials.
3. Click **Save**. A toast confirms "Datasource Saved Successfully."
4. Use **DB Explorer** to browse the schema and verify connectivity.

---

## Step 2 — Browse the Schema (DB Explorer)

1. Go to **Administrate → Forms & Data → DB Explorer**.
2. Select a **Data Source** from the dropdown.
3. Browse **Tables**, **Columns**, and **Constraints**.
4. Click a table to preview live data — useful for building correct SQL queries.

---

## Step 3 — Create a Data API

1. Go to **Administrate → Forms & Data → SQL APIs**.
2. Click **Add New** and configure:
   - **App** — the site this API belongs to.
   - **Service Key** — unique key callers reference (e.g. `hr.employee.list`).
   - **Data Source** — the connection from Step 1.
   - **SQL Query** — the SELECT statement to run.
3. Click **Save**. The endpoint is immediately active.

---

## Step 4 — Call the Get Data API

Use `multiKey.data` to fetch results from one or more configured SQL APIs in a single round trip.

**Request**

```
POST /app/service?service.key=multiKey.data
Content-Type: application/json
AUTH_KEY: <AUTH_KEY from Login API>
```

```json
{
  "dataKeys": [
    {
      "serviceKey": "hr.employee.list",
      "serviceParams": "",
      "dataKey": "employees",
      "mode": "formData"
    }
  ]
}
```

| Field | Description |
|---|---|
| `dataKeys[].serviceKey` | The **Service Key** of the SQL API to call |
| `dataKeys[].serviceParams` | Optional parameter passed into the SQL query (e.g. a record `id`) |
| `dataKeys[].dataKey` | The key used to access results in the response `C_DATA` object |
| `dataKeys[].mode` | Always `"formData"` |
| `dataKeys[].datasource` | Per-key data source override (optional) |

**Response**

```json
{
  "C_STATUS": "SUCCESS",
  "C_DATA": {
    "employees": [
      { "id": "1", "name": "Alice Smith", "department": "Engineering" },
      { "id": "2", "name": "Bob Jones",  "department": "Finance" }
    ]
  }
}
```

Results are available at `response.data.C_DATA[dataKey]`.

**Fetching by ID** — pass the record ID in `serviceParams` and a matching SQL `WHERE` clause:

```json
{
  "dataKeys": [
    {
      "serviceKey": "hr.employee.byId",
      "serviceParams": "42",
      "dataKey": "42",
      "mode": "formData"
    }
  ]
}
```

---

## Step 5 — Save and Update Records

Use `update.formData` to create or update a record. The same endpoint handles both; an `id` of `"new"` creates a record, any other value updates it.

**Request**

```
POST /app/service?service.key=update.formData
Content-Type: application/json
AUTH_KEY: <AUTH_KEY from Login API>
```

```json
{
  "datasource": "hr_db",
  "saveOrUpdate": "Yes",
  "data": [
    {
      "formId":   "employee",
      "entity":   "employee",
      "action":   "update",
      "mode":     "formData",
      "id":       "1",
      "formData": {
        "id":         "1",
        "name":       "Alice Smith",
        "department": "Engineering",
        "email":      "alice@example.com"
      }
    }
  ]
}
```

| Field | Description |
|---|---|
| `datasource` | Data source code where the entity lives |
| `saveOrUpdate` | Always `"Yes"` to persist the record |
| `data[].formId` | Entity / table name |
| `data[].entity` | Same as `formId` |
| `data[].action` | `"update"` for create or update |
| `data[].mode` | Always `"formData"` |
| `data[].id` | Record ID — use `"new"` to insert, existing ID to update |
| `data[].formData` | Key-value object of field names and their new values |

**Response**

```json
{
  "C_STATUS": "SUCCESS",
  "C_MESSAGE": "Record saved"
}
```

**Bulk save** — include multiple objects in the `data` array to create or update several records in one call.

---

## Step 6 — Delete Records

Use `update.formData` with `action: "delete"`. Pass each record `id` to remove as a separate entry in the `data` array.

**Request**

```
POST /app/service?service.key=update.formData
Content-Type: application/json
AUTH_KEY: <AUTH_KEY from Login API>
```

```json
{
  "datasource": "hr_db",
  "data": [
    {
      "formId": "employee",
      "entity": "employee",
      "action": "delete",
      "id":     "1"
    },
    {
      "formId": "employee",
      "entity": "employee",
      "action": "delete",
      "id":     "2"
    }
  ]
}
```

| Field | Description |
|---|---|
| `data[].action` | `"delete"` — marks the record for deletion |
| `data[].id` | ID of the record to remove |

**Response**

```json
{
  "C_STATUS": "SUCCESS",
  "C_MESSAGE": "Record deleted"
}
```

---

## Step 7 — Edit or Export API Definitions

- Click the **Edit** icon on any SQL API to change its query, data source, or key.
- Select one or more APIs and click **Export** to download definitions for backup or cross-environment migration.

---

## Best Practices

- **Always authenticate first.** Call the Login API and store `AUTH_KEY` before any data API call.
- **Use specific Service Keys.** Follow a `domain.entity.operation` pattern (e.g. `hr.leave.pending`) to keep endpoints organised.
- **Limit SQL scope.** Write SELECT-only queries with WHERE clauses and LIMIT — never expose unfiltered full-table scans.
- **Parameterise queries.** Use `serviceParams` in your SQL WHERE clause rather than hard-coding values.
- **Multi-fetch in one call.** Include multiple entries in `dataKeys` to retrieve several datasets in a single round trip.
- **Bulk-write in one call.** Include multiple entries in `data` when saving or deleting to reduce round trips.
- **Test with DB Explorer.** Validate your SQL against live schema data before activating the endpoint.
- **Version breaking changes.** When changing a query's output shape, create a new key (e.g. `hr.employee.list.v2`) rather than modifying a live key in place.
