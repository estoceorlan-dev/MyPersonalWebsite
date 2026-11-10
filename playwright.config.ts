import { defineConfig, devices } from "@playwright/test";

const production = process.env.PORTFOLIO_TEST_TARGET === "production";
const port = production ? 4173 : 5173;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  workers: 2,
  timeout: 30_000,
  reporter: "list",
  use: {
    baseURL,
    channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
    trace: "retain-on-failure",
    reducedMotion: "reduce",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: {
    command: `npm run ${production ? "preview" : "dev"} -- --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env.CI && !production,
  },
});
