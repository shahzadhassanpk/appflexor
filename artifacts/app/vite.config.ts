import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const rawPort = process.env.PORT ?? "23863";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH ?? "/app/";

export default defineConfig({
  base: basePath,
  define: {
    global: "globalThis",
  },
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(import.meta.dirname, "src") },
      { find: "@assets", replacement: path.resolve(import.meta.dirname, "..", "..", "attached_assets") },
      { find: /^plotly\.js\/dist\/plotly-cartesian$/, replacement: path.resolve(import.meta.dirname, "src/__stubs__/plotly-cartesian.js") },
      { find: /^plotly\.js$/, replacement: path.resolve(import.meta.dirname, "src/__stubs__/plotly.js") },
      { find: /^react-plotlyjs$/, replacement: path.resolve(import.meta.dirname, "src/__stubs__/react-plotlyjs.js") },
    ],
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react-dom/client", "react-router-dom", "react-redux", "redux"],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react/jsx-runtime"],
    force: false,
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
    proxy: {
      "/app/service": {
        target: "https://demo.step2agility.com",
        changeOrigin: true,
        secure: true,
      },
      "/file/service": {
        target: "https://demo.step2agility.com",
        changeOrigin: true,
        secure: true,
      },
      "/im/service": {
        target: "https://demo.step2agility.com",
        changeOrigin: true,
        secure: true,
        ws: true,
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
      "/es/service": {
        target: "https://demo.step2agility.com",
        changeOrigin: true,
        secure: true,
      },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
