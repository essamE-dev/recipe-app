import fs from "node:fs";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
var serviceWorkerPlugin = function () { return ({
    name: "manual-service-worker",
    configureServer: function (server) {
        server.middlewares.use("/sw.js", function (_req, res, next) {
            var swPath = path.resolve(__dirname, "src/sw.js");
            if (!fs.existsSync(swPath)) {
                next();
                return;
            }
            res.setHeader("Content-Type", "application/javascript; charset=utf-8");
            res.end(fs.readFileSync(swPath, "utf-8"));
        });
    },
    generateBundle: function () {
        var swPath = path.resolve(__dirname, "src/sw.js");
        if (!fs.existsSync(swPath)) {
            return;
        }
        this.emitFile({
            type: "asset",
            fileName: "sw.js",
            source: fs.readFileSync(swPath, "utf-8")
        });
    }
}); };
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
