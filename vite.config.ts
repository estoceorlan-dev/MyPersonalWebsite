import dotenv from "dotenv";
dotenv.config({ path: [".env.local", ".env"] });
import type { IncomingMessage, ServerResponse } from "node:http";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";
import pdfjsPackage from "pdfjs-dist/package.json" with { type: "json" };
import tailwindcss from "@tailwindcss/vite";
import { functionBaseUrl } from "@neon/env";
import { personal } from "./src/data/personal";
import neonFunction from "./server/function";

const DEFAULT_PRODUCTION_FUNCTION_URL =
  "https://br-ancient-field-b36wqdbh-api.compute.c-4.ap-southeast-1.aws.neon.tech";

const neonFunctionApiUrl = (() => {
  try {
    return functionBaseUrl("api");
  } catch {
    return DEFAULT_PRODUCTION_FUNCTION_URL;
  }
})();

async function handleApiMiddleware(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
  options: { spaOwnerFallback?: boolean } = {},
): Promise<void> {
  if (!req.url?.startsWith("/api/")) {
    if (options.spaOwnerFallback && req.url?.startsWith("/owner")) {
      req.url = "/index.html";
    }
    next();
    return;
  }

  try {
    const method = (req.method || "GET").toUpperCase();
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) {
        for (const item of value) headers.append(key, item);
      } else if (typeof value === "string") {
        headers.set(key, value);
      }
    }

    let body: Uint8Array | undefined;
    if (method !== "GET" && method !== "HEAD") {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
      }
      const combined = Buffer.concat(chunks);
      if (combined.byteLength > 0) {
        body = new Uint8Array(combined);
      }
    }

    const origin = `http://${req.headers.host || "127.0.0.1"}`;
    const webReq = new Request(`${origin}${req.url}`, {
      method,
      headers,
      body: body as BodyInit | undefined,
    });

    const webRes = await neonFunction.fetch(webReq);
    res.statusCode = webRes.status;
    webRes.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    const responseBuffer = Buffer.from(await webRes.arrayBuffer());
    res.end(responseBuffer);
  } catch (error) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Local API middleware error.",
      }),
    );
  }
}

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );

export default defineConfig({
  define: {
    __NEON_FUNCTION_API_URL__: JSON.stringify(neonFunctionApiUrl),
  },
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        "legacy/build/pdf.min.mjs", "legacy/build/pdf.worker.min.mjs",
        "cmaps", "iccs", "standard_fonts", "wasm", "LICENSE",
      ].map((path) => ({ src: `node_modules/pdfjs-dist/${path}`, dest: `pdfjs/${pdfjsPackage.version}` })),
    }),
    tailwindcss(),
    {
      name: "portfolio-api",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          void handleApiMiddleware(req, res, next);
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          void handleApiMiddleware(req, res, next, { spaOwnerFallback: true });
        });
      },
    },
    {
      name: "portfolio-metadata",
      transformIndexHtml(html) {
        return html
          .replaceAll(
            "__PORTFOLIO_TITLE__",
            escapeHtml(`${personal.name} - Software Developer`),
          )
          .replaceAll(
            "__PORTFOLIO_DESCRIPTION__",
            escapeHtml(personal.seoDescription),
          )
          .replace(
            "__PORTFOLIO_SOCIAL_META__",
            personal.siteUrl
              ? `<link rel="canonical" href="${escapeHtml(personal.siteUrl)}" /><meta property="og:url" content="${escapeHtml(personal.siteUrl)}" /><meta property="og:image" content="${escapeHtml(new URL("/social-card.png", personal.siteUrl).href)}" /><meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" /><meta property="og:image:alt" content="Personal portfolio — learning with intention and building with care" />`
              : "",
          );
      },
    },
  ],
});
