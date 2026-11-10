import { test, expect } from "@playwright/test";

test("renders every section without runtime errors or horizontal overflow", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await expect(page).toHaveTitle(/Your Name.*IT Student/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "[Your Name]",
  );
  await expect(
    page.getByRole("img", { name: "Portfolio owner portrait" }),
  ).toBeVisible();
  for (const id of [
    "home",
    "about",
    "skills",
    "projects",
    "experience",
    "certifications",
    "contact",
  ]) {
    const section = page.locator(`#${id}`);
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
  }
  await expect(
    page.getByText("There are no published credentials yet.", { exact: false }),
  ).toBeVisible();
  expect(errors).toEqual([]);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `.qa/${testInfo.project.name}-full.png`,
    fullPage: true,
  });
  await page.goto("/");
  await page.screenshot({ path: `.qa/${testInfo.project.name}-hero.png` });
});

test("filters projects, handles an empty category, and opens accessible project details", async ({
  page,
}) => {
  await page.goto("/#projects");
  const filters = page.getByRole("group", { name: "Filter projects" });
  await filters
    .getByRole("button", { name: "Machine Learning", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "View Mango Classifier details" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "View VitalySync details" }),
  ).toHaveCount(0);
  await filters
    .getByRole("button", { name: "Academic Projects", exact: true })
    .click();
  await expect(
    page.getByText("No projects in this category yet."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "View all projects", exact: true })
    .click();
  const trigger = page.getByRole("button", { name: "View VitalySync details" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "VitalySync", exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Repository link to be added")).toBeVisible();
  await expect(
    dialog.getByText("Adaptive lifestyle recommendations", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(() => document.activeElement?.closest("dialog")?.open),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test("resume and profile buttons explain missing content without fake destinations", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Download Resume" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Resume not added yet" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Close dialog" }).click();
  await page
    .getByRole("button", { name: "GitHub — not added yet" })
    .first()
    .click();
  await expect(
    page.getByRole("dialog", { name: "GitHub not added yet" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  expect(
    await page
      .locator('a[href="#"], a[href=""], a[href*="example.com"]')
      .count(),
  ).toBe(0);
});

test("validates contact fields and prepares a truthful, copyable email draft", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const submissions: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST") submissions.push(request.url());
  });
  await page.goto("/#contact");
  await page.getByRole("button", { name: "Prepare email" }).click();
  await expect(page.getByText("Please enter your name.")).toBeVisible();
  await expect(page.getByRole("textbox", { name: /^Your name/ })).toBeFocused();
  await page
    .getByRole("textbox", { name: /^Your name/ })
    .fill("Portfolio test");
  await page
    .getByLabel("Email address", { exact: false })
    .fill("test@example.com");
  await page.getByLabel("Subject", { exact: false }).fill("Internship inquiry");
  await page
    .getByLabel("Your message", { exact: false })
    .fill("I would like to discuss an internship opportunity.");
  await page.getByRole("button", { name: "Prepare email" }).click();
  await expect(page.getByText(/nothing has been sent/)).toBeVisible();
  await expect(page.getByLabel("Your email draft")).toHaveValue(
    /Subject: Internship inquiry/,
  );
  await page.getByRole("button", { name: "Copy draft" }).click();
  await expect(
    page.getByRole("button", { name: "Copied", exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "test@example.com",
  );
  expect(submissions).toEqual([]);
});

test("navigation reaches sections and supports mobile keyboard dismissal", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  if (testInfo.project.name === "mobile") {
    const toggle = page.getByRole("button", { name: "Open navigation" });
    await toggle.click();
    const dialog = page.getByRole("dialog", { name: "Explore the portfolio" });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(toggle).toBeFocused();
    await toggle.click();
    await dialog.getByRole("link", { name: "Projects" }).click();
    await expect(dialog).not.toBeVisible();
  } else
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Projects", exact: true })
      .click();
  await expect(page).toHaveURL(/#projects$/);
  await expect(
    page.getByRole("heading", { name: "From a thought to a thing." }),
  ).toBeInViewport();
  await page.getByRole("link", { name: "Back to top", exact: true }).click();
  await expect(page).toHaveURL(/#home$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeInViewport();
  expect(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
  ).toBe("auto");
});

test("fits narrow phones and tablets", async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== "desktop",
    "Desktop browser covers additional sizes.",
  );
  for (const width of [320, 375, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
    await page.locator("#projects").scrollIntoViewIfNeeded();
    await page.screenshot({ path: `.qa/projects-${width}.png` });
  }
});
