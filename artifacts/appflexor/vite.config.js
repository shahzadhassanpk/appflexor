import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

const port = Number(process.env.PORT ?? "18232");
const basePath = process.env.BASE_PATH ?? "/app/";

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
    ],
    base: basePath,
    server: {
        port,
        strictPort: true,
        host: "0.0.0.0",
        allowedHosts: true,
        proxy: {
            "/app/service": {
                target: "https://demo.step2agility.com",
                changeOrigin: true,
                secure: true,
            },
            "/monitor/app/service": {
                target: "https://demo.step2agility.com",
                changeOrigin: true,
                secure: true,
            },
            "/bpm/service": {
                target: "https://demo.step2agility.com",
                changeOrigin: true,
                secure: true,
            },
            "/file/service": {
                target: "https://demo.step2agility.com",
                changeOrigin: true,
                secure: true,
            },
            "/es/service": {
                target: "https://demo.step2agility.com",
                changeOrigin: true,
                secure: true,
            },
            "/api/service": {
                target: "https://demo.step2agility.com",
                changeOrigin: true,
                secure: true,
            },
            "/im/service": {
                target: "https://demo.step2agility.com",
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
