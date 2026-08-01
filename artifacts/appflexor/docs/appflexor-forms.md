# Capture and Process Data Using Forms — User Guide

This user guide explains how to use Appflexor's low-code form tools to collect information, publish forms to users, and trigger business processes — without writing code.

Who this is for
- Product owners, business users, and admins who need to collect data and run processes using low-code tools.

Quick overview
- Design forms visually in the Data Management (Forms) tool.
- Publish a form and share it (link or embed) to capture submissions.
- Map the form to a process or automations so submissions start the right work.

1) Open the Control Panel (start here)
- In the app open the Control Panel and use the Administrate or Capture quick actions to reach the Forms or Data Management area.
- The Control Panel gives one-click access to the form guidelines and the Data Management screens you will use.

2) Create a form (low-code steps)
- Open Data Management → Forms (or "Forms, Datalist, SQL APIs").
- Click "New Form".
- Give the form a name and short description so people know what it's for.
- Add fields by choosing a field type (Text, Email, Number, Date, Dropdown, Checkbox, File Upload, etc.).
- For each field set a label, placeholder, help text and whether the field is required.
- Use simple drag-and-drop to reorder fields and group them into sections.

3) Set validation and user-friendly labels
- Mark required fields so users cannot submit incomplete forms.
- Set field-specific validation (for example: email format, numeric ranges, max length).
- Add inline help text so users understand what to enter.

4) Preview and test
- Use the Preview feature to see how the form looks on desktop and mobile.
- Submit a test entry to verify validation, messages and the data captured.

5) Publish and share
- When ready, publish the form.
- Share via a public link, an embeddable snippet, or restrict access to authenticated users (depending on your needs).
- Choose whether form responses are open to anyone or limited to signed-in users.

6) Capture and process submissions (no-code wiring)
- In the form's settings choose how submissions should be handled:
  - Save only: Responses are saved to the platform data store for later review.
  - Start a process: Configure the form to automatically start a workflow (e.g., a ticket, approval, onboarding) when a submission arrives.
  - Send notifications: Send email or in-app alerts to users or teams when new responses arrive.
- To start a process, pick the process from a dropdown and map form fields to process fields using a simple mapping UI.

7) View and manage responses
- Open Data Management → Data Lists or the Responses view for your form to see submissions.
- Filter, sort, export (CSV) or open individual records to take action.

8) Common tasks and examples
- Customer Support Form: required fields — name, email, subject, message. Set to start 'Support Ticket' process and assign to support queue.
- New Vendor Request: include document upload, required approvals. Start 'Vendor Onboarding' workflow on submit.

9) Best practices for non-developers
- Keep forms short — ask only for necessary fields.
- Use clear labels and example text to reduce mistakes.
- Mark required fields clearly and provide helpful error messages.
- Test the full flow: submit a test, confirm a process started, and verify notifications.
- Document field meanings and owners for each form so teams know who processes responses.

10) Permissions and security
- Only admins or users with the Data Management role should create, edit, or publish forms.
- Use authentication settings to restrict who can submit sensitive forms.

11) Troubleshooting (quick fixes)
- Problem: submissions are not starting workflows — Check the form's processing settings and field mappings.
- Problem: users report validation errors — Re-run Preview and inspect field rules and help text.
- Problem: missing responses — Verify the form's access mode (public vs authenticated) and check activity logs.

12) Next steps (if you need help)
- Add a notification to your form so the right team sees submissions immediately.
- Want me to add a quick-access link inside the Control Panel to open the Form Designer? I can update the Control Panel for you.

Quick reference — Steps at a glance
- Control Panel → Administrate → Forms
- New Form → Add Fields → Set Validation → Preview
- Publish → Share Link or Embed → Configure Processing (Save, Notify, Start Process)
- Monitor Responses → Export or Open Record

This guide helps business users and admins create low-code forms and connect them to automated processes without writing code. If you'd like, I can add screenshots or a short walkthrough video next.
