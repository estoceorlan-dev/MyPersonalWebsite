import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { personal } from "./src/data/personal";

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
      name: "portfolio-metadata",
      transformIndexHtml(html) {
        return html
          .replaceAll(
            "__PORTFOLIO_TITLE__",
            escapeHtml(`${personal.name} — IT Student & Aspiring Developer`),
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
