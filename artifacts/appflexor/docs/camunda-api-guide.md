# Camunda 7 API Client Guide

This service proxies selected requests from an application client to the configured Camunda 7 REST engine. Clients call the application service; they do not call Camunda directly and must not send Camunda administrator credentials.

## Endpoint

```text
POST https://{application-host}/{context-path}/camunda/service?service.key={service-key}
Content-Type: application/json
AUTH_KEY: {application-auth-key}
```

`/bpm/service` is an alias for `/camunda/service`.

Authentication is performed by the application. Depending on deployment and operation, the client must provide either a valid application session or an `AUTH_KEY`. Do not place the Camunda username or password in the request body.

## Request envelope

The JSON body describes the Camunda REST request:

```json
{
  "method": "POST",
  "path": "/task/a-task-id/complete",
  "data": {}
}
```

| Field | Required | Description |
| --- | --- | --- |
| `method` | Yes | Camunda HTTP method. Use uppercase `GET`, `POST`, or `PUT`. |
| `path` | Yes | Path relative to Camunda's `/engine-rest` base URL. Query parameters may be included. |
| `data` | For `POST`/`PUT` | JSON body forwarded to Camunda. It is ignored for `GET`. |

The proxy supplies `Content-Type: application/json`, `Accept: application/json`, and Camunda Basic authentication.

## Response envelope

Successful Camunda response:

```json
{
  "status": "SUCCESS",
  "data": {}
}
```

Camunda or proxy error:

```json
{
  "status": "ERROR",
  "message": "No matching process definition with key: invoice",
  "data": {
    "type": "RestException",
    "message": "No matching process definition with key: invoice"
  }
}
```

Always use the JSON `status` field to determine the result. The servlet may still return HTTP 200 when Camunda returned an error. On failure, display or log the top-level `message`; `data` contains the original Camunda response when one was available.

When Camunda responds with an API error, the proxy preserves Camunda's error message. When the process engine cannot be reached because of a network, DNS, timeout, or TLS connection failure, the proxy returns the client-safe message `Unable to connect process engine, please try later.` instead of exposing the underlying connection details.

## Start a process instance

Service key: `start.process`

The service derives the tenant from the application host/database. It rewrites a path ending in `/start` from:

```text
/process-definition/key/{process-definition-key}/start
```

to:

```text
/process-definition/key/{process-definition-key}/tenant-id/{derived-tenant-id}/start
```

Request:

```http
POST /app-service/camunda/service?service.key=start.process HTTP/1.1
Host: tenant.example.com
AUTH_KEY: <application-auth-key>
Content-Type: application/json

{
  "method": "POST",
  "path": "/process-definition/key/invoice/start",
  "data": {
    "businessKey": "INV-2026-00125",
    "variables": {
      "amount": { "value": 1250.50, "type": "Double" },
      "customerId": { "value": "CUST-42", "type": "String" },
      "approved": { "value": false, "type": "Boolean" }
    }
  }
}
```

Success response:

```json
{
  "status": "SUCCESS",
  "data": {
    "id": "4f7c0ac1-6078-11ef-9953-0242ac120002",
    "definitionId": "invoice:12:3da8d936-6078-11ef-9953-0242ac120002",
    "businessKey": "INV-2026-00125",
    "caseInstanceId": null,
    "ended": false,
    "suspended": false
  }
}
```

The proxy removes Camunda's `links` and `tenantId` fields from this response.

## Complete a user task

Service key: `complete.task`

Request:

```http
POST /app-service/camunda/service?service.key=complete.task HTTP/1.1
Host: tenant.example.com
AUTH_KEY: <application-auth-key>
Content-Type: application/json

{
  "method": "POST",
  "path": "/task/7b57bb5d-6078-11ef-9953-0242ac120002/complete",
  "data": {
    "variables": {
      "approved": { "value": true, "type": "Boolean" },
      "comments": { "value": "Approved by finance", "type": "String" }
    },
    "withVariablesInReturn": true
  }
}
```

Success response when `withVariablesInReturn` is enabled:

```json
{
  "status": "SUCCESS",
  "data": {
    "approved": { "value": true, "type": "Boolean", "valueInfo": {} },
    "comments": { "value": "Approved by finance", "type": "String", "valueInfo": {} }
  }
}
```

Use `withVariablesInReturn: true` so Camunda returns a JSON body. The current proxy parses every upstream response as JSON; a Camunda `204 No Content` response can therefore be reported as a parsing error.

## Correlate a message event

Service key: `send.message`

Request:

```http
POST /app-service/camunda/service?service.key=send.message HTTP/1.1
Host: tenant.example.com
AUTH_KEY: <application-auth-key>
Content-Type: application/json

{
  "method": "POST",
  "path": "/message",
  "data": {
    "messageName": "paymentReceived",
    "businessKey": "INV-2026-00125",
    "processVariables": {
      "paymentReference": { "value": "PAY-88421", "type": "String" },
      "paidAmount": { "value": 1250.50, "type": "Double" }
    },
    "resultEnabled": true,
    "variablesInResultEnabled": true
  }
}
```

Success response:

```json
{
  "status": "SUCCESS",
  "data": [
    {
      "resultType": "Execution",
      "execution": {
        "id": "e176fd50-6078-11ef-9953-0242ac120002",
        "processInstanceId": "4f7c0ac1-6078-11ef-9953-0242ac120002",
        "ended": false,
        "tenantId": "tenant_a"
      },
      "variables": {
        "paymentReference": {
          "value": "PAY-88421",
          "type": "String",
          "valueInfo": {}
        }
      }
    }
  ]
}
```

Use `resultEnabled: true` so Camunda returns a JSON response instead of `204 No Content`.

## Read Camunda BPM data

Service key: `bpm.data`

`bpm.data` is the generic read/proxy operation. Put filters in the `path` query string. The examples below use Camunda 7 REST paths.

### Find tasks for a process instance

Request:

```json
{
  "method": "GET",
  "path": "/task?processInstanceId=4f7c0ac1-6078-11ef-9953-0242ac120002"
}
```

Success response:

```json
{
  "status": "SUCCESS",
  "data": [
    {
      "id": "7b57bb5d-6078-11ef-9953-0242ac120002",
      "name": "Approve invoice",
      "assignee": "finance.user",
      "created": "2026-08-22T10:15:30.000+0500",
      "processInstanceId": "4f7c0ac1-6078-11ef-9953-0242ac120002",
      "taskDefinitionKey": "approveInvoice"
    }
  ]
}
```

### Read process variables

Request:

```json
{
  "method": "GET",
  "path": "/process-instance/4f7c0ac1-6078-11ef-9953-0242ac120002/variables"
}
```

Success response:

```json
{
  "status": "SUCCESS",
  "data": {
    "amount": { "value": 1250.50, "type": "Double", "valueInfo": {} },
    "approved": { "value": false, "type": "Boolean", "valueInfo": {} }
  }
}
```

## Error examples

Task does not exist or is already completed:

```json
{
  "status": "ERROR",
  "message": "Cannot complete task 7b57bb5d-6078-11ef-9953-0242ac120002: Cannot find task with id 7b57bb5d-6078-11ef-9953-0242ac120002",
  "data": {
    "type": "InvalidRequestException",
    "message": "Cannot complete task 7b57bb5d-6078-11ef-9953-0242ac120002: Cannot find task with id 7b57bb5d-6078-11ef-9953-0242ac120002"
  }
}
```

Message cannot be correlated:

```json
{
  "status": "ERROR",
  "message": "Cannot correlate message 'paymentReceived': No process definition or execution matches the parameters",
  "data": {
    "type": "MismatchingMessageCorrelationException",
    "message": "Cannot correlate message 'paymentReceived': No process definition or execution matches the parameters"
  }
}
```

Proxy/network failure:

```json
{
  "status": "ERROR",
  "message": "Unable to connect process engine, please try later."
}
```

Clients may show this message to the user and offer a retry. Do not interpret it as a process validation or business-rule failure; the request may not have reached the process engine.

## Client implementation checklist

- Send requests to the application service, never directly to the configured Camunda engine.
- Send `Content-Type: application/json` and the application's authentication/session information.
- Treat only `status === "SUCCESS"` as success.
- On `ERROR`, retain both `message` and `data` in diagnostics.
- For `Unable to connect process engine, please try later.`, allow the user to retry using the application's normal retry policy.
- Use Camunda typed-variable objects such as `{ "value": true, "type": "Boolean" }`.
- URL-encode values embedded in the `path` query string.
- Request a JSON result for commands that otherwise return `204 No Content`.
- Do not allow untrusted end users to construct arbitrary `path` values; `bpm.data` is a generic Camunda proxy.

## Implementation notes

This guide reflects `CamundaService` and `CamundaAPI` behavior in this repository. The proxy supports plain HTTP and HTTPS Camunda engine URLs. `start.process` performs tenant path rewriting; `complete.task`, `send.message`, and `bpm.data` forward the supplied relative path without modification.
