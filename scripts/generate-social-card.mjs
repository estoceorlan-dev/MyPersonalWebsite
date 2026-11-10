import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const artwork = await readFile(
  new URL("../public/social-card.svg", import.meta.url),
  "utf8",
);
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
  headless: true,
});
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.setContent(
    `<html><body style="margin:0">${artwork}</body></html>`,
  );
  await page.screenshot({
    path: fileURLToPath(new URL("../public/social-card.png", import.meta.url)),
  });
  console.log("Generated public/social-card.png (1200 × 630).");
} finally {
  await browser.close();
}
