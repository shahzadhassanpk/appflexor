(# WAAP Module — Business Overview)

This module implements the WAAP (Web/WhatsApp Assisted Agent Portal) features used by the page-builder/designer. It contains a lightweight chat/lead management UI and small admin forms used inside the page designer. The code focuses on frontend flows and the API contract used to persist WAAP data.

## Primary Business Capabilities
- Real-time lead/chat inbox (list leads, open conversation, send/receive messages)
- Mark messages as read and persist message metadata
- Update lead attributes: stage, assigned products, status (close), assigned agent/contact
- Edit agent/contact records used by the WAAP flows
- Launch related forms (sales form, page-form viewer) for lead-driven actions

## Key Frontend Components
- Chat.jsx: main container, lead list, socket integration, modals
- ChatBox.jsx / ChatTabs: message composer, message rendering, attachments
- MessageRenderer.jsx: message content + media references
- components/forms/EditAgent.jsx: contact/agent edit form
- components/forms/AssignProducts.jsx: assign products to a lead (multi-select)
- components/forms/AssignStage.jsx: set lead lifecycle stage
- components/CrudApiCall.jsx: shared API helper for reads/updates/deletes

## API Entities (used for update.formData requests)
- waap_lead — primary lead record (used for updates such as products, stage, close)
- waap_lead_msg — message-level entity (used for marking read, message actions)
- waap_contact — contact/agent entity (used for editing agent/contact details)

Examples: the module issues write requests to the backend using the update.formData contract. A typical single-update payload looks like:

```
POST ${API_URL}?service.key=update.formData
{
	"data": [
		{
			"formId": "waap_lead",
			"entity": "waap_lead",
			"action": "update",
			"id": "<record-id>",
			"formData": { /* fields to update */ }
		}
	]
}
```

Read operations use `multiKey.data` / `masterKey.tenantData` service keys and request one or more `dataKeys` (see CrudApiCall.getData).

## Real-time
- WebSocket: connects to wss://ws.step2agility.com using the `/chat/ws/socket.io/` path. The UI listens for `receiveMessage` events to refresh unread counts and conversations.

## Extensibility Notes
- The module uses `CrudApiCall` helpers — reuse them for new entities to keep request shapes consistent.
- Business lists (products, agents) are read via service keys (multiKey.data); when adding new dropdowns, map the same dataKey → UI value/title.
- When adding server-side actions that require chaining (create → link), follow the `request.data` array pattern and include IDs returned from the API.

## Where to look in code
- Main container: components/Chat.jsx
- API helper: components/CrudApiCall.jsx
- Forms: components/forms/*

---
Small, focused reference for maintainers and integrators. Update this file if new WAAP entities or serviceKeys are introduced.

## Seeding sample data (developer)

A small helper script is included at `scripts/seed-waap.js` that uses the MCP `update.formData` endpoint to create example records for development/testing.

Usage (from repo root):

```
AUTH_KEY=<auth_key> node scripts/seed-waap.js
```

Optional environment variables:
- `API_URL` — override the API base (defaults to `/app/service`)
- `AUTH_KEY` — set an auth key if your backend requires it in headers

The script will attempt to create a `waap_contact`, `waap_lead`, and one `waap_lead_msg` record and log the responses.

