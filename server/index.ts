import "dotenv/config";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import express from "express";
import { createApiApp } from "./app";
import { initStorage } from "./db";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "../dist");

async function main() {
  const mode = await initStorage();
  const app = createApiApp();

  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get("/{*splat}", (req, res, next) => {
      if (req.path.startsWith("/api/")) {
        next();
        return;
      }
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  const port = Number(process.env.PORT || 3001);
  app.listen(port, "0.0.0.0", () => {
    console.log(
      `Portfolio API & Server listening on port ${port} (storage mode: ${mode})`,
    );
  });
}

void main();
