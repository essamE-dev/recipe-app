import fs from "node:fs";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const serviceWorkerPlugin = (): Plugin => ({
  name: "manual-service-worker",
  configureServer(server) {
    server.middlewares.use("/sw.js", (_req, res, next) => {
      const swPath = path.resolve(__dirname, "src/sw.js");
      if (!fs.existsSync(swPath)) {
        next();
        return;
      }

      res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      res.end(fs.readFileSync(swPath, "utf-8"));
    });
  },
  generateBundle() {
    const swPath = path.resolve(__dirname, "src/sw.js");
    if (!fs.existsSync(swPath)) {
      return;
    }
    this.emitFile({
      type: "asset",
      fileName: "sw.js",
      source: fs.readFileSync(swPath, "utf-8")
    });
  }
});

export default defineConfig({
  plugins: [react(), serviceWorkerPlugin()],
  server: {
    proxy: {
      "/api": "http://localhost:5174"
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  }
});
