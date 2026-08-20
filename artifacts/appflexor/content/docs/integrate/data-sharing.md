# Data Sharing Services

## Purpose

Use **Data Sharing Services** to design reusable forms, manage persistent data lists, and configure SQL-based APIs. This module gives business teams a shared way to capture, store, browse, and expose operational data for use in Appflexor processes and connected systems.

---

## Available Areas

| Area | Use it for |
|---|---|
| **Form Builder** | Creating reusable data-entry forms, including fields, pages, and submission behavior. |
| **Datalist Builder** | Designing searchable lists and detail views for persisted business records. |
| **SQL APIs** | Configuring data APIs that run approved SQL operations against configured data sources. |
| **DB Explorer** | Exploring available database schemas and data structures. |
| **Data Sources** | Registering JDBC data connections that support shared data and API access. |

---

## Create a Form

1. Open **Integrate → Data Sharing Services**.
2. Select the **Form Builder** tab.
3. Create a form and give it a clear business name.
4. Add the fields and pages required to capture the information.
5. Save the form, then test it with representative data before publishing it for users or processes.

Use forms when a person needs to enter or review structured information as part of a business process.

---

## Build a Data List

1. Select the **Datalist Builder** tab.
2. Choose the data source or records that the list will display.
3. Configure the columns, search options, filters, and detail presentation.
4. Save the list and confirm that users see only the records they are authorized to access.

Data lists provide a consistent way to browse operational data without requiring users to query a database directly.

---

## Configure a SQL API

1. Select the **SQL APIs** tab.
2. Choose the data source that the API will use.
3. Define the approved SQL operation and its expected inputs.
4. Name the API clearly so processes and external consumers can identify it.
5. Test the API with safe sample data, then save it.

> **Security note:** Keep SQL APIs narrowly scoped. Give callers only the inputs and data they need, and do not expose unrestricted database access through a shared API.

---

## Manage Data Sources

1. Select the **Data Sources** tab.
2. Add or edit the JDBC connection details for the required data store.
3. Verify the connection before using it in forms, lists, or SQL APIs.
4. Use **DB Explorer** to inspect the available schema when configuring shared data services.

---

## Best Practices

- Use business-friendly names for forms, lists, data sources, and APIs.
- Reuse a data source rather than creating duplicate connections for the same system.
- Design data lists around the decisions users need to make, not around raw database tables.
- Test forms and APIs with the same roles that will use them in production.