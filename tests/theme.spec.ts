import { test, expect } from "@playwright/test";

test("switches with the keyboard, remembers the choice, and restores light mode", async ({
  page,
}) => {
  await page.goto("/");
  const root = page.locator("html");
  const toggle = page.getByRole("button", { name: "Switch to dark mode" });
  await expect(root).toHaveAttribute("data-theme", "light");
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(root).toHaveAttribute("data-theme", "dark");
  await expect(
    page.getByRole("button", { name: "Switch to light mode" }),
  ).toBeFocused();
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    "content",
    "#0b0d12",
  );
  await page.reload();
  await expect(root).toHaveAttribute("data-theme", "dark");
  await page.emulateMedia({ colorScheme: "dark" });
  const lightToggle = page.getByRole("button", {
    name: "Switch to light mode",
  });
  await lightToggle.focus();
  await page.keyboard.press("Space");
  await expect(root).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(root).toHaveAttribute("data-theme", "light");
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
    "content",
    "#faf9f6",
  );
});

test("follows system preferences until the visitor chooses a theme", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await page.emulateMedia({ colorScheme: "dark" });
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("works when browser storage is blocked", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Storage blocked", "SecurityError");
      },
    });
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Switch to light mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(errors).toEqual([]);
});

test("keeps the theme button before the resume link without overflow", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await page.evaluate(() => document.fonts.ready);
  const toggle = page.getByRole("button", { name: "Switch to light mode" });
  for (const width of testInfo.project.name === "desktop"
    ? [1440, 1024, 1000, 768]
    : [390, 375, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(toggle).toBeVisible();
    const toggleBox = (await toggle.boundingBox())!;
    const resumeBox = (await page.locator(".nav-resume").boundingBox())!;
    expect(toggleBox.width).toBeGreaterThanOrEqual(36);
    expect(toggleBox.x + toggleBox.width).toBeLessThanOrEqual(resumeBox.x);
    expect(resumeBox.x + resumeBox.width).toBeLessThanOrEqual(width);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({
    width: testInfo.project.name === "desktop" ? 1440 : 390,
    height: 1000,
  });
  for (const id of [
    "home",
    "about",
    "skills",
    "projects",
    "experience",
    "certifications",
    "contact",
  ]) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `.qa/${testInfo.project.name}-dark-full.png`,
    fullPage: true,
  });
  await page.screenshot({ path: `.qa/${testInfo.project.name}-dark-hero.png` });
  await expect(page.locator(".theme-sun")).toHaveCSS("opacity", "1");
  await expect(page.locator(".theme-moon")).toHaveCSS("opacity", "0");
});

test("animates the alternating icons and respects reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.locator(".theme-moon")).toHaveCSS("opacity", "1");
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await expect(page.locator(".theme-sun")).toHaveCSS("opacity", "1");
  await expect(page.locator(".theme-moon")).toHaveCSS("opacity", "0");
  expect(
    await page
      .locator(".theme-sun")
      .evaluate((el) => parseFloat(getComputedStyle(el).transitionDuration)),
  ).toBeGreaterThan(0.1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page
      .locator(".theme-sun")
      .evaluate((el) => parseFloat(getComputedStyle(el).transitionDuration)),
  ).toBeLessThan(0.01);
});
