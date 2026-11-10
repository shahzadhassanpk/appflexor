# Appflexor Dialer PWA — proof of concept

Separate mobile-first React web app, registered at `/dialer/`. It uses the existing
Appflexor CRM deployment (`https://crm.step2agility.com`), not a local task database.
No example leads, passwords or accounts are seeded.

## CRM proxy

Vite proxies `/dialer/app/service` and `/dialer/bpm/service` to
`https://crm.step2agility.com/app/service` and
`https://crm.step2agility.com/bpm/service`, preserving query strings.
These development proxy paths are scoped to the Dialer, so the main Appflexor
artifact is unaffected.

The browser calls these service URLs directly using `fetch`, with the same
`AUTH_KEY` header and JSON request pattern as Appflexor. There are no
`/api/dialer/*` endpoints and no Dialer API server. All transformation, task
mapping, and session handling happens in the React app.

Both `server.proxy` and `preview.proxy` are configured. **Static hosting does
not run Vite's proxy.** The registered production service currently serves static
files, so a published deployment needs matching web reverse-proxy routes for
these two service paths before live API calls will work. No business-logic API
server is needed; do not reintroduce one for the Dialer.

## API contracts reused from Appflexor

The browser sends the following operations through Vite's CRM proxy:

- Login: `POST /app/service?service.key=login`, `{username,password}`.
  The canonical username is read using `masterKey.tenantData` / `sys.user.profile`.
- Assigned tasks: `POST /bpm/service?service.key=bpm.data`,
  `{method:"GET",path:"/task?assignee=<username>",data:{}}`.
- Available tasks: same service,
  `{method:"GET",path:"/task?candidateGroup=DIALER_APP&unassigned=true",data:{}}`.
- Lead variables: same service, `GET /task/{id}/variables?deserializeValues=false`.
- Claim: `bpm.data`, `{method:"POST",path:"/task/{id}/claim",data:{userId:"<username>"}}`.
- Save: `POST /app/service?service.key=update.formData`. Upsert a `dialer_log`
  entry (`id:task.id`, `action:"update"`, `mode:"formData"`, `saveOrUpdate:"Yes"`)
  contains only name, phone, status, comments and business_key in its formData.
  After saving the record, `bpm.data` POST `/task/{id}/variables` sets
  `{modifications:{status:{value:"HOT",type:"String"},comments:{value:"...",type:"String"}}}`
  without completing. Both variables are read back before success is reported.
  A failed variable update is reported explicitly; an unchanged retry reuses the
  confirmed log and retries the variable update.
- Completion: save first, then `POST /bpm/service?service.key=complete.task`,
  `{method:"POST",path:"/task/{id}/complete",data:{businessKey:"...",variables:{status:{value:"HOT"}}}}`.
- Logout: `POST /app/service?service.key=logout`.

The user explicitly confirmed `update.formData` and `complete.task` for this flow.
The business key comes from business_key/businessKey variables, falling back to
the process instance businessKey. Missing keys block saving rather than creating
an unlinked log. An identical confirmed save is reused for completion retries
while this app instance remains open. The stable task ID is sent on every
changed save and after reloads, so CRM upserts target the same record instead of
inserting a new log for each save.

## Lead tasks

The **Assigned** list shows the signed-in user's tasks, including claimed tasks
without a phone number. The separate **Available** list shows unassigned tasks in the
`DIALER_APP` candidate group, including tasks without a recognized phone variable.
If variable enrichment fails, the basic available card remains visible with an
explicit details warning. Available and Assigned are separate tabs (Available
opens by default). Available has individual selection checkboxes, Select all,
and Claim selected; it has no Call buttons. Bulk claims use up to five concurrent
atomic Camunda claim requests, report partial failures, and refresh both lists
afterward. Claiming never opens the dialog or dialer. Select all covers the loaded
batch, not unreturned upstream tasks. Call claimed tasks from Assigned.
Closing the dialog leaves the task assigned, accessible from Assigned.
Save leaves it assigned; Complete saves first and only then completes.
The call dialog has Manual / Auto-dial next radios (Manual by default). With
auto-dial enabled, only confirmed completion starts the next call: prefer the
next assigned task with a dialable number, otherwise claim an available one
before dialing. Save, failed completion, no dialable tasks, claim conflicts and
offline errors never start another call. The preference lasts for the current
queue session. Browsers may block automatic `tel:` navigation after an API
request; the next task's dialog retains a direct Dial again link.
Assigned cards show Pending until completed and display the saved comments below
the task details, including after a refresh.
For this POC, each queue scans the first 100 returned tasks and indicates when
more exist. Both lists refresh periodically, on focus, and with their refresh
buttons.

Recognized variable aliases (case-insensitive):

| Field | Aliases, in priority order |
| --- | --- |
| Lead name | `lead_name`, `leadName`, `customer_name`, `customerName`, `full_name`, `fullName`, `name` |
| Phone | `phone_number`, `phoneNumber`, `phone`, `mobile_number`, `mobileNumber`, `mobile`, `contact_number`, `contactNumber` |
| Status | `status`, `lead_status`, `leadStatus`, `call_status`, `callStatus` |
| Comments | `comments`, `comment`, `call_comments`, `callComments`, `notes` |
| Due date | Engine task `due`, then `due_date`, `dueDate`, `due` |

Only HOT, RECALL,
REJECTION are accepted. The client rechecks ownership immediately before completing;
Appflexor remains responsible for enforcing access permissions on every request.
Dialing opens a sanitized `tel:` link; the browser cannot observe whether a call
was placed, answered or ended. Completion is always a separate explicit action.

## Sessions and installation

- The Appflexor login API returns an `AUTH_KEY`. As a direct browser client,
  the app must hold this token in JavaScript. It is kept in this app's
  `sessionStorage` (not shared with Appflexor's local storage), so reloads in the
  same tab keep the session. Passwords are never stored.
- Sign-out clears the token, task cache and drafts, even if CRM logout fails.
  An expired-session response returns the user to sign-in.
- This architecture cannot use server-only HttpOnly token storage. Protect the
  browser from untrusted scripts, and use HTTPS. Appflexor controls token expiry.
- Publish over HTTPS and open `/dialer/` directly on a phone to install.
  Android/Chrome: Install app (or browser menu). iOS/Safari: Share → Add to Home Screen.
- Production builds register a service worker scoped only to `/dialer/`.
  Development/HMR is deliberately not cached.
- Only static app shell/assets are cached. API responses and lead data are never
  put into service-worker caches. Offline completion is blocked, never queued.
- In-progress call notes are session-local browser drafts; signing out removes
  them. No offline task database or automatic call tracking is provided.

## Checks

- `pnpm --filter @workspace/dialer-pwa run typecheck`
- `node --test artifacts/dialer-pwa/tests/available-tasks.test.mjs`
- `PORT=23226 BASE_PATH=/dialer/ pnpm --filter @workspace/dialer-pwa run build`
- For browser checks, intercept the two CRM service paths with synthetic
  responses; do not complete live CRM tasks or use real credentials.
