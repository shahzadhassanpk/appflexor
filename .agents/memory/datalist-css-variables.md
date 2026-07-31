---
name: Datalist viewer CSS variables
description: How CSS variables work in appflexor — advance theme tokens vs locally defined --dl-* tokens in view-style.css
---

## CSS import location
`view-style.css` is imported in `DataListViewer.jsx` (the top-level entry component). It was NOT previously imported anywhere — adding `import "./view-style.css"` to `DataListViewer.jsx` was the fix that made all datalist styles apply. Do not move this import or remove it.

## Rule
The datalist viewer (`viewer/view-style.css`) defines its own `--dl-*` design tokens locally. Do NOT use generic `--theme-color`, `--font-size-sm`, `--bg-surface-alt`, etc. — they are not globally defined.

## Why
The advance theme exposes only a handful of globals:
- `--primary-color` (brand colour, indigo-ish)
- `--font-color` (body text)
- `--text-muted` / `--text-primary` / `--text-secondary`
- `--navigation-color`, `--secondary-color`, `--header-color`

The variables `--theme-color`, `--border-default`, `--bg-surface-alt`, `--font-size-sm`, `--font-weight-bold`, `--success`, `--danger`, etc. are only defined inside `.s2a-modern-login` scope and are NOT available in the main app context.

## How to apply
Always define tokens at the top of `view-style.css` scoped to the datalist containers:

```css
.s2a-react-table,
.s2a-datalist-header,
.s2a-dl-actions,
.s2a-dl-footer,
.s2a-bulk-tray,
.dropdown-menu {
  --dl-primary: var(--primary-color, #4f46e5);
  --dl-text:    var(--font-color, #1e293b);
  --dl-muted:   var(--text-muted, #64748b);
  --dl-border:  #cbd5e1;          /* visible grey, NOT the near-invisible #e2e8f0 */
  --dl-bg:      var(--bg-surface, #ffffff);
  --dl-bg-hover: var(--bg-hover, #f1f5f9);
  --dl-danger:  #dc2626;
  --dl-success: #16a34a;
  /* ... all other tokens with hardcoded fallbacks */
}
```

## Action buttons
Use `btn btn-sm s2a-dl-btn-primary` (Bootstrap base + custom override). Bootstrap's `.btn` resets browser defaults; custom class adds border/colour. Without the `btn` base the `<button>` element renders as plain text.

## Key borders
Use `--dl-border: #cbd5e1` (slate-300) for visible borders in light mode. `#e2e8f0` (slate-200) is too close to white and makes ghost buttons invisible.
