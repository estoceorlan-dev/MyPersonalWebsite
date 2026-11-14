import "dotenv/config";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { personal } from "./src/data/personal";
import { createApiApp } from "./server/app";

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "portfolio-api",
      configureServer(server) {
        const apiApp = createApiApp();
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith("/api/")) {
            (apiApp as unknown as (
              req: unknown,
              res: unknown,
              next: () => void,
            ) => void)(req, res, next);
            return;
          }
          next();
        });
      },
      configurePreviewServer(server) {
        const apiApp = createApiApp();
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith("/api/")) {
            (apiApp as unknown as (
              req: unknown,
              res: unknown,
              next: () => void,
            ) => void)(req, res, next);
            return;
          }
          if (req.url?.startsWith("/owner")) {
            req.url = "/index.html";
          }
          next();
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
