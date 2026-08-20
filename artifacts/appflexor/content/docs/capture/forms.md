# Data Intake using Web Forms

## Purpose

Use Appflexor Forms to take structured information through web forms and trigger relevant business processes. The low-code form builder lets you design, publish, and embed data-capture screens in standalone pages, process steps, or content pages. Forms can validate input and feed results directly into your business processes or data lists.

---

## Key Concepts

| Term | Description |
|---|---|
| **Form** | A named, versioned data-capture definition with fields, layout, and submit behaviour. Identified by a unique **Form Key**. |
| **Form Key** | The technical identifier used to embed or reference a form across processes, pages, and APIs. |
| **Field** | A single input element on a form (text box, dropdown, file upload, signature, etc.). |
| **Field Mode** | Controls how a field renders: `render` (editable), `readonly` (display only), or `design` (builder canvas). |
| **SubForm** | An embedded child form inside a parent form, used for repeating data groups (e.g., line items). |
| **Custom Action** | A button on a submitted/saved form that triggers a downstream process or API call. |
| **Preview** | A live render of the form as it will appear to end users, without saving. |

---

## Field Types Available

- **Text** — single-line free text
- **Text Area** — multi-line free text
- **Number / Currency** — numeric inputs with formatting
- **Date / Date-Time / Date Range** — calendar pickers
- **Select / Multi-Select** — dropdowns driven by a data list or static options
- **Checkbox / Radio** — boolean and single-choice inputs
- **Auto Increment** — system-generated sequential values
- **Hidden Field** — carries values invisibly between steps
- **HTML** — free rich-text / HTML block for instructions or headings
- **Image Upload / View** — file picker scoped to images
- **File Upload** — general-purpose document attachment
- **Signature** — touch/mouse drawn signature capture
- **Carousel** — image slider display component
- **Tag List** — free-text multi-value tag input
- **SubForm** — nested repeating form group

---

## Step-by-Step Usage

### 1 — Open the Form Builder

1. Navigate to **Administrate → Forms & Data**.
2. Click the **Forms** tab.
3. The form list shows all forms in your tenant with their name, key, and last-modified date.

### 2 — Create a New Form

1. Click **Add New**.
2. Enter a **Form Name** and optionally a **Form Key** (auto-generated if left blank).
3. Click **Save** — the form opens in the designer canvas.

### 3 — Design the Form Layout

1. Drag field types from the left panel onto the canvas.
2. Click any field to open its **Properties** panel on the right:
   - Set the **Label**, **Placeholder**, and **Help Text**.
   - Mark the field as **Required**, **Read-Only**, or **Hidden**.
   - For Select/Multi-Select, choose a **Data List** as the option source or type static options.
3. Re-order fields by dragging the handle icon.
4. Use the **HTML** field to insert section headings or instructional text between inputs.

### 4 — Configure SubForms (Repeating Sections)

1. Add a **SubForm** field.
2. In its properties, select or create the child form to embed.
3. Users will be able to add, edit, and remove rows of child data within the parent form.

### 5 — Preview the Form

1. Click **Preview** in the designer toolbar.
2. The form renders exactly as end users will see it.
3. Close the preview to return to design mode.

### 6 — Add Custom Actions

1. Click **Custom Actions** in the form toolbar.
2. Click **Add Action** and configure:
   - **Label** — the button text shown to the user.
   - **Action Type** — trigger a process, call an API, or navigate to a page.
   - **Confirmation Message** — optional prompt before execution.
3. Actions appear as buttons on the rendered form after submission.

### 7 — Save and Publish

1. Click **Save** to persist the form definition.
2. The form is immediately available for embedding in pages or process steps using its **Form Key**.

### 8 — Edit an Existing Form

1. Find the form in the list and click the **Edit** (pencil) icon.
2. Make changes in the designer and click **Save**.

### 9 — Delete a Form

1. Find the form and click the **Delete** (trash) icon.
2. Confirm the deletion. **Note:** deleting a form that is referenced by a live process or page will break those references — check usages first.

---

## Best Practices

- **Use descriptive Form Keys.** Choose a key like `leave_application` rather than an auto-generated ID — this makes embedding and debugging easier.
- **Keep forms focused.** Split long forms into multiple process steps rather than putting everything on one screen.
- **Use Data Lists for dropdowns.** Avoid hard-coding options — link Select fields to a Data List so options can be updated without touching the form definition.
- **Mark required fields explicitly.** Don't rely on instructions; use the Required flag so validation is enforced automatically.
- **Use Hidden Fields for system values.** Pass context (e.g., current user ID, record key) invisibly through hidden fields rather than asking users to type them.
- **Test in Preview before publishing.** Always preview a form after layout changes to catch label or validation issues early.
- **Version control via process steps.** When a form is used in a workflow, changes to the form affect all active process instances — coordinate changes with process owners.
