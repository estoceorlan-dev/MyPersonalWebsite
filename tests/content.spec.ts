import { test, expect } from "@playwright/test";

test("shows all 14 projects and links both versions of grouped repositories", async ({
  page,
}) => {
  await page.goto("/#projects");
  await expect(page.locator(".project-card")).toHaveCount(6);
  await page.getByRole("button", { name: "View all 14 projects" }).click();
  await expect(page.locator(".project-card")).toHaveCount(14);
  await page
    .getByRole("button", { name: "View Blue vs. Yellow details" })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Blue vs. Yellow",
    exact: true,
  });
  await expect(
    dialog.getByRole("link", { name: "View repository", exact: true }),
  ).toHaveAttribute(
    "href",
    "https://github.com/estoceorlan-dev/blue-vs-yellow-frontend",
  );
  await expect(
    dialog.getByRole("link", { name: "Backend repository" }),
  ).toHaveAttribute(
    "href",
    "https://github.com/estoceorlan-dev/blue-vs-yellow-backend",
  );
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Show featured projects" }).click();
  await expect(page.locator(".project-card")).toHaveCount(6);
  await page.getByRole("button", { name: "View Floréa Haven details" }).click();
  const florea = page.getByRole("dialog", {
    name: "Floréa Haven",
    exact: true,
  });
  await expect(
    florea.getByRole("link", { name: "HTML / JavaScript version" }),
  ).toHaveAttribute(
    "href",
    "https://github.com/estoceorlan-dev/Florea-Haven-simple",
  );
  await expect(
    florea.getByRole("link", { name: "Preview HTML version" }),
  ).toHaveAttribute("href", "https://florea-haven.vercel.app");
});

test("publishes resume-backed facts and metadata for the custom domain", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://www.orlanestoce.online",
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    "https://www.orlanestoce.online/social-card.png",
  );
  await expect(page.locator("#about")).toContainText(
    "Buenavista Community College",
  );
  await expect(page.locator("#about")).toContainText(
    "English · Cebuano · Tagalog",
  );
  await expect(page.locator("#skills")).toContainText("React Native");
  await expect(page.locator("#experience")).toContainText(
    "Administrative & IT Systems Support",
  );
  await expect(page.locator("#experience")).toContainText("2025–2026");
  await expect(page.locator("#certifications")).toContainText("March 2026");
  await expect(page.locator("main")).not.toContainText("[Your Name]");
  expect(await (await page.request.get("/robots.txt")).text()).toContain(
    "https://www.orlanestoce.online/sitemap.xml",
  );
  expect(await (await page.request.get("/sitemap.xml")).text()).toContain(
    "https://www.orlanestoce.online/",
  );
});
