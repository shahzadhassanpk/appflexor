import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        {
            name: "app-base-index",
            configureServer(server) {
                server.middlewares.use((req, _res, next) => {
                    if (req.url === "/app/" || req.url === "/app") {
                        req.url = "/app/index.html";
                    }
                    next();
                });
            },
        },
    ],
    base: "/app/",
    server: {
        port: 3000,
        allowedHosts: [".local.com", "demo.local.com"],

        // open: "/public/index.html"
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
