---
name: Appflexor default theme
description: S2aApp.jsx default theme setting — must be "light" to avoid black screen on fresh browser.
---

## Rule
In `artifacts/appflexor/src/s2a-framework/S2aApp.jsx`, the fallback `themeClass` when nothing is in localStorage must be `"light"`, not `"dark"`.

## Why
`theme.css` sets `body.dark { --primary-color: #0f171d }` and `body { background-color: var(--primary-color) }`. With a fresh browser (empty localStorage) and the backend unavailable, the channel API fails before it can override the theme, leaving the body with the near-black dark palette — the entire app appears black.

## Location
```
useEffect(() => {
    let newTheme = localStorage.getItem("theme");
    let themeClass = "light";   // ← must be "light"
    if (newTheme) {
        themeClass = newTheme;
    }
```
