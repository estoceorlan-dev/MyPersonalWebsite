import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  // Declare your Neon services here
  auth: false,
  functions: {
    api: {
      name: "Portfolio Management API",
      source: "server/function.ts",
      env: {
        OWNER_EMAIL: {
          value: process.env.OWNER_EMAIL ?? "estoce.orlan@gmail.com",
          required: false,
        },
        OWNER_PASSWORD: {
          value: process.env.OWNER_PASSWORD ?? "Orlandone2026!",
          required: false,
        },
        JWT_SECRET: {
          value:
            process.env.JWT_SECRET ??
            "orlandone-portfolio-neon-functions-jwt-secret-2026",
          required: false,
        },
        CORS_ORIGIN: {
          value: process.env.CORS_ORIGIN,
          required: false,
        },
      },
    },
  },
  // Branch policy: per-branch tuning
  branch: (branch) => {
    if (branch.isDefault) {
      // Default branch: no overrides, uses project defaults
      return {};
    }
    if (!branch.exists) {
      // New non-default branches: auto-expire
      // Run `neon checkout <name>` to create a new branch with these settings
      return { ttl: "7d" };
    }
    // Existing branch: no changes
    return {};
  },
});
