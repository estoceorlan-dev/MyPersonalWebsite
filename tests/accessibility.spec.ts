import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("has no automated WCAG A/AA violations on the page or project dialog", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const scan = () =>
    new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
  const pageResults = await scan();
  expect(
    pageResults.violations.map(({ id, nodes }) => ({
      id,
      nodes: nodes.map(({ target, failureSummary }) => ({
        target,
        failureSummary,
      })),
    })),
  ).toEqual([]);
  await page.getByRole("button", { name: "View VitalySync details" }).click();
  await expect(
    page.getByRole("dialog", { name: "VitalySync", exact: true }),
  ).toBeVisible();
  const dialogResults = await scan();
  expect(
    dialogResults.violations.map(({ id, nodes }) => ({
      id,
      nodes: nodes.map(({ target, failureSummary }) => ({
        target,
        failureSummary,
      })),
    })),
  ).toEqual([]);
});
