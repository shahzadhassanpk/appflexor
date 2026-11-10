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
Available and Assigned must be tabs. Available has individual/all selection
checkboxes and a Claim action, not Call buttons; refresh both queues after
claiming. Bulk claiming must not open the dialer or call dialog.

**Why:** the user changed the Available workflow to select-and-claim, while
retaining calling from Assigned.

Save upserts a `dialer_log` record with only name, phone, status, comments and
business_key; it must not complete the task. Complete saves the log first, then
completes the task. Name and phone are read-only in the dialog.
Use task.id as the dialer_log request record id with saveOrUpdate set to "Yes",
not id "new".

**Why:** the user explicitly changed repeated saves to update one log per task
rather than create another log each time.

Save must also update the task's status and comments variables. For RECALL, save
the selected next-call date/time in the existing task due field through
`bpm.data` PUT `/task/{id}`. Do not create a recall variable or log field.
Display it using the existing due-date display in the task list. Display saved
comments beneath Assigned task details, and label incomplete Assigned tasks
Pending rather than Draft, as explicitly requested by the user.
Assigned tasks must show a Call control that opens the native dialer with `tel:`,
not only a navigation arrow.

The call dialog must offer a radio choice to auto-dial the next task only after
successful completion. Default to Manual, and still claim any Available task
before dialing it.

**Why:** the user requested an auto-dial-next-on-completion-success radio; Save
and failed completion must not start another call.

**Why:** the user requires claim-before-call to prevent two agents calling the
same lead, and explicitly confirmed `/app/service?service.key=update.formData`
for saving and `/bpm/service?service.key=complete.task` for completion. This
overrides the older choice to complete via `bpm.data`.

**How to apply:** retain the user's wrapper completion request (`path`, `method`,
`data.businessKey`, `data.variables.status.value`) even though Appflexor also has
a different Camunda 8 caller using the same service key. Never complete after a
failed save or open a call after a failed claim.

Treat persisted task values and their displayed queue values as one Save
requirement, not separate follow-up work. This includes status, comments and
the task due date, including after Refresh and a full page reload.

**Why:** the user reported that the queue still showed Unset after a status save,
and later reported No due date even though the due date had been set.

**How to apply:** verify the variable readback before reporting success, then
update the queue/detail state and filter counts without waiting for polling.
Confirm the refreshed queue still displays the server-confirmed values; a
temporary local cache update is not sufficient.
