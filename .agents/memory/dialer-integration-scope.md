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
