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

## Step 5a — Upload a File with a Record

Add a `fileData` array to any `update.formData` request to attach one or more files in the same round trip. The platform stores the file and links it to the saved record automatically.

**How it works**

1. Read the file in your client and base64-encode its contents.
2. Include the base64 string in `fileData[].content`.
3. Set the field that holds the file name in `formData` (e.g. `attachment`) to the same `fileName`.
4. Send the request — the platform saves the record and stores the file together.

---

### JavaScript — encode a file before uploading

```js
function encodeFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => {
            // FileReader returns "data:<mime>;base64,<content>"
            const base64Content = e.target.result.split("base64,")[1];
            resolve(base64Content);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
```

---

### Create a new record and upload a file

Use `id: "new"` in both `data[].id` and `formData.id`. The platform inserts the record and returns the generated ID.

**Request**

```
POST /app/service?service.key=update.formData
Content-Type: application/json
AUTH_KEY: <AUTH_KEY from Login API>
```

```json
{
  "data": [
    {
      "formId":   "employee_documents",
      "entity":   "employee_documents",
      "action":   "update",
      "id":       "new",
      "formData": {
        "id":          "new",
        "attachment":  "contract_alice.pdf",
        "title":       "Employment Contract",
        "tags":        "contract,onboarding",
        "employee_id": "42"
      },
      "fileData": [
        {
          "fileName": "contract_alice.pdf",
          "content":  "<base64-encoded file content>"
        }
      ]
    }
  ]
}
```

| Field | Description |
|---|---|
| `formData.<fieldColumn>` | The form field that stores the file name — set it to `fileName` so the record knows which file is attached |
| `fileData[].fileName` | File name including extension — must match `formData.<fieldColumn>` |
| `fileData[].content` | Base64-encoded file content (the string after `"base64,"` from a `FileReader` result) |

**Response**

```json
{
  "C_STATUS": "SUCCESS",
  "C_DATA": [
    {
      "formData": {
        "id":          "107",
        "attachment":  "contract_alice.pdf",
        "title":       "Employment Contract",
        "tags":        "contract,onboarding",
        "employee_id": "42"
      }
    }
  ]
}
```

The returned `formData.id` is the generated record ID. Use it to link the record in your application or to build the file URL.

---

### Update an existing record and replace its file

Supply the existing record `id` to update the row and overwrite the stored file.

```json
{
  "data": [
    {
      "formId":   "employee_documents",
      "entity":   "employee_documents",
      "action":   "update",
      "id":       "107",
      "formData": {
        "id":          "107",
        "attachment":  "contract_alice_v2.pdf",
        "title":       "Employment Contract (Revised)"
      },
      "fileData": [
        {
          "fileName": "contract_alice_v2.pdf",
          "content":  "<base64-encoded file content>"
        }
      ]
    }
  ]
}
```

---

### Upload multiple files in one call

Include one object per file in the `data` array. Each object can target the same or different entities.

```json
{
  "data": [
    {
      "formId": "employee_documents", "entity": "employee_documents",
      "action": "update", "id": "new",
      "formData": { "id": "new", "attachment": "id_scan.jpg",  "employee_id": "42" },
      "fileData": [{ "fileName": "id_scan.jpg",  "content": "<base64>" }]
    },
    {
      "formId": "employee_documents", "entity": "employee_documents",
      "action": "update", "id": "new",
      "formData": { "id": "new", "attachment": "cv_alice.pdf", "employee_id": "42" },
      "fileData": [{ "fileName": "cv_alice.pdf", "content": "<base64>" }]
    }
  ]
}
```

---

### Full JavaScript example

```js
async function uploadDocumentWithRecord(file, employeeId) {
    // 1. Base64-encode the file
    const reader = new FileReader();
    const base64Content = await new Promise((resolve, reject) => {
        reader.onload = e => resolve(e.target.result.split("base64,")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

    // 2. Build the request
    const request = {
        data: [
            {
                formId:   "employee_documents",
                entity:   "employee_documents",
                action:   "update",
                id:       "new",
                formData: {
                    id:          "new",
                    attachment:  file.name,
                    title:       file.name,
                    employee_id: employeeId,
                },
                fileData: [
                    { fileName: file.name, content: base64Content },
                ],
            },
        ],
    };

    // 3. Send the request
    const response = await fetch("/app/service?service.key=update.formData", {
        method:  "POST",
        headers: { "Content-Type": "application/json", AUTH_KEY: authKey },
        body:    JSON.stringify(request),
    });

    const result = await response.json();
    if (result.C_STATUS !== "SUCCESS") throw new Error(result.C_MESSAGE);

    const saved = result.C_DATA[0].formData;
    console.log("Saved record ID:", saved.id);
    return saved;
}
```

> **Note:** Large files should be chunked or uploaded via a dedicated object-storage endpoint. The `fileData` approach is intended for document-sized attachments (PDFs, images, BPMN files, etc.).

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

---

## Process API — Start and Advance Processes via `/bpm/service`

The BPM service lets external systems start process instances, complete user tasks, and update process variables programmatically. All calls go through the single proxy endpoint `/bpm/service?service.key=bpm.data`, which wraps the underlying Camunda REST API. The inner Camunda operation is described by `path`, `method`, and `data` in the request body.

> **Authentication:** Include `AUTH_KEY` header on every call, exactly as with the Data API.

---

### Start a Process Instance

**Request**

```
POST /bpm/service?service.key=start.process
Content-Type: application/json
AUTH_KEY: <AUTH_KEY from Login API>
```

```json
{
  "path": "/process-definition/key/leave-request/start",
  "method": "POST",
  "data": {
    "businessKey": "REC-001",
    "variables": {
      "requestor":   { "value": "jane.doe",      "type": "String"  },
      "leaveType":   { "value": "Annual",         "type": "String"  },
      "startDate":   { "value": "2026-08-10",     "type": "String"  },
      "days":        { "value": 5,                "type": "Double"  },
      "approved":    { "value": false,            "type": "Boolean" }
    }
  }
}
```

| Field | Description |
|---|---|
| `path` | Camunda REST path — replace `leave-request` with your **Process Definition Key** |
| `method` | Always `"POST"` for starting a process |
| `data.businessKey` | Your application's record ID that links the process instance back to your data |
| `data.variables` | Map of process variables — each entry is `{ "value": <val>, "type": <type> }` |

**Variable types**

| Form field type | Camunda type to use |
|---|---|
| Text, select, date, textarea, radio | `"String"` |
| Number | `"Double"` |
| Checkbox | `"Boolean"` |

**Response** — HTTP `200` on success. The process instance is created and moves to its first task.

---

### Complete a User Task

Once a process is running, advance it by completing the active user task.

```
POST /bpm/service?service.key=complete.task
Content-Type: application/json
AUTH_KEY: <AUTH_KEY from Login API>
```

```json
{
  "path": "/task/8f3a21bc-1234-5678-abcd-ef0123456789/complete",
  "method": "POST",
  "data": {
    "variables": {
      "approvalDecision": { "value": "Approved", "type": "String" },
      "approverComment":  { "value": "Looks good", "type": "String" }
    }
  }
}
```

| Field | Description |
|---|---|
| `path` | `/task/{task_id}/complete` — replace `{task_id}` with the Camunda task ID |
| `data.variables` | Updated process variables to set on completion (optional) |

**Response** — HTTP `200` on success. The process advances to the next step.

---

### Update a Single Process Variable

Update one variable on a running process instance without completing a task.

```
POST /bpm/service?service.key=bpm.data
Content-Type: application/json
AUTH_KEY: <AUTH_KEY from Login API>
```

```json
{
  "path": "/process-instance/5c9d12ef-abcd-0000-1111-222233334444/variables/approvalDecision",
  "method": "PUT",
  "data": {
    "value": "Escalated",
    "type": "String"
  }
}
```

| Field | Description |
|---|---|
| `path` | `/process-instance/{instance_id}/variables/{variableName}` |
| `method` | `"PUT"` for variable updates |
| `data.value` | New value for the variable |
| `data.type` | Camunda type string (see type table above) |

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
