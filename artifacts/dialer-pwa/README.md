# Appflexor Dialer PWA — proof of concept

Separate mobile-first React web app, registered at `/dialer/`. It uses the existing
Appflexor deployment (`https://demo.appflexor.com`), not a local task database.
No example leads, passwords or accounts are seeded.

## API contracts reused from Appflexor

The shared API server exposes `/api/dialer/*` and forwards only the supported
operations to Appflexor:

- Login: `POST /app/service?service.key=login`, `{username,password}`.
  The canonical username is read using `masterKey.tenantData` / `sys.user.profile`.
- Assigned active tasks: `POST /bpm/service?service.key=bpm.data`,
  `{method:"GET",path:"/task?assignee=...&active=true&..."}`.
- Lead variables: same service, `GET /task/{id}/variables?deserializeValues=false`.
- Completion: same service, `POST /task/{id}/complete`,
  `{variables:{status:{value:"HOT",type:"String"},comments:{value:"...",type:"String"}}}`.
  Existing matching status/comment variable names are preserved.
- Logout: `POST /app/service?service.key=logout`.

The Camunda 7 `bpm.data` completion contract is intentional: it matches
Appflexor's active `StepProcessor7`, rather than the separate Camunda 8
`complete.task` service.

## Lead tasks

The signed-in user's **assigned active tasks** with a usable phone variable are
shown. Optionally enter a BPMN task definition key at sign-in to restrict to a
specific dialing step. Unassigned/candidate tasks are not automatically claimed.
For this POC, the queue scans the first 100 assigned tasks and indicates when more
exist; completing tasks and refreshing advances the active queue.

Recognized variable aliases (case-insensitive):

| Field | Aliases, in priority order |
| --- | --- |
| Lead name | `lead_name`, `leadName`, `customer_name`, `customerName`, `full_name`, `fullName`, `name` |
| Phone | `phone_number`, `phoneNumber`, `phone`, `mobile_number`, `mobileNumber`, `mobile`, `contact_number`, `contactNumber` |
| Status | `status`, `lead_status`, `leadStatus`, `call_status`, `callStatus` |
| Comments | `comments`, `comment`, `call_comments`, `callComments`, `notes` |
| Due date | Engine task `due`, then `due_date`, `dueDate`, `due` |

For a new status/comment variable, use `status` / `comments`. Only HOT, RECALL,
REJECTION are accepted. The API rechecks ownership immediately before completing.
Dialing opens a sanitized `tel:` link; the browser cannot observe whether a call
was placed, answered or ended. Completion is always a separate explicit action.

## Sessions and installation

- Appflexor tokens remain server-side. The browser receives only an opaque
  HttpOnly, SameSite=Strict session cookie, valid for eight hours.
- Sessions are **in memory for this POC**. Restarting/scaling the API server
  requires users to sign in again. Use a shared durable session store before
  multi-instance production use.
- A secure first-party browser context is required for sign-in; use the app in
  its own tab if your browser blocks cookies inside the preview iframe.
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
- `pnpm --filter @workspace/api-server run typecheck`
- `scripts/node_modules/.bin/tsx --test artifacts/api-server/tests/dialer.test.ts`
  (mocks only the external Appflexor boundary; never changes live tasks)
