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
        },
        dedupe: ["react", "react-dom"],
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
        esbuildOptions: {
            // Node.js global to browser globalThis
            define: {
                global: "globalThis",
                _global: "globalThis",
            },
        },
    },
});
