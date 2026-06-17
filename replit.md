# Appflexor

A developer-first app platform landing page — sharp, modern welcome screen built with React + Vite.

## Run & Operate

- `pnpm --filter @workspace/appflexor run dev` — run the frontend (uses PORT env var)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 18 + Vite + Tailwind CSS v4
- Routing: wouter
- UI: shadcn/ui components, lucide-react icons
- Fonts: Bricolage Grotesque, Inter, JetBrains Mono (Google Fonts)
- Animations: framer-motion, tw-animate-css

## Where things live

- `artifacts/appflexor/src/pages/home.tsx` — Welcome/landing page (primary file)
- `artifacts/appflexor/src/App.tsx` — Router and app shell
- `artifacts/appflexor/src/index.css` — Theme (HSL CSS custom properties, light + dark)

## Architecture decisions

- Frontend-only: no database, no API server, no OpenAPI spec needed
- All CSS custom properties (colors, radius, shadows) defined in `index.css` `:root` and `.dark` blocks
- Google Fonts imported as the very first line of `index.css` (PostCSS requirement)

## Product

Appflexor welcome screen — a rich, scroll-worthy single-page landing with hero section, features, code snippets, and CTA. Targets developers; dark/light theme; responsive layout.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Google Font `@import url(...)` must be the very first line in `index.css` — PostCSS fails silently if placed after other rules
- CSS color variables use space-separated HSL values without `hsl()` wrapper: `--primary: 250 84% 60%;`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
