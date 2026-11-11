import { test, expect } from "@playwright/test";

test("shows all 13 projects, links grouped repositories, and displays the Floréa Haven logo and UI carousel", async ({
  page,
}) => {
  await page.goto("/#projects");
  await expect(page.locator(".project-card")).toHaveCount(6);
  await expect(
    page.getByRole("img", { name: "Floréa Haven logo" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "View all 13 projects" }).click();
  await expect(page.locator(".project-card")).toHaveCount(13);
  await expect(
    page.getByRole("button", { name: "View JCE POS details" }),
  ).toHaveCount(0);
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
  const carousel = florea.getByRole("region", {
    name: "Floréa Haven interface screenshots",
  });
  await expect(carousel).toBeVisible();
  await expect(carousel.locator(".carousel-count")).toHaveText("01 / 05");
  await expect(carousel.locator(".carousel-label")).toHaveText("Home");
  await florea.screenshot({ path: ".qa/florea-modal.png" });
  await carousel.getByRole("button", { name: "Next screenshot" }).click();
  await expect(carousel.locator(".carousel-count")).toHaveText("02 / 05");
  await expect(carousel.locator(".carousel-label")).toHaveText(
    "Product catalog",
  );
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
  const certificates = page.locator("#certifications .certificate-card");
  await expect(certificates).toHaveCount(4);
  await certificates.filter({ hasText: "SQL Server Foundations" }).click();
  const certDialog = page.getByRole("dialog", {
    name: "SQL Server Foundations",
  });
  await expect(certDialog).toContainText("BKCG130925");
  await expect(
    certDialog.getByRole("link", { name: "View PDF" }),
  ).toHaveAttribute("href", "/certificates/sql-server-foundations.pdf");
  await page.keyboard.press("Escape");
  const certPdf = await page.request.get(
    "/certificates/introduction-to-modern-ai.pdf",
  );
  expect((await certPdf.body()).subarray(0, 5).toString()).toBe("%PDF-");
  await expect(page.locator("main")).not.toContainText("[Your Name]");
  expect(await (await page.request.get("/robots.txt")).text()).toContain(
    "https://www.orlanestoce.online/sitemap.xml",
  );
  expect(await (await page.request.get("/sitemap.xml")).text()).toContain(
    "https://www.orlanestoce.online/",
  );
});
