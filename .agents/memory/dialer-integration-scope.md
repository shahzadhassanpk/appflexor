---
name: Dialer integration scope
description: Product constraints for the standalone Dialer PWA proof of concept.
---

The Dialer is a separate React PWA proof of concept, with Appflexor as the source
of truth for authentication, lead dialing tasks, and task completion. Do not
replace these with separate local accounts, seeded leads, or a new task database.

**Why:** the user explicitly requested a new ReactJS PWA artifact using
Appflexor's login, bpm.data task-list and task-completion APIs.

**How to apply:** keep future Dialer work connected to the existing Appflexor
workflow unless the user explicitly changes that product scope.

The Dialer must not use an internal API server. Use browser-side Appflexor API
calls through the same Vite proxy pattern as Appflexor, targeting
`https://crm.step2agility.com` for `/app/service` and `/bpm/service`.

**Why:** the user explicitly instructed that the Dialer should have no internal
API server and should use a similar proxy pattern to Appflexor.

**How to apply:** keep API operations in the Dialer browser client; do not
reintroduce shared `/api/dialer` routes. Scope proxy URLs beneath the Dialer's
preview path so they cannot be handled by the main Appflexor artifact.

Agents must claim an Available task before opening its call dialog or dialing.
Save creates a `dialer_log` record with only name, phone, status, comments and
business_key; it must not complete the task. Complete saves the log first, then
completes the task. Name and phone are read-only in the dialog.

**Why:** the user requires claim-before-call to prevent two agents calling the
same lead, and explicitly confirmed `/app/service?service.key=update.formData`
for saving and `/bpm/service?service.key=complete.task` for completion. This
overrides the older choice to complete via `bpm.data`.

**How to apply:** retain the user's wrapper completion request (`path`, `method`,
`data.businessKey`, `data.variables.status.value`) even though Appflexor also has
a different Camunda 8 caller using the same service key. Never complete after a
failed save or open a call after a failed claim.
