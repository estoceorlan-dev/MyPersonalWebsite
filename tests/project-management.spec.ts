import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { rawProjects } from "../src/data/projects";
import type { PortfolioContent } from "../src/context/PortfolioContext";

// Exercise the editor and save/load flow without changing the connected database.
test.beforeEach(async ({ context }) => {
  let content: Partial<PortfolioContent> = {
    projects: structuredClone(rawProjects),
  };
  await context.addInitScript(() => {
    localStorage.setItem("portfolio-owner-token-v1", "project-editor-test");
  });
  await context.route("**/api/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === "/api/portfolio") {
      if (route.request().method() === "PUT") {
        content = route.request().postDataJSON().content;
      }
      await route.fulfill({ json: { content, storageMode: "memory" } });
    } else if (pathname === "/api/auth/me") {
      await route.fulfill({ json: { owner: { email: "owner@example.com" } } });
    } else {
      await route.fulfill({ status: 503, json: { error: "Not used in this test" } });
    }
  });
});

test("creates multiple repository links, removes extras, and keeps them after saving and reloading", async ({ page }) => {
  await page.goto("/owner");
  await page.getByRole("button", { name: "04 Projects" }).click();
  await expect(page.getByLabel("Project Title", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Add new project" }).click();
  await expect(page.getByRole("dialog", { name: "Add new project", exact: true })).toBeVisible();
  await page.getByLabel("Project Title", { exact: true }).fill("Split App");
  await page.getByLabel("Repository URL", { exact: true }).fill("https://github.com/example/frontend");
  await page.getByRole("button", { name: "Add another repository" }).click();
  await page.getByLabel("Repository 2 Label").fill("Backend repository");
  await page.getByLabel("Repository 2 URL").fill(" https://github.com/example/backend ");
  await page.getByRole("button", { name: "Add another repository" }).click();
  await page.getByLabel("Repository 3 URL").fill("https://github.com/example/shared");
  await page.getByRole("button", { name: "Add another repository" }).click();
  await page.getByLabel("Repository 4 URL").fill("https://github.com/example/remove-me");
  await page.getByRole("button", { name: "Remove repository 4" }).click();
  await expect(page.getByLabel("Repository 4 URL")).toHaveCount(0);
  // An unused added row should not create an empty link on the public portfolio.
  await page.getByRole("button", { name: "Add another repository" }).click();

  await page.getByRole("dialog", { name: "Add new project", exact: true })
    .getByRole("button", { name: "Save changes", exact: true }).click();
  await page.getByRole("button", { name: "Confirm save" }).click();
  await expect(page.getByText("All portfolio changes have been saved and published live.")).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: "04 Projects" }).click();
  await page.getByRole("button", { name: "Edit Split App", exact: true }).click();
  await expect(page.getByLabel("Project Title", { exact: true })).toHaveValue("Split App");
  await expect(page.getByLabel("Repository 2 Label")).toHaveValue("Backend repository");
  await expect(page.getByLabel("Repository 2 URL")).toHaveValue("https://github.com/example/backend");
  await expect(page.getByLabel("Repository 3 Label")).toHaveValue("View repository 3");
  await expect(page.getByLabel("Repository 4 URL")).toHaveCount(0);
  await page.getByRole("button", { name: "Done", exact: true }).click();

  // Previously stored secondary repositories remain editable as well.
  await page.getByRole("button", { name: "Edit Blue vs. Yellow", exact: true }).click();
  await expect(page.getByLabel("Repository 2 Label")).toHaveValue("Backend repository");
  await page.getByLabel("Repository 2 Label").fill("Game backend");
  await page.getByRole("dialog", { name: "Edit project", exact: true })
    .getByRole("button", { name: "Save changes", exact: true }).click();
  await page.getByRole("button", { name: "Confirm save" }).click();
  await expect(page.getByText("All portfolio changes have been saved and published live.")).toBeVisible();

  await page.goto("/#projects");
  await expect(page.locator(".project-card").first()).toContainText("Split App");
  await page.getByRole("button", { name: "View Split App details" }).click();
  const dialog = page.getByRole("dialog", { name: "Split App", exact: true });
  await expect(dialog.getByRole("link", { name: "View repository", exact: true })).toHaveAttribute("href", "https://github.com/example/frontend");
  await expect(dialog.getByRole("link", { name: "Backend repository", exact: true })).toHaveAttribute("href", "https://github.com/example/backend");
  await expect(dialog.getByRole("link", { name: "View repository 3", exact: true })).toHaveAttribute("href", "https://github.com/example/shared");
  await expect(dialog.locator('a[href=""]')).toHaveCount(0);
});

test("reorders projects with drag handles and arrow buttons, preserves the selected editor, and publishes the order", async ({ page, context, isMobile }, testInfo) => {
  await page.goto("/owner");
  await page.getByRole("button", { name: "04 Projects" }).click();
  const list = page.getByRole("list", { name: "Project display order" });
  const rows = list.getByRole("listitem");
  await expect(rows.first()).toContainText("VitalySync");
  await expect(page.getByRole("button", { name: "Move VitalySync up", exact: true })).toBeDisabled();
  await expect(rows.last().getByRole("button", { name: /down$/ })).toBeDisabled();
  await page.getByRole("button", { name: "Edit JCE Management System", exact: true }).click();
  await page.getByLabel("Project Title", { exact: true }).fill("JCE Management System Updated");
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.getByLabel("Project Title", { exact: true })).toHaveCount(0);
  await expect(list.locator(".owner-project-cover")).toHaveCount(rawProjects.length);
  await expect(list.locator(".owner-project-cover img").first()).toBeVisible();

  async function dragProject(from: number, to: number) {
    const handle = rows.nth(from).getByRole("button", { name: /^Drag to reorder/ });
    await handle.scrollIntoViewIfNeeded();
    const source = (await handle.boundingBox())!;
    const target = (await rows.nth(to).boundingBox())!;
    const x = source.x + source.width / 2;
    const startY = source.y + source.height / 2;
    const endY = from < to ? target.y + target.height - 5 : target.y + 5;
    if (isMobile) {
      const session = await context.newCDPSession(page);
      await session.send("Input.dispatchTouchEvent", {
        type: "touchStart", touchPoints: [{ x, y: startY }],
      });
      for (let step = 1; step <= 10; step++) {
        await session.send("Input.dispatchTouchEvent", {
          type: "touchMove", touchPoints: [{ x, y: startY + (endY - startY) * step / 10 }],
        });
      }
      await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await session.detach();
    } else {
      await page.mouse.move(x, startY);
      await page.mouse.down();
      await page.mouse.move(x, endY, { steps: 10 });
      await page.mouse.up();
    }
  }
  await dragProject(0, 1);
  await expect(rows.first()).toContainText("JCE Management System Updated");
  await expect(rows.nth(1)).toContainText("VitalySync");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await dragProject(1, 0);
  await expect(rows.first()).toContainText("VitalySync");
  await expect(rows.nth(1)).toContainText("JCE Management System Updated");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  const moveUp = page.getByRole("button", { name: "Move JCE Management System Updated up", exact: true });
  await moveUp.focus();
  await page.keyboard.press("Enter");
  await expect(rows.first()).toContainText("JCE Management System Updated");
  await page.getByRole("button", { name: "Edit JCE Management System Updated", exact: true }).click();
  await expect(page.getByLabel("Project Title", { exact: true })).toHaveValue("JCE Management System Updated");
  await page.getByRole("button", { name: "Move project later", exact: true }).click();
  await expect(page.getByLabel("Project Title", { exact: true })).toHaveValue("JCE Management System Updated");
  await page.getByRole("button", { name: "Move project earlier", exact: true }).click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await expect(rows.first()).toContainText("JCE Management System Updated");

  const overflow = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    return {
      width,
      scrollWidth: document.documentElement.scrollWidth,
      elements: [...document.querySelectorAll("body *")]
        .filter((element) => element.getBoundingClientRect().right > width + 1)
        .map((element) => `${element.tagName}.${element.className}`)
        .slice(0, 20),
    };
  });
  expect(overflow.scrollWidth, JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.width);
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(axe.violations).toEqual([]);
  await page.screenshot({ path: `.qa/${testInfo.project.name}-project-order.png`, fullPage: true });
  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  const darkAxe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(darkAxe.violations).toEqual([]);

  await page.getByRole("button", { name: /Save changes/ }).click();
  await page.getByRole("button", { name: "Confirm save" }).click();
  await expect(page.getByText("All portfolio changes have been saved and published live.")).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "04 Projects" }).click();
  await expect(page.getByRole("list", { name: "Project display order" }).getByRole("listitem").first()).toContainText("JCE Management System Updated");
  await page.goto("/#projects");
  await expect(page.locator(".project-card")).toHaveCount(6);
  await expect(page.locator(".project-card").first()).toContainText("JCE Management System Updated");
  await expect(page.locator(".project-card").nth(1)).toContainText("VitalySync");
  await page.getByRole("group", { name: "Filter projects" })
    .getByRole("button", { name: "Mobile Applications", exact: true }).click();
  await expect(page.locator(".project-card").first()).toContainText("JCE Management System Updated");
  await expect(page.locator(".project-card").nth(1)).toContainText("VitalySync");
});

test("opens the full editor only in a dialog and uses the same dialog for new projects", async ({ page }, testInfo) => {
  await page.goto("/owner");
  await page.getByRole("button", { name: "04 Projects" }).click();
  const rows = page.getByRole("list", { name: "Project display order" }).getByRole("listitem");
  await expect(rows).toHaveCount(rawProjects.length);
  await expect(page.getByLabel("Project Title", { exact: true })).toHaveCount(0);

  const editButton = page.getByRole("button", { name: "Edit VitalySync", exact: true });
  await editButton.click();
  const editor = page.getByRole("dialog", { name: "Edit project", exact: true });
  await expect(editor).toBeVisible();
  await expect(editor.getByLabel("Project Title", { exact: true })).toHaveValue("VitalySync");
  await expect(editor.getByLabel("Repository URL", { exact: true })).toHaveValue(rawProjects[0]!.repository);
  await expect(editor.getByText("Project Cover / Logo Image", { exact: true })).toBeVisible();
  await expect(editor.getByLabel("Live Demo URL")).toHaveCount(1);
  await expect(editor.locator(".owner-gallery-item")).toHaveCount(9);

  const close = editor.getByRole("button", { name: "Close dialog", exact: true });
  const save = editor.getByRole("button", { name: "Save changes", exact: true });
  await save.focus();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(save).toBeFocused();
  expect(await editor.evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth)).toBe(true);

  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(axe.violations).toEqual([]);
  await editor.evaluate((dialog) => dialog.scrollTo(0, 0));
  await editor.screenshot({ path: `.qa/${testInfo.project.name}-project-editor.png` });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(editButton).toBeFocused();

  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await page.getByRole("button", { name: "Add new project", exact: true }).click();
  const create = page.getByRole("dialog", { name: "Add new project", exact: true });
  await expect(create.getByLabel("Project Title", { exact: true })).toHaveValue("New Portfolio Project");
  await expect(create.getByLabel("Repository URL", { exact: true })).toHaveValue("");
  await expect(create.getByLabel("Primary Category", { exact: true })).toHaveValue("Web Development");
  await expect(create.getByRole("button", { name: "Add another repository" })).toBeVisible();
  const darkAxe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(darkAxe.violations).toEqual([]);
  await create.getByRole("button", { name: "Done", exact: true }).click();
  await expect(rows).toHaveCount(rawProjects.length + 1);
  await expect(rows.first()).toContainText("New Portfolio Project");

  await page.getByRole("button", { name: "Edit New Portfolio Project", exact: true }).click();
  await page.getByRole("dialog", { name: "Edit project", exact: true })
    .getByRole("button", { name: "Delete project", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(rows).toHaveCount(rawProjects.length);
  await expect(page.getByLabel("Project Title", { exact: true })).toHaveCount(0);
});

test("shows a working Visit button only for projects with a demo URL", async ({ page, context }, testInfo) => {
  await context.route("https://florea-haven.vercel.app/**", (route) => route.fulfill({
    contentType: "text/html", body: "<title>Project demo</title><p>Demo destination</p>",
  }));
  await page.goto("/#projects");
  const florea = page.locator(".project-card").filter({ has: page.getByRole("button", { name: "View Floréa Haven details", exact: true }) });
  const visit = florea.getByRole("link", { name: "Visit Floréa Haven live demo", exact: true });
  await expect(visit).toHaveAttribute("href", "https://florea-haven.vercel.app");
  await expect(visit).toHaveAttribute("target", "_blank");
  await expect(visit).toHaveAttribute("rel", "noopener noreferrer");
  const popupPromise = page.waitForEvent("popup");
  await visit.click();
  const popup = await popupPromise;
  await expect(popup).toHaveTitle("Project demo");
  await popup.close();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  const jce = page.locator(".project-card").filter({ has: page.getByRole("button", { name: "View JCE Management System details", exact: true }) });
  await expect(jce.getByRole("link", { name: /^Visit / })).toHaveCount(0);
  await page.goto("/owner");
  await page.getByRole("button", { name: "04 Projects", exact: true }).click();
  await page.getByRole("button", { name: "Edit JCE Management System", exact: true }).click();
  await page.getByLabel("Live Demo URL", { exact: true }).fill("https://example.com/jce-demo");
  await page.getByRole("dialog", { name: "Edit project", exact: true })
    .getByRole("button", { name: "Save changes", exact: true }).click();
  await page.getByRole("button", { name: "Confirm save", exact: true }).click();
  await expect(page.getByText("All portfolio changes have been saved and published live.")).toBeVisible();
  await page.goto("/#projects");
  const jceVisit = jce.getByRole("link", { name: "Visit JCE Management System live demo", exact: true });
  await expect(jceVisit).toHaveAttribute("href", "https://example.com/jce-demo");
  const footer = (await jce.locator(".project-card-footer").boundingBox())!;
  const button = (await jceVisit.boundingBox())!;
  expect(Math.abs(footer.x + footer.width - button.x - button.width)).toBeLessThan(2);
  expect(Math.abs(footer.y + footer.height - button.y - button.height)).toBeLessThan(2);
  await jce.screenshot({ path: `.qa/${testInfo.project.name}-project-visit.png` });
  const axe = await new AxeBuilder({ page }).include(".projects-grid")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(axe.violations).toEqual([]);
});

test("drags gallery images across the grid, renames them, and saves the carousel order", async ({ page, context, isMobile }, testInfo) => {
  test.setTimeout(60_000);
  await page.goto("/owner");
  await page.getByRole("button", { name: "04 Projects", exact: true }).click();
  await page.getByRole("button", { name: "Edit VitalySync", exact: true }).click();
  const editor = page.getByRole("dialog", { name: "Edit project", exact: true });
  const list = editor.getByRole("list", { name: "Project gallery images", exact: true });
  const rows = list.getByRole("listitem");
  await expect(rows).toHaveCount(9);
  await rows.nth(1).getByRole("textbox").fill("Daily overview");
  await expect(rows.nth(1).getByRole("img")).toHaveAttribute("alt", "VitalySync — Daily overview");
  await expect(rows.first().getByRole("button", { name: /earlier$/ })).toBeDisabled();
  await expect(rows.last().getByRole("button", { name: /later$/ })).toBeDisabled();

  async function dragImage(from: number, to: number) {
    await list.evaluate((element) => {
      const dialog = element.closest("dialog")!;
      const header = dialog.querySelector(".modal-top")!.getBoundingClientRect();
      dialog.scrollTop += element.getBoundingClientRect().top - header.bottom - 12;
    });
    const handle = rows.nth(from).getByRole("button", { name: /^Drag to reorder image/ });
    const source = (await handle.boundingBox())!;
    const target = (await rows.nth(to).boundingBox())!;
    const startX = source.x + source.width / 2;
    const startY = source.y + source.height / 2;
    const endX = target.x + target.width / 2;
    const endY = target.y + target.height / 2;
    if (isMobile) {
      const session = await context.newCDPSession(page);
      await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: startX, y: startY }] });
      for (let step = 1; step <= 12; step++) {
        await session.send("Input.dispatchTouchEvent", {
          type: "touchMove", touchPoints: [{ x: startX + (endX - startX) * step / 12, y: startY + (endY - startY) * step / 12 }],
        });
      }
      await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await session.detach();
    } else {
      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(endX, endY, { steps: 12 });
      await page.mouse.up();
    }
  }

  await dragImage(1, 0);
  await expect(rows.first().getByRole("textbox")).toHaveValue("Daily overview");
  await expect(rows.nth(1).getByRole("textbox")).toHaveValue("Welcome Page");
  // On mobile the third image is on the next row; on desktop it is another column.
  await dragImage(0, 2);
  await expect(rows.nth(2).getByRole("textbox")).toHaveValue("Daily overview");
  await dragImage(2, 0);
  await expect(rows.first().getByRole("textbox")).toHaveValue("Daily overview");
  const move = rows.first().getByRole("button", { name: /later$/ });
  await move.focus();
  await page.keyboard.press("Enter");
  await expect(rows.nth(1).getByRole("textbox")).toHaveValue("Daily overview");
  await rows.nth(1).getByRole("button", { name: /earlier$/ }).click();
  await rows.first().getByRole("textbox").fill("Wellness dashboard");
  await expect(rows.first().getByRole("img")).toHaveAttribute("alt", "VitalySync — Wellness dashboard");
  await expect(rows.nth(1).getByRole("textbox")).toHaveValue("Welcome Page");
  await rows.last().getByRole("button", { name: "Remove slide 9", exact: true }).click();
  await expect(rows).toHaveCount(8);
  expect(await editor.evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth)).toBe(true);
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(axe.violations).toEqual([]);
  await list.screenshot({ path: `.qa/${testInfo.project.name}-project-gallery.png` });

  await editor.getByRole("button", { name: "Save changes", exact: true }).click();
  await page.getByRole("button", { name: "Confirm save", exact: true }).click();
  await expect(page.getByText("All portfolio changes have been saved and published live.")).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "04 Projects", exact: true }).click();
  await page.getByRole("button", { name: "Edit VitalySync", exact: true }).click();
  await expect(rows.first().getByRole("textbox")).toHaveValue("Wellness dashboard");
  await expect(rows.nth(1).getByRole("textbox")).toHaveValue("Welcome Page");
  await editor.getByRole("button", { name: "Done", exact: true }).click();
  await page.goto("/#projects");
  await page.getByRole("button", { name: "View VitalySync details", exact: true }).click();
  const carousel = page.getByRole("region", { name: "VitalySync interface screenshots", exact: true });
  await carousel.hover();
  await expect(carousel.locator(".carousel-count")).toHaveText("01 / 08");
  await expect(carousel.locator(".carousel-label")).toHaveText("Wellness dashboard");
  await expect(carousel.locator(".carousel-slide.is-active img")).toHaveAttribute("alt", "VitalySync — Wellness dashboard");
  await carousel.getByRole("button", { name: "Next screenshot", exact: true }).click();
  await expect(carousel.locator(".carousel-label")).toHaveText("Welcome Page");
});
