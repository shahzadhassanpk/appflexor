import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const port = Number(process.env.PORT ?? "3000");
const basePath = process.env.BASE_PATH ?? "/app/";

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
    ],
    base: basePath,
    resolve: {
        alias: {
            // Stub for optional Module Federation remote — replaced by a real host at runtime
            "app_plugins/AppView": path.resolve("./src/app_plugins/AppView.jsx"),
            // Force ALL react imports — including pre-bundled deps — to use the
            // single React 18.2.0 installed locally so no duplicate-React crash occurs.
            "react":                path.resolve("./node_modules/react"),
            "react-dom":            path.resolve("./node_modules/react-dom"),
            "react/jsx-runtime":    path.resolve("./node_modules/react/jsx-runtime"),
            "react/jsx-dev-runtime":path.resolve("./node_modules/react/jsx-dev-runtime"),
            // bpmn-js-token-simulation imports diagram-js as a peer dep.  In pnpm's
            // virtual store the token-simulation package cannot resolve diagram-js
            // through normal node resolution, so we pin it globally to the physical
            // store path used by bpmn-js@17 — diagram-js@14.x — which has all the
            // required exports (including EscapeUtil).
            "diagram-js": path.resolve("../../node_modules/.pnpm/diagram-js@14.11.3/node_modules/diagram-js"),
        },
        dedupe: ["react", "react-dom", "bpmn-js", "diagram-js"],
    },
    server: {
        port,
        strictPort: true,
        host: "0.0.0.0",
        allowedHosts: true,
        proxy: {
            "/app/service": {
                target: "https://demo.appflexor.com",
                changeOrigin: true,
                secure: true,
            },
            "/monitor/app/service": {
                target: "https://demo.appflexor.com",
                changeOrigin: true,
                secure: true,
            },
            "/bpm/service": {
                target: "https://demo.appflexor.com",
                changeOrigin: true,
                secure: true,
            },
            "/file/service": {
                target: "https://demo.appflexor.com",
                changeOrigin: true,
                secure: true,
            },
            "/es/service": {
                target: "https://demo.appflexor.com",
                changeOrigin: true,
                secure: true,
            },
            "/api/service": {
                target: "https://demo.appflexor.com",
                changeOrigin: true,
                secure: true,
            },
            "/im/service": {
                target: "https://demo.appflexor.com",
                changeOrigin: true,
                secure: true,
            },
        },
    },
    root: "./",
    build: {
        outDir: "build",
        sourcemap: true,
        // The legacy application shell currently includes the shared builders and
        // viewers. Keep a finite budget so regressions still surface while large
        // feature libraries such as Plotly remain isolated behind lazy imports.
        chunkSizeWarningLimit: 4500,
    },
    publicDir: "public",
    define: {
        // Some libraries use the global object, even though it doesn't exist in the browser.
        // Alternatively, we could add `<script>window.global = window;</script>` to index.html.
        // https://github.com/vitejs/vite/discussions/5912
        // global: "globalThis",
        // _global: "globalThis",
    },
    optimizeDeps: {
        /* bpmn-js-token-simulation is a pre-built ESM package that imports
           diagram-js as a peer dep.  In pnpm's virtual store the package
           cannot see diagram-js through normal node resolution, so we exclude
           it from pre-bundling and let the diagram-js alias (below) resolve
           the import globally.  bpmn-js and bpmn-js-sketchy continue to be
           pre-bundled as before. */
        exclude: [
            "bpmn-js-token-simulation",
            "diagram-js",
        ],
        esbuildOptions: {
            // Node.js global to browser globalThis
            define: {
                global: "globalThis",
                _global: "globalThis",
            },
        },
    },
});
