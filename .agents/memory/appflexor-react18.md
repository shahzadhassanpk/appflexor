---
name: Appflexor React 18 pinning
description: Why and how appflexor is pinned to React 18.2.0 despite the workspace defaulting to React 19.
---

## Rule
Appflexor must always run React 18.2.0. The workspace-level pnpm override (`react: 19.1.0`) beats the package-specific override unless the package override is an exact version that exists in the store.

## Fix applied
1. `pnpm-workspace.yaml` overrides: `@workspace/appflexor>react` and `@workspace/appflexor>react-dom` set to `18.2.0` (exact).
2. `artifacts/appflexor/package.json` `react` pinned to `18.2.0`.
3. `artifacts/appflexor/vite.config.js` resolve aliases force all imports of react/react-dom to `./node_modules/react` (appflexor-local 18.2.0), preventing pre-bundled deps from bringing in a different copy.
4. `resolve.dedupe: ["react","react-dom"]` also set.

**Why:** Some pre-bundled Vite deps resolve React from the workspace-level pnpm store (19.x) rather than appflexor's local node_modules, creating two React instances and causing "Invalid hook call" crashes. Both the pnpm override AND the Vite alias are needed together.

**How to apply:** If the black-screen / Invalid hook call regression reappears, check:
- `node -e "console.log(require('./artifacts/appflexor/node_modules/react/package.json').version)"` → must say `18.2.0`
- Vite aliases still present in `artifacts/appflexor/vite.config.js`
- Clear Vite cache: `rm -rf artifacts/appflexor/node_modules/.vite` then restart workflow.
