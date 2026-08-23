# Process Monitor

This module replaces the operational parts of Camunda Cockpit with Camunda 7 REST calls routed through AppFlexor's authenticated BPM proxy. Axios automatically supplies the current `AUTH_KEY` and `USER_ORG`; the browser never stores separate Camunda credentials.

## Data flow

`ProcessMonitor.jsx` loads process definitions, active instances, tasks, historic instances, and jobs through `services/camundaApi.js`. Calls use `/bpm/service?service.key=bpm.data`, with tenant scope taken from `AppContext.tenantSubscription.tenant_id`. Instance variables and the activity tree are then loaded for drill-down.

## SLA contract

At process start, inject `slaConfig` (object or JSON string) and `slaDeadline` as variables. Supported threshold fields are `highMinutes` and `mediumMinutes`; snake-case aliases are accepted. Thresholds are displayed read-only. `utils/sla.js` recalculates urgency from the current time without modifying Camunda variables.

Example: `slaConfig = {"highMinutes":60,"mediumMinutes":240,"policy":"support-p1"}`.

## Extending

- Add REST resources in `services/camundaApi.js`; keep proxy/session handling centralized.
- Add alert or escalation subscribers after the `load()` result is assembled. Keep them opt-in and do not mutate SLA threshold variables.
- Add pagination by exposing `firstResult` and `maxResults` in the service methods.
- Add incident monitoring with `/incident`, then surface it beside job failures in `Dashboard.jsx`.
- Add auto-refresh with an interval around `load()` and always clear it during component unmount.

