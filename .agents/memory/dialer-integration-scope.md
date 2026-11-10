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
