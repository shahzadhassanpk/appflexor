---
name: Inbox CSS location
description: Where task inbox styles live and which files import them.
---

## Rule
Task inbox styles (left panel, right comment panel) are in:
`artifacts/appflexor/src/s2a-framework/modules/camunda/inbox-style.css`

Imported by:
- `camunda/cam7/InboxListView.jsx`
- `camunda/CommentBox/CommentBox.jsx`

All colours use CSS custom properties only (`--font-color`, `--text-muted`, `--border-color`, `--secondary-color`, `--primary-color`, `--button-primary-bg`). No hardcoded hex values.

**Why:** Keeps theme-aware styling centralised; the advance theme's light/dark body classes control all colours automatically.
