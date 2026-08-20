# User Experience

## Purpose

Use **User Experience** to configure dynamic menus and pages that present tasks, data, charts, and reports to authorized audiences. Each Appflexor site is an independently configurable channel with its own pages, navigation, visual style, and access rules. A single tenant can run multiple experiences, such as an employee self-service portal, customer-facing application, or operations dashboard.

---

## Key Concepts

| Term | Description |
|---|---|
| **Site (Channel)** | A named web application or portal served by Appflexor. Each site has a unique code and can be independently styled and secured. |
| **Page** | A routable screen within a site, built by composing components in the Page Designer. |
| **Style** | A custom CSS theme applied to a site or individual pages to control colours, fonts, and layout. |
| **Authorization** | Rules that control which users or groups can view specific pages or sections of a site. |
| **Page Designer** | The drag-and-drop canvas used to compose pages from registered UI components. |
| **Component Registry** | The catalogue of available UI building blocks (forms, data lists, process viewers, HTML panels, etc.) that can be placed on a page. |
| **Site Tab** | A navigation entry within a site that links to a page or external URL, forming the site's menu structure. |
| **SSO / Integration** | Single Sign-On configuration and third-party service integrations set per site. |

---

## Step-by-Step Usage

### Managing Sites

#### Create a Site

1. Navigate to **Administrate Websites → Sites**.
2. Click **Add New** (or drag to reorder existing sites).
3. Fill in:
   - **Site Name** — the display name (e.g., `Employee Portal`).
   - **Code** — a short unique identifier (e.g., `emp-portal`).
   - **Description** *(optional)*.
   - **Logo / Favicon** — upload brand assets.
   - **Default Language** — set the locale for the site.
4. Configure optional settings:
   - **SSO** — enable and configure Single Sign-On for this site.
   - **Integrations** — link third-party services.
   - **Footer / Login** settings.
5. Click **Save**.

#### Edit or Delete a Site

- Click **Edit** on any site to update its settings.
- Click **Delete** to remove a site. This also removes its pages and navigation. This action is irreversible — export a backup before deleting.

---

### Managing Pages

#### Create a Page

1. Go to **Administrate Websites → Pages**.
2. Select the **Site** you are adding a page to.
3. Click **Add New**.
4. Enter:
   - **Page Title** — shown in the browser tab and navigation.
   - **Route / Slug** — the URL path (e.g., `/leave-requests`).
   - **Access** — public or restricted to specific groups (see Authorization).
5. Click **Save** — the page opens in the **Page Designer**.

#### Design a Page

1. In the Page Designer canvas, drag components from the left panel:
   - **Form** — embed a data-entry form by Form Key.
   - **Data List** — display a list, table, gallery, or grouped view from a data source.
   - **Process Viewer** — show available processes for a selected category.
   - **HTML / Dashboard** — insert rich text, embeds, or a metrics dashboard.
   - **Drop Box** — file upload and document management widget.
2. Click any placed component to configure its properties (data source, form key, mode, filters, conditions).
3. Rearrange components by dragging.
4. Click **Save** to persist the layout.

#### Preview a Page

Click **Preview** in the Page Designer toolbar to see a live render of the page exactly as users will see it, without navigating away from the designer.

---

### Managing Styles

#### Apply a Custom Style

1. Go to **Administrate Websites → Styles**.
2. Click **Add New** or select an existing style.
3. Write or paste custom CSS in the editor.
4. Assign the style to a **Site** or **Page** using the selector.
5. Click **Save** — styles are applied live.

#### Use CSS Variables

Appflexor's theme system exposes CSS custom properties (`--primary-color`, `--font-color`, `--border-color`, etc.). Reference these in your custom styles to ensure they adapt correctly to light/dark mode without hard-coding colour values.

---

### Managing Authorization

#### Restrict Page Access

1. Go to **Administrate Websites → Authorization**.
2. Select the **Site** and **Page** to secure.
3. Add the **Groups** that are permitted to view the page.
4. Click **Save** — users not in the listed groups will see an "Unauthorised" message when they attempt to navigate to that page.

#### Public vs. Restricted Pages

- **Public** — accessible to all logged-in users of the site (or unauthenticated users if the site supports it).
- **Restricted** — only users belonging to the listed Groups can access the page.

---

## Best Practices

- **One site per audience.** Create separate sites for employees, customers, and administrators rather than trying to serve all users from one site with complex authorization logic.
- **Use Groups for page authorization, not individual users.** Maintaining access for individual users is error-prone at scale.
- **Use CSS variables in custom styles.** Hard-coded hex colours will break if the site theme is changed. Always use theme variables.
- **Keep page routes meaningful.** Choose slugs that reflect the page purpose (`/leave-requests` not `/page-014`) — users may bookmark these URLs.
- **Preview before going live.** Always preview pages in the designer after layout changes to catch component configuration errors before users encounter them.
- **Plan your navigation hierarchy first.** Sketch out the site map (pages, tabs, routes) before building — restructuring navigation after launch confuses users with bookmarked URLs.
- **Limit the number of components per page.** Pages with many data-heavy components load slowly. Split content across multiple focused pages and link between them.
