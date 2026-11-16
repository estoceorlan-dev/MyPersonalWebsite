import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe.configure({ mode: "serial" });

test("navigates from the footer copyright notice to owner login, authenticates, confirms actions with dialogs, preserves session across portfolio views, and enforces 5/hour rate limit", async ({
  page,
}, testInfo) => {
  await page.goto("/");

  // 1. Tap the copyright text at the bottom of the footer
  const copyrightLink = page.getByRole("link", {
    name: "© 2026 Orlandone Estoce. All rights reserved.",
  });
  await copyrightLink.scrollIntoViewIfNeeded();
  await expect(copyrightLink).toBeVisible();
  await copyrightLink.click();

  await expect(page).toHaveURL(/\/owner\/login$/);
  await expect(
    page.getByRole("heading", { name: "Manage your portfolio." }),
  ).toBeVisible();

  // Verify removed hero/eyebrow/sublabel text on auth page
  await expect(page.getByText("Protected Management Access")).toHaveCount(0);
  await expect(page.getByText("Owner authentication")).toHaveCount(0);
  await expect(page.getByText(/view visitor analytics/i)).toHaveCount(0);
  await expect(
    page.getByText(
      "Sign in with your owner email and password to update sections and upload a new resume or portrait.",
    ),
  ).toBeVisible();

  await page.screenshot({
    path: `.qa/${testInfo.project.name}-owner-login.png`,
  });

  // Check WCAG A/AA accessibility on Owner Login page
  const loginAxe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(loginAxe.violations).toEqual([]);

  // 2. Reject invalid credentials
  await page.getByLabel(/Owner email address/).fill("estoce.orlan@gmail.com");
  await page.getByLabel(/^Password/).fill("wrong-password");
  await page.getByRole("button", { name: "Sign in to dashboard" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Invalid email or password.",
  );

  // 3. Sign in with valid owner credentials
  await page.getByLabel(/^Password/).fill("Orlandone2026!");
  await page.getByRole("button", { name: "Sign in to dashboard" }).click();

  await expect(page).toHaveURL(/\/owner$/);
  await expect(
    page.getByRole("heading", { name: "Portfolio Management" }),
  ).toBeVisible();

  // Verify header shows "Hello Orlan" and no longer shows "Persistent API Store"
  await expect(page.locator(".owner-header .brand-caption")).toContainText(
    "Hello",
  );
  await expect(page.locator(".owner-header .brand-caption")).toContainText(
    "Orlan",
  );
  await expect(page.getByText("Persistent API Store")).toHaveCount(0);

  // 4. Verify Visitor Analytics (Daily, Weekly, Monthly, Yearly comparisons & Single-Day lookup)
  await expect(
    page.getByRole("heading", { name: "Audience & Traffic Comparisons" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Daily \(Today\)/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Weekly \(7 Days\)/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Monthly \(30 Days\)/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Yearly \(365 Days\)/ }),
  ).toBeVisible();

  const timeframeGroup = page.getByRole("group", {
    name: "Select comparison timeframe",
  });
  await timeframeGroup.getByRole("button", { name: "Weekly" }).click();
  await expect(
    page.getByRole("heading", { name: "Weekly Visitor Comparison" }),
  ).toBeVisible();

  await timeframeGroup.getByRole("button", { name: "Monthly" }).click();
  await expect(
    page.getByRole("heading", { name: "Monthly Visitor Comparison" }),
  ).toBeVisible();

  await timeframeGroup.getByRole("button", { name: "Yearly" }).click();
  await expect(
    page.getByRole("heading", { name: "Yearly Visitor Comparison" }),
  ).toBeVisible();

  await page
    .getByRole("group", { name: "Select chart visualization type" })
    .getByRole("button", { name: "Area / Line" })
    .click();
  await expect(
    page.getByRole("img", { name: "Visitor comparison chart" }),
  ).toBeVisible();

  await expect(
    page.getByRole("heading", { name: "Visitor Count on a Specific Day" }),
  ).toBeVisible();
  await expect(page.getByLabel("Select date to inspect visitors")).toBeVisible();

  await page.screenshot({
    path: `.qa/${testInfo.project.name}-owner-analytics.png`,
    fullPage: true,
  });

  // Check WCAG A/AA accessibility on Owner Dashboard
  const dashboardAxe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(dashboardAxe.violations).toEqual([]);

  // 5. Edit Profile/Tagline & Status, confirm Save dialog, and verify on live portfolio
  await page.getByRole("button", { name: /Profile, Hero & Resume/ }).click();
  await page.getByRole("button", { name: "Edit Header, Tagline & Occupation", exact: true }).click();
  await page.screenshot({
    path: `.qa/${testInfo.project.name}-owner-profile.png`,
    fullPage: true,
  });

  const taglineInput = page.getByLabel("Hero Tagline / Main Headline");
  await taglineInput.fill(
    "Building reliable software with live owner management.",
  );
  await page
    .getByLabel("Availability Status Badge")
    .fill("Available for full-stack roles");

  await page.getByRole("dialog", { name: "Edit Header, Tagline & Occupation", exact: true })
    .getByRole("button", { name: "Save changes", exact: true }).click();
  const saveDialog = page.getByRole("dialog", {
    name: "Save portfolio changes?",
  });
  await expect(saveDialog).toBeVisible();
  await saveDialog.getByRole("button", { name: "Confirm save" }).click();

  await expect(
    page.getByText("All portfolio changes have been saved and published live."),
  ).toBeVisible();

  // 6. Click View Portfolio, confirm dialog, and verify session stays active
  await page.getByRole("link", { name: "View Portfolio" }).click();
  const viewDialog = page.getByRole("dialog", {
    name: "Return to live portfolio?",
  });
  await expect(viewDialog).toBeVisible();
  await viewDialog
    .getByRole("button", { name: "Confirm view portfolio" })
    .click();

  await expect(
    page.getByRole("heading", {
      name: "Building reliable software with live owner management.",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Available for full-stack roles").first(),
  ).toBeVisible();

  // 7. Tap the footer copyright notice again — should go directly to /owner without reauthentication!
  const footerTriggerAgain = page.getByRole("link", {
    name: "© 2026 Orlandone Estoce. All rights reserved.",
  });
  await footerTriggerAgain.scrollIntoViewIfNeeded();
  await footerTriggerAgain.click();

  await expect(page).toHaveURL(/\/owner$/);
  await expect(
    page.getByRole("heading", { name: "Portfolio Management" }),
  ).toBeVisible();

  // 8. Restore baseline defaults via confirmation dialog
  await page.getByRole("button", { name: "Restore defaults" }).click();
  const restoreDialog = page.getByRole("dialog", {
    name: "Restore baseline defaults?",
  });
  await expect(restoreDialog).toBeVisible();
  await restoreDialog.getByRole("button", { name: "Confirm restore" }).click();
  await expect(
    page.getByText(
      "Portfolio content has been restored to baseline defaults.",
    ),
  ).toBeVisible();

  // 9. Sign out via confirmation dialog and verify session is cleared
  await page
    .getByRole("button", { name: "Sign out of owner dashboard" })
    .click();
  const logoutDialog = page.getByRole("dialog", {
    name: "Sign out of dashboard?",
  });
  await expect(logoutDialog).toBeVisible();
  await logoutDialog.getByRole("button", { name: "Confirm sign out" }).click();

  await expect(page).toHaveURL(/\/owner\/login$/);
  await expect(
    page.getByRole("heading", { name: "Manage your portfolio." }),
  ).toBeVisible();

  // 10. Verify backend-level authentication rate limit (5 attempts per hour)
  const testClientIp = `198.51.100.${testInfo.project.name === "desktop" ? 10 : 20}`;
  for (let attempt = 1; attempt <= 5; attempt++) {
    const res = await page.request.post("/api/auth/login", {
      headers: { "X-Forwarded-For": testClientIp },
      data: { email: "estoce.orlan@gmail.com", password: "wrong-password" },
    });
    expect(res.status()).toBe(401);
    expect(res.headers()["x-ratelimit-limit"]).toBe("5");
    expect(res.headers()["x-ratelimit-remaining"]).toBe(String(5 - attempt));
  }
  const sixthAttempt = await page.request.post("/api/auth/login", {
    headers: { "X-Forwarded-For": testClientIp },
    data: { email: "estoce.orlan@gmail.com", password: "Orlandone2026!" },
  });
  expect(sixthAttempt.status()).toBe(429);
  const rateLimitBody = await sixthAttempt.json();
  expect(rateLimitBody.error).toContain("maximum 5 authentication attempts per hour");
});
