import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
    server: {
    port: 3800,
    proxy: {
      "/api": {
        target: "http://localhost:3801",
        changeOrigin: true,
      },
      "/media": {
        target: "https://ksirovka.cz",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/media/, ""),
      },
    },
  },
});
