import crypto from "node:crypto";
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
  verifyOwnerToken,
  AUTH_RATE_LIMIT_MAX,
  recordLoginAttempt,
} from "./auth";
import type { JwtOwnerPayload } from "./auth";

const ALLOWED_MIME_PREFIXES = ["image/", "application/pdf"];
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024; // 15 MB

function buildCorsHeaders(request: Request): Record<string, string> {
  const reqOrigin = request.headers.get("origin") || "*";
  const configuredOrigin = process.env.CORS_ORIGIN?.trim();
  let allowOrigin = reqOrigin;

  if (configuredOrigin) {
    const allowedList = configuredOrigin
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (allowedList.length > 0) {
      allowOrigin = allowedList.includes(reqOrigin)
        ? reqOrigin
        : allowedList[0]!;
    }
  }

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
    "Access-Control-Expose-Headers":
      "X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After",
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
  };
}

function jsonResponse(
  request: Request,
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...buildCorsHeaders(request),
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "127.0.0.1";
}

function getVisitorHashFromRequest(request: Request): string {
  const ip = getClientIp(request);
  const ua = request.headers.get("user-agent") || "browser";
  const daySalt = new Date().toISOString().slice(0, 10);
  return crypto
    .createHash("sha256")
    .update(`${ip}|${ua}|${daySalt}`)
    .digest("hex")
    .slice(0, 24);
}

function authenticateOwner(request: Request): JwtOwnerPayload | null {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
  if (!token) return null;
  return verifyOwnerToken(token);
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: buildCorsHeaders(request),
      });
    }

    const url = new URL(request.url);
    const pathname = url.pathname.replace(/\/+$/, "") || "/";
    const method = request.method.toUpperCase();

    try {
      // 1. Health check (root or /api/health)
      if (
        method === "GET" &&
        (pathname === "/" || pathname === "/api/health")
      ) {
        const mode = await initStorage();
        return jsonResponse(request, {
          status: "ok",
          storageMode: mode,
          runtime: "neon-functions",
        });
      }

      // 2. Owner authentication: POST /api/auth/login (5 attempts / hour rate limit)
      if (method === "POST" && pathname === "/api/auth/login") {
        await initStorage();
        const ip = getClientIp(request);
        const body = (await request.json().catch(() => ({}))) as {
          email?: string;
          password?: string;
        };

        const email = String(body.email || "").trim().toLowerCase();
        const password = String(body.password || "");

        if (!email || !password) {
          return jsonResponse(
            request,
            { error: "Please enter both email and password." },
            400,
          );
        }

        const rate = recordLoginAttempt(ip);
        const rateHeaders: Record<string, string> = {
          "X-RateLimit-Limit": String(AUTH_RATE_LIMIT_MAX),
          "X-RateLimit-Remaining": String(rate.remaining),
        };

        if (!rate.allowed) {
          const retryMinutes = Math.ceil(rate.retryAfterSeconds / 60);
          rateHeaders["Retry-After"] = String(rate.retryAfterSeconds);
          return jsonResponse(
            request,
            {
              error: `Rate limit exceeded (maximum 5 authentication attempts per hour). Please try again in ${retryMinutes} minute${retryMinutes === 1 ? "" : "s"}.`,
            },
            429,
            rateHeaders,
          );
        }

        const owner = await getOwnerByEmail(email);
        if (!owner) {
          return jsonResponse(
            request,
            { error: "Invalid email or password." },
            401,
            rateHeaders,
          );
        }

        const valid = await bcrypt.compare(password, owner.passwordHash);
        if (!valid) {
          return jsonResponse(
            request,
            { error: "Invalid email or password." },
            401,
            rateHeaders,
          );
        }

        const token = signOwnerToken({ sub: owner.id, email: owner.email });
        return jsonResponse(
          request,
          {
            token,
            owner: { id: owner.id, email: owner.email },
            storageMode: getStorageMode(),
          },
          200,
          rateHeaders,
        );
      }

      // 3. Session check: GET /api/auth/me
      if (method === "GET" && pathname === "/api/auth/me") {
        const authPayload = authenticateOwner(request);
        if (!authPayload) {
          return jsonResponse(
            request,
            { error: "Missing or invalid authorization token." },
            401,
          );
        }
        const owner = await getOwnerById(authPayload.sub);
        if (!owner) {
          return jsonResponse(
            request,
            { error: "Owner account not found." },
            401,
          );
        }
        return jsonResponse(request, {
          owner: { id: owner.id, email: owner.email },
          storageMode: getStorageMode(),
        });
      }

      // 4. Update credentials: PUT /api/auth/credentials
      if (method === "PUT" && pathname === "/api/auth/credentials") {
        const authPayload = authenticateOwner(request);
        if (!authPayload) {
          return jsonResponse(
            request,
            { error: "Missing or invalid authorization token." },
            401,
          );
        }
        const owner = await getOwnerById(authPayload.sub);
        if (!owner) {
          return jsonResponse(
            request,
            { error: "Owner account not found." },
            404,
          );
        }

        const body = (await request.json().catch(() => ({}))) as {
          currentPassword?: string;
          email?: string;
          newPassword?: string;
        };

        const currentPassword = String(body.currentPassword || "");
        const nextEmail = String(body.email || owner.email)
          .trim()
          .toLowerCase();
        const newPassword = String(body.newPassword || "");

        const valid = await bcrypt.compare(currentPassword, owner.passwordHash);
        if (!valid) {
          return jsonResponse(
            request,
            { error: "Current password is incorrect." },
            400,
          );
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
          return jsonResponse(
            request,
            { error: "Please enter a valid email address." },
            400,
          );
        }

        if (newPassword && newPassword.length < 8) {
          return jsonResponse(
            request,
            { error: "New password must be at least 8 characters long." },
            400,
          );
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

        return jsonResponse(request, {
          token,
          owner: { id: updated.id, email: updated.email },
        });
      }

      // 5. Portfolio content: GET /api/portfolio
      if (method === "GET" && pathname === "/api/portfolio") {
        const content = await getPortfolioContent();
        if (url.searchParams.get("visit") === "1") {
          const rawDevice = url.searchParams.get("device") || "desktop";
          const deviceType =
            rawDevice === "mobile" || rawDevice === "tablet"
              ? rawDevice
              : "desktop";
          const visitPath = (url.searchParams.get("path") || "/").slice(0, 120);
          await recordVisit({
            visitorHash: getVisitorHashFromRequest(request),
            path: visitPath,
            deviceType,
          });
        }
        return jsonResponse(request, {
          content,
          storageMode: getStorageMode(),
        });
      }

      // 6. Portfolio save: PUT /api/portfolio
      if (method === "PUT" && pathname === "/api/portfolio") {
        const authPayload = authenticateOwner(request);
        if (!authPayload) {
          return jsonResponse(
            request,
            { error: "Missing or invalid authorization token." },
            401,
          );
        }
        const body = (await request.json().catch(() => ({}))) as {
          content?: SeededPortfolioContent;
        };
        if (
          !body.content ||
          typeof body.content !== "object" ||
          !body.content.personal
        ) {
          return jsonResponse(
            request,
            { error: "Invalid portfolio content payload." },
            400,
          );
        }
        const saved = await savePortfolioContent(body.content);
        return jsonResponse(request, {
          content: saved,
          storageMode: getStorageMode(),
        });
      }

      // 7. Portfolio reset: POST /api/portfolio/reset
      if (method === "POST" && pathname === "/api/portfolio/reset") {
        const authPayload = authenticateOwner(request);
        if (!authPayload) {
          return jsonResponse(
            request,
            { error: "Missing or invalid authorization token." },
            401,
          );
        }
        const reset = await resetPortfolioContent();
        return jsonResponse(request, {
          content: reset,
          storageMode: getStorageMode(),
        });
      }

      // 8. Media upload: POST /api/media
      if (method === "POST" && pathname === "/api/media") {
        const authPayload = authenticateOwner(request);
        if (!authPayload) {
          return jsonResponse(
            request,
            { error: "Missing or invalid authorization token." },
            401,
          );
        }
        const body = (await request.json().catch(() => ({}))) as {
          filename?: string;
          mimeType?: string;
          dataBase64?: string;
        };
        const filename = String(body.filename || "upload");
        const mimeType = String(body.mimeType || "application/octet-stream");
        const dataBase64 = String(body.dataBase64 || "");

        if (
          !ALLOWED_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix))
        ) {
          return jsonResponse(
            request,
            { error: "Only image files and PDF documents are supported." },
            400,
          );
        }

        if (!dataBase64) {
          return jsonResponse(
            request,
            { error: "File data is required." },
            400,
          );
        }

        const bytes = Buffer.from(dataBase64, "base64");
        if (bytes.byteLength === 0 || bytes.byteLength > MAX_UPLOAD_BYTES) {
          return jsonResponse(
            request,
            { error: "File size must be between 1 byte and 15 MB." },
            400,
          );
        }

        const saved = await saveMediaAsset({ filename, mimeType, bytes });
        return jsonResponse(request, {
          id: saved.id,
          url: `/api/media/${saved.id}/${encodeURIComponent(saved.filename)}`,
          filename: saved.filename,
          mimeType: saved.mimeType,
          sizeBytes: saved.sizeBytes,
        });
      }

      // 9. Media stream: GET /api/media/:id or /api/media/:id/:filename
      const mediaMatch = /^\/api\/media\/([^/]+)(?:\/.*)?$/.exec(pathname);
      if (method === "GET" && mediaMatch?.[1]) {
        const asset = await getMediaAsset(decodeURIComponent(mediaMatch[1]));
        if (!asset) {
          return jsonResponse(request, { error: "Asset not found." }, 404);
        }
        return new Response(new Uint8Array(asset.bytes), {
          status: 200,
          headers: {
            ...buildCorsHeaders(request),
            "Content-Type": asset.mimeType,
            "Content-Length": String(asset.sizeBytes),
            "Cache-Control": "public, max-age=31536000, immutable",
            "Content-Disposition": `inline; filename="${asset.filename.replace(/"/g, "")}"`,
          },
        });
      }

      // 10. Visitor tracking: GET /api/analytics/track
      if (method === "GET" && pathname === "/api/analytics/track") {
        const rawDevice = url.searchParams.get("device") || "desktop";
        const deviceType =
          rawDevice === "mobile" || rawDevice === "tablet"
            ? rawDevice
            : "desktop";
        const visitPath = (url.searchParams.get("path") || "/").slice(0, 120);
        await recordVisit({
          visitorHash: getVisitorHashFromRequest(request),
          path: visitPath,
          deviceType,
        });
        return jsonResponse(request, { tracked: true });
      }

      // 11. Visitor analytics summary: GET /api/analytics/summary
      if (method === "GET" && pathname === "/api/analytics/summary") {
        const authPayload = authenticateOwner(request);
        if (!authPayload) {
          return jsonResponse(
            request,
            { error: "Missing or invalid authorization token." },
            401,
          );
        }
        const selectedDate = url.searchParams.get("date") || undefined;
        const summary = await getAnalyticsSummary(selectedDate);
        return jsonResponse(request, summary);
      }

      return jsonResponse(request, { error: "Not found." }, 404);
    } catch (error) {
      return jsonResponse(
        request,
        {
          error:
            error instanceof Error
              ? error.message
              : "Internal server error.",
        },
        500,
      );
    }
  },
};
