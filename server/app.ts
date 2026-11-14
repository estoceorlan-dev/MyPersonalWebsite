import crypto from "node:crypto";
import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import {
  initStorage,
  getStorageMode,
  getOwnerByEmail,
  getOwnerById,
  updateOwnerCredentials,
  getPortfolioContent,
  savePortfolioContent,
  resetPortfolioContent,
  saveMediaAsset,
  getMediaAsset,
  recordVisit,
  getAnalyticsSummary,
} from "./db";
import type { SeededPortfolioContent } from "./db";
import {
  signOwnerToken,
  requireOwnerAuth,
  AUTH_RATE_LIMIT_MAX,
  recordLoginAttempt,
} from "./auth";
import type { AuthenticatedRequest } from "./auth";

const ALLOWED_MIME_PREFIXES = ["image/", "application/pdf"];
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB

function getVisitorHash(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  const ip =
    (typeof forwarded === "string" ? forwarded.split(",")[0] : "") ||
    req.socket.remoteAddress ||
    "127.0.0.1";
  const ua = req.headers["user-agent"] || "browser";
  const daySalt = new Date().toISOString().slice(0, 10);
  return crypto
    .createHash("sha256")
    .update(`${ip}|${ua}|${daySalt}`)
    .digest("hex")
    .slice(0, 24);
}

export function createApiApp() {
  const app = express();

  const corsOrigin = process.env.CORS_ORIGIN?.trim();
  app.use(
    cors({
      origin: corsOrigin ? corsOrigin.split(",").map((s) => s.trim()) : true,
      credentials: true,
    }),
  );

  app.use(express.json({ limit: "25mb" }));

  app.get("/api/health", async (_req: Request, res: Response) => {
    const mode = await initStorage();
    res.json({ status: "ok", storageMode: mode });
  });

  // Authentication endpoints (rate limited to 5 attempts per hour per client IP)
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      await initStorage();
      const forwarded = req.headers["x-forwarded-for"];
      const ip =
        (typeof forwarded === "string" ? forwarded.split(",")[0]?.trim() : "") ||
        req.socket.remoteAddress ||
        "unknown";

      const email = String(req.body?.email || "").trim().toLowerCase();
      const password = String(req.body?.password || "");

      if (!email || !password) {
        res.status(400).json({ error: "Please enter both email and password." });
        return;
      }

      const rate = recordLoginAttempt(ip);
      res.setHeader("X-RateLimit-Limit", String(AUTH_RATE_LIMIT_MAX));
      res.setHeader("X-RateLimit-Remaining", String(rate.remaining));

      if (!rate.allowed) {
        const retryMinutes = Math.ceil(rate.retryAfterSeconds / 60);
        res.setHeader("Retry-After", String(rate.retryAfterSeconds));
        res.status(429).json({
          error: `Rate limit exceeded (maximum 5 authentication attempts per hour). Please try again in ${retryMinutes} minute${retryMinutes === 1 ? "" : "s"}.`,
        });
        return;
      }

      const owner = await getOwnerByEmail(email);
      if (!owner) {
        res.status(401).json({ error: "Invalid email or password." });
        return;
      }

      const valid = await bcrypt.compare(password, owner.passwordHash);
      if (!valid) {
        res.status(401).json({ error: "Invalid email or password." });
        return;
      }

      const token = signOwnerToken({ sub: owner.id, email: owner.email });
      res.json({
        token,
        owner: { id: owner.id, email: owner.email },
        storageMode: getStorageMode(),
      });
    } catch (error) {
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Authentication failed.",
      });
    }
  });

  app.get(
    "/api/auth/me",
    requireOwnerAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const owner = req.owner ? await getOwnerById(req.owner.sub) : null;
        if (!owner) {
          res.status(401).json({ error: "Owner account not found." });
          return;
        }
        res.json({
          owner: { id: owner.id, email: owner.email },
          storageMode: getStorageMode(),
        });
      } catch (error) {
        res.status(500).json({
          error:
            error instanceof Error ? error.message : "Session check failed.",
        });
      }
    },
  );

  app.put(
    "/api/auth/credentials",
    requireOwnerAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        if (!req.owner) {
          res.status(401).json({ error: "Unauthorized." });
          return;
        }
        const owner = await getOwnerById(req.owner.sub);
        if (!owner) {
          res.status(404).json({ error: "Owner account not found." });
          return;
        }

        const currentPassword = String(req.body?.currentPassword || "");
        const nextEmail = String(req.body?.email || owner.email)
          .trim()
          .toLowerCase();
        const newPassword = String(req.body?.newPassword || "");

        const valid = await bcrypt.compare(currentPassword, owner.passwordHash);
        if (!valid) {
          res.status(400).json({ error: "Current password is incorrect." });
          return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
          res.status(400).json({ error: "Please enter a valid email address." });
          return;
        }

        if (newPassword && newPassword.length < 8) {
          res.status(400).json({
            error: "New password must be at least 8 characters long.",
          });
          return;
        }

        const nextHash = newPassword
          ? await bcrypt.hash(newPassword, 10)
          : owner.passwordHash;

        const updated = await updateOwnerCredentials(
          owner.id,
          nextEmail,
          nextHash,
        );
        const token = signOwnerToken({
          sub: updated.id,
          email: updated.email,
        });

        res.json({
          token,
          owner: { id: updated.id, email: updated.email },
        });
      } catch (error) {
        res.status(500).json({
          error:
            error instanceof Error
              ? error.message
              : "Failed to update credentials.",
        });
      }
    },
  );

  // Portfolio content endpoints
  app.get("/api/portfolio", async (req: Request, res: Response) => {
    try {
      const content = await getPortfolioContent();
      if (req.query.visit === "1") {
        const rawDevice = String(req.query.device || "desktop");
        const deviceType =
          rawDevice === "mobile" || rawDevice === "tablet"
            ? rawDevice
            : "desktop";
        const path = String(req.query.path || "/").slice(0, 120);
        await recordVisit({
          visitorHash: getVisitorHash(req),
          path,
          deviceType,
        });
      }
      res.json({
        content,
        storageMode: getStorageMode(),
      });
    } catch (error) {
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to load portfolio content.",
      });
    }
  });

  app.put(
    "/api/portfolio",
    requireOwnerAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const incoming = req.body?.content as
          | SeededPortfolioContent
          | undefined;
        if (!incoming || typeof incoming !== "object" || !incoming.personal) {
          res.status(400).json({ error: "Invalid portfolio content payload." });
          return;
        }
        const saved = await savePortfolioContent(incoming);
        res.json({
          content: saved,
          storageMode: getStorageMode(),
        });
      } catch (error) {
        res.status(500).json({
          error:
            error instanceof Error
              ? error.message
              : "Failed to save portfolio content.",
        });
      }
    },
  );

  app.post(
    "/api/portfolio/reset",
    requireOwnerAuth,
    async (_req: AuthenticatedRequest, res: Response) => {
      try {
        const reset = await resetPortfolioContent();
        res.json({
          content: reset,
          storageMode: getStorageMode(),
        });
      } catch (error) {
        res.status(500).json({
          error:
            error instanceof Error
              ? error.message
              : "Failed to reset portfolio content.",
        });
      }
    },
  );

  // Media upload & delivery endpoints
  app.post(
    "/api/media",
    requireOwnerAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const filename = String(req.body?.filename || "upload");
        const mimeType = String(req.body?.mimeType || "application/octet-stream");
        const dataBase64 = String(req.body?.dataBase64 || "");

        if (
          !ALLOWED_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix))
        ) {
          res.status(400).json({
            error: "Only image files and PDF documents are supported.",
          });
          return;
        }

        if (!dataBase64) {
          res.status(400).json({ error: "File data is required." });
          return;
        }

        const bytes = Buffer.from(dataBase64, "base64");
        if (bytes.byteLength === 0 || bytes.byteLength > MAX_UPLOAD_BYTES) {
          res.status(400).json({
            error: "File size must be between 1 byte and 15 MB.",
          });
          return;
        }

        const saved = await saveMediaAsset({ filename, mimeType, bytes });
        res.json({
          id: saved.id,
          url: `/api/media/${saved.id}/${encodeURIComponent(saved.filename)}`,
          filename: saved.filename,
          mimeType: saved.mimeType,
          sizeBytes: saved.sizeBytes,
        });
      } catch (error) {
        res.status(500).json({
          error:
            error instanceof Error ? error.message : "Failed to upload file.",
        });
      }
    },
  );

  const serveMediaHandler = async (req: Request, res: Response) => {
    try {
      const id = String(req.params.id || "");
      const asset = await getMediaAsset(id);
      if (!asset) {
        res.status(404).json({ error: "Asset not found." });
        return;
      }
      res.setHeader("Content-Type", asset.mimeType);
      res.setHeader("Content-Length", String(asset.sizeBytes));
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${asset.filename.replace(/"/g, "")}"`,
      );
      res.send(asset.bytes);
    } catch {
      res.status(500).json({ error: "Failed to stream media asset." });
    }
  };

  app.get("/api/media/:id", serveMediaHandler);
  app.get("/api/media/:id/:filename", serveMediaHandler);

  // Visitor analytics endpoints
  app.get("/api/analytics/track", async (req: Request, res: Response) => {
    try {
      const rawDevice = String(req.query.device || "desktop");
      const deviceType =
        rawDevice === "mobile" || rawDevice === "tablet"
          ? rawDevice
          : "desktop";
      const path = String(req.query.path || "/").slice(0, 120);
      await recordVisit({
        visitorHash: getVisitorHash(req),
        path,
        deviceType,
      });
      res.json({ tracked: true });
    } catch {
      res.json({ tracked: false });
    }
  });

  app.get(
    "/api/analytics/summary",
    requireOwnerAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const selectedDate =
          typeof req.query.date === "string" ? req.query.date : undefined;
        const summary = await getAnalyticsSummary(selectedDate);
        res.json(summary);
      } catch (error) {
        res.status(500).json({
          error:
            error instanceof Error
              ? error.message
              : "Failed to compute visitor analytics.",
        });
      }
    },
  );

  return app;
}
