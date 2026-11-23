import { test, expect } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import type { PortfolioContent } from "../src/context/PortfolioContext";
import { personal } from "../src/data/personal";

// Keep every edit, upload, and credential request isolated from the live backend.
test.beforeEach(async ({ context }) => {
  let content: Partial<PortfolioContent> = {};
  await context.addInitScript(() => {
    localStorage.setItem("portfolio-owner-token-v1", "owner-editor-test");
  });
  await context.route("**/api/**", async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    if (pathname === "/api/portfolio") {
      if (request.method() === "PUT") content = request.postDataJSON().content;
      await route.fulfill({ json: { content, storageMode: "memory" } });
    } else if (pathname === "/api/auth/me") {
      await route.fulfill({ json: { owner: { email: "owner@example.com" } } });
    } else if (pathname === "/api/auth/credentials") {
      await route.fulfill({ json: { token: "updated-test-token", owner: { email: request.postDataJSON().email } } });
    } else if (pathname === "/api/media" && request.method() === "POST") {
      const { filename, mimeType } = request.postDataJSON();
      await route.fulfill({ json: { id: "test-upload", url: `/test-upload/${filename}`, filename, mimeType } });
    } else {
      await route.fulfill({ status: 503, json: { error: "Not used in this test" } });
    }
  });
  await context.route("**/test-upload/**", (route) => route.fulfill({
    contentType: "image/png",
    body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jO/8AAAAASUVORK5CYII=", "base64"),
  }));
});

async function save(page: Page, editor?: Locator) {
  await (editor ?? page).getByRole("button", { name: /^Save changes/ }).click();
  await page.getByRole("dialog", { name: "Save portfolio changes?", exact: true })
    .getByRole("button", { name: "Confirm save", exact: true }).click();
  await expect(page.getByText("All portfolio changes have been saved and published live.")).toBeVisible();
}

const sectionCases = [
  { tab: "01 Profile, Hero & Resume", title: "Header, Tagline & Occupation", field: "Full Name", value: "Test Portfolio Owner" },
  { tab: "01 Profile, Hero & Resume", title: "Hero Portrait", field: "Portrait Frame Caption", value: "Updated portrait caption" },
  { tab: "01 Profile, Hero & Resume", title: "Downloadable Resume (PDF)", field: "Active Resume Path / URL", value: "/updated-resume.pdf" },
  { tab: "02 About & Occupation", title: "About Section & Occupation", field: "Section Title", value: "An updated introduction" },
  { tab: "02 About & Occupation", title: "Spoken Languages", field: "Languages (comma-separated)", value: "English, Filipino" },
  { tab: "03 Skills & Toolkit", title: "Skills Section Heading", field: "Section Title", value: "Updated toolkit" },
  { tab: "04 Projects", title: "Projects Section Heading", field: "Section Title", value: "Updated project collection" },
  { tab: "05 Experience & Education", title: "Experience Section & Callout", field: "Section Title", value: "Updated experience" },
  { tab: "06 Credentials & Certs", title: "Credentials Section Heading", field: "Section Title", value: "Updated credentials" },
  { tab: "07 Contact & Security", title: "Contact Section & Social Profiles", field: "Public Contact Email", value: "public@example.com" },
];

test("edits all profile and section settings in dialogs and preserves them across tabs and reloads", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/owner");
  for (const entry of sectionCases) {
    await page.getByRole("button", { name: entry.tab, exact: true }).click();
    await expect(page.locator("input, textarea, select")).toHaveCount(0);
    await page.getByRole("button", { name: `Edit ${entry.title}`, exact: true }).click();
    const dialog = page.getByRole("dialog", { name: `Edit ${entry.title}`, exact: true });
    await dialog.getByLabel(entry.field, { exact: true }).fill(entry.value);
    await dialog.getByRole("button", { name: "Done", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  await save(page);
  await page.reload();
  for (const entry of sectionCases) {
    await page.getByRole("button", { name: entry.tab, exact: true }).click();
    await page.getByRole("button", { name: `Edit ${entry.title}`, exact: true }).click();
    const dialog = page.getByRole("dialog", { name: `Edit ${entry.title}`, exact: true });
    await expect(dialog.getByLabel(entry.field, { exact: true })).toHaveValue(entry.value);
    await dialog.getByRole("button", { name: "Done", exact: true }).click();
  }
});

const collectionCases = [
  { tab: "02 About & Occupation", add: "Add paragraph", field: /^Paragraph \d+$/, initial: "New biography paragraph.", value: "New biography content", title: `Biography paragraph ${personal.about.length + 1}`, remove: /^Remove paragraph \d+$/ },
  { tab: "02 About & Occupation", add: "Add focus item", field: /^Focus Title \d+$/, initial: "New focus area", value: "Updated focus area", title: "Updated focus area", remove: /^Remove item$/ },
  { tab: "03 Skills & Toolkit", add: "Add skill category", field: /^Category Title$/, initial: "New Skill Category", value: "Updated skill group", title: "Updated skill group", remove: /^Delete Updated skill group$/ },
  { tab: "05 Experience & Education", add: "Add education entry", field: /^Title \/ Role$/, initial: "Degree or Program", value: "Updated degree", title: "Updated degree", remove: /^Delete Updated degree$/ },
  { tab: "05 Experience & Education", add: "Add experience entry", field: /^Title \/ Role$/, initial: "Role / Position Title", value: "Updated experience role", title: "Updated experience role", remove: /^Delete Updated experience role$/ },
  { tab: "06 Credentials & Certs", add: "Add eligibility", field: /^Title$/, initial: "New Professional Eligibility", value: "Updated eligibility", title: "Updated eligibility", remove: /^Delete Updated eligibility$/ },
  { tab: "06 Credentials & Certs", add: "Add certification", field: /^Certificate Title$/, initial: "New Certification", value: "Updated certification", title: "Updated certification", remove: /^Delete Updated certification$/ },
];

for (const entry of collectionCases) {
  test(`${entry.add} opens its editor and supports saving, reopening, and deleting`, async ({ page }) => {
    await page.goto("/owner");
    await page.getByRole("button", { name: entry.tab, exact: true }).click();
    await expect(page.getByLabel(entry.field)).toHaveCount(0);
    await page.getByRole("button", { name: entry.add, exact: true }).click();
    const create = page.getByRole("dialog", { name: entry.add, exact: true });
    await expect(create).toBeVisible();
    await expect(create.getByLabel(entry.field)).toHaveValue(entry.initial);
    await create.getByLabel(entry.field).fill(entry.value);
    if (entry.add === "Add skill category") {
      await create.getByRole("button", { name: `Move ${entry.value} up`, exact: true }).click();
      await expect(create.getByLabel(entry.field)).toHaveValue(entry.value);
    }
    await page.getByRole("dialog").getByRole("button", { name: "Done", exact: true }).click();
    const trigger = page.getByRole("button", { name: `Edit ${entry.title}`, exact: true });
    await expect(trigger).toBeVisible();
    await expect(page.getByLabel(entry.field)).toHaveCount(0);
    await trigger.click();
    await expect(page.getByRole("dialog").getByLabel(entry.field)).toHaveValue(entry.value);
    await save(page, page.getByRole("dialog"));
    await page.reload();
    await page.getByRole("button", { name: entry.tab, exact: true }).click();
    await trigger.click();
    const edit = page.getByRole("dialog", { name: `Edit ${entry.title}`, exact: true });
    await expect(edit.getByLabel(entry.field)).toHaveValue(entry.value);
    await edit.getByRole("button", { name: entry.remove }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(trigger).toHaveCount(0);
    await save(page);
    await page.reload();
    await page.getByRole("button", { name: entry.tab, exact: true }).click();
    await expect(trigger).toHaveCount(0);
  });
}

test("keeps portrait, resume, and certificate uploads working inside their dialogs", async ({ page }) => {
  await page.goto("/owner");
  for (const entry of [
    { tab: "01 Profile, Hero & Resume", trigger: "Edit Hero Portrait", input: "#upload-portrait-input", filename: "portrait.png", type: "image/png" },
    { tab: "01 Profile, Hero & Resume", trigger: "Edit Downloadable Resume (PDF)", input: "#upload-resume-input", filename: "resume.pdf", type: "application/pdf" },
    { tab: "06 Credentials & Certs", trigger: "Edit Introduction to Modern AI", input: 'input[id^="cert-img-upload-"]', filename: "certificate.png", type: "image/png" },
    { tab: "06 Credentials & Certs", trigger: "Edit Introduction to Modern AI", input: 'input[id^="cert-pdf-upload-"]', filename: "certificate.pdf", type: "application/pdf" },
  ]) {
    await page.getByRole("button", { name: entry.tab, exact: true }).click();
    await page.getByRole("button", { name: entry.trigger, exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.locator(entry.input).setInputFiles({ name: entry.filename, mimeType: entry.type, buffer: Buffer.from("upload fixture") });
    await expect(dialog.getByRole("status")).toContainText(`Uploaded "${entry.filename}"`);
    await dialog.getByRole("button", { name: "Done", exact: true }).click();
  }
  const savedRequest = page.waitForRequest((request) => new URL(request.url()).pathname === "/api/portfolio" && request.method() === "PUT");
  await save(page);
  const content = (await savedRequest).postDataJSON().content as PortfolioContent;
  expect(content.personal.portraitUrl).toBe("/test-upload/portrait.png");
  expect(content.personal.resumeUrl).toBe("/test-upload/resume.pdf");
  expect(content.certifications[0]!.image).toBe("/test-upload/certificate.png");
  expect(content.certifications[0]!.pdfUrl).toBe("/test-upload/certificate.pdf");
});

test("publishes, replaces, and removes an eligibility certificate picture", async ({ page }) => {
  const title = "Civil Service Professional Eligibility";
  const preview = page.getByRole("button", { name: `View ${title} certificate picture` });
  for (const filename of ["eligibility.png", "replacement.png", null]) {
    await page.goto("/owner");
    await page.getByRole("button", { name: "06 Credentials & Certs", exact: true }).click();
    await page.getByRole("button", { name: `Edit ${title}`, exact: true }).click();
    const dialog = page.getByRole("dialog");
    if (filename) {
      await dialog.getByLabel("Certificate picture", { exact: true }).setInputFiles({
        name: filename, mimeType: "image/png", buffer: Buffer.from("upload fixture"),
      });
      await expect(dialog.getByRole("img", { name: `${title} certificate preview` })).toHaveAttribute("src", `/test-upload/${filename}`);
    } else {
      await dialog.getByRole("button", { name: "Remove picture" }).click();
    }
    await save(page, dialog);
    await page.goto("/#certifications");
    await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
    if (filename) {
      await preview.click();
      const picture = page.getByRole("dialog", { name: title }).getByRole("img", { name: `${title} certificate`, exact: true });
      await expect(picture).toHaveAttribute("src", `/test-upload/${filename}`);
      await expect(picture).toBeVisible();
      await expect.poll(() => picture.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
    } else {
      await expect(preview).toHaveCount(0);
    }
  }
});

test("publishes PDF and file attachments and removes them individually", async ({ page }) => {
  const title = "Civil Service Professional Eligibility";
  const files = [
    { name: "eligibility.pdf", mimeType: "application/pdf" },
    { name: "supporting-notes.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  ];
  async function openEntry() {
    await page.goto("/owner");
    await page.getByRole("button", { name: "06 Credentials & Certs" }).click();
    await page.getByRole("button", { name: `Edit ${title}`, exact: true }).click();
    return page.getByRole("dialog");
  }
  const editor = await openEntry();
  for (const file of files) {
    const request = page.waitForRequest((req) => req.url().endsWith("/api/media") && req.method() === "POST");
    await editor.getByLabel("Attach a PDF or other file").setInputFiles({ ...file, buffer: Buffer.from("test document") });
    expect((await request).postDataJSON().attachment).toBe(true);
    await expect(editor.getByRole("link", { name: file.name })).toBeVisible();
  }
  await save(page, editor);
  await page.goto("/#certifications");
  const links = page.getByRole("list", { name: "Certificate files" });
  for (const file of files) {
    await expect(links.getByRole("link", { name: file.name })).toHaveAttribute("href", `/test-upload/${file.name}`);
  }
  await openEntry();
  await editor.getByRole("button", { name: "Remove eligibility.pdf" }).click();
  await save(page, editor);
  await page.goto("/#certifications");
  await expect(links.getByRole("link", { name: "supporting-notes.docx" })).toBeVisible();
  await expect(links.getByRole("link", { name: "eligibility.pdf" })).toHaveCount(0);
});

test("keeps account credential updates separate from publishing portfolio content", async ({ page }) => {
  const contentWrites: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/portfolio" && request.method() === "PUT") contentWrites.push(request.url());
  });
  await page.goto("/owner");
  await page.getByRole("button", { name: "07 Contact & Security", exact: true }).click();
  await page.getByRole("button", { name: "Edit Owner Sign-In Email & Password", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Edit Owner Sign-In Email & Password", exact: true });
  await expect(dialog.getByRole("button", { name: "Save changes", exact: true })).toHaveCount(0);
  await dialog.getByLabel("Owner Login Email", { exact: true }).fill("updated-owner@example.com");
  await dialog.getByLabel("Current Password (required)", { exact: true }).fill("test-current-password");
  await dialog.getByLabel("New Password (leave blank to keep current password)", { exact: true }).fill("test-next-password");
  const updateRequest = page.waitForRequest("**/api/auth/credentials");
  await dialog.getByRole("button", { name: "Update login credentials", exact: true }).click();
  await expect(dialog.getByRole("alert")).toHaveText("Owner login credentials updated.");
  expect((await updateRequest).postDataJSON()).toEqual({ currentPassword: "test-current-password", email: "updated-owner@example.com", newPassword: "test-next-password" });
  expect(contentWrites).toEqual([]);
  await dialog.getByRole("button", { name: "Done", exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem("portfolio-owner-email-v1"))).toBe("updated-owner@example.com");
});

test("summary pages and modal editors support keyboard focus, narrow screens, and both themes", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  await page.goto("/owner");
  for (const tab of ["01 Profile, Hero & Resume", "02 About & Occupation", "03 Skills & Toolkit", "04 Projects", "05 Experience & Education", "06 Credentials & Certs", "07 Contact & Security"]) {
    await page.getByRole("button", { name: tab, exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(result.violations).toEqual([]);
  }
  await page.getByRole("button", { name: "03 Skills & Toolkit", exact: true }).click();
  await page.screenshot({ path: `.qa/${testInfo.project.name}-skills-summary.png`, fullPage: true });
  const trigger = page.getByRole("button", { name: "Edit Programming", exact: true });
  await trigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Edit Programming", exact: true });
  const close = dialog.getByRole("button", { name: "Close dialog", exact: true });
  const saveButton = dialog.getByRole("button", { name: "Save changes", exact: true });
  await saveButton.focus();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(saveButton).toBeFocused();
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  const light = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(light.violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await trigger.click();
  const dark = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(dark.violations).toEqual([]);
  await dialog.screenshot({ path: `.qa/${testInfo.project.name}-skills-editor.png` });
});
