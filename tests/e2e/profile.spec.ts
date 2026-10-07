import { readFileSync } from "node:fs";
import { parsePageCopy } from "../../src/content/page-copy";
import { expect, test } from "@playwright/test";

const copy = parsePageCopy(readFileSync("data/page.ja.yaml", "utf8"));

test.describe("draft profile", () => {
  test("renders the Japanese home without horizontal overflow", async ({ page }) => {
    await page.goto("./");
    if (process.env.PROFILE_MODE === "release") await expect(page.getByText(copy.footer.draft)).toHaveCount(0);
    else await expect(page.getByText(copy.footer.draft)).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", process.env.PROFILE_MODE === "release" ? "index, follow" : "noindex, nofollow");
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");
    await expect(page.getByRole("heading", { name: "Rjochi", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      await page.evaluate(() => window.innerWidth),
    );
  });

  test("renders the Japanese route with language metadata", async ({ page }) => {
    await page.goto("en/");
    await expect(page).toHaveTitle("Rjochi");
    await expect(page.getByRole("link", { name: "日本語" })).toHaveAttribute("href", process.env.PROFILE_MODE === "release" ? "/Rjochi/" : "/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("keeps the Japanese alternate route available", async ({ page }) => {
    await page.goto("ja/");
    await expect(page.locator("html")).toHaveAttribute("lang", "ja");
    await expect(page.getByRole("heading", { name: "Rjochi", exact: true })).toBeVisible();
    await expect(page.locator("[data-signature] canvas")).toBeVisible();
    await expect(page.getByRole("heading", { name: copy.explanation.title })).toBeVisible();
  });

  test("switches the precomputed clearance path", async ({ page }) => {
    await page.goto("en/");
    const select = page.getByRole("combobox", { name: "Clearance preset" });
    await select.selectOption("0.3");
    await expect(page.getByText("Clearance preset 0.3 demo-units")).toBeVisible();
    await expect(page.locator("#planning-poster #refined-path")).toHaveAttribute("points", /,/);
  });

  test("loads the interactive demo only after launch", async ({ page }) => {
    await page.goto("en/");
    await expect(page.locator("[data-demo-runtime]")).toBeVisible();
    await expect(page.locator("[data-demo-runtime] svg")).toBeVisible();
    await page.getByRole("button", { name: "3D Play" }).click();
    await expect(page.getByRole("button", { name: "3D Pause" })).toBeVisible();
    await expect(page.locator("[data-demo-runtime] canvas")).toBeVisible();
  });

  test("auto-plays the static hero once", async ({ page }) => {
    await page.goto("en/");
    await expect(page.getByText("Playback running")).toBeVisible();
    await expect(page.getByRole("button", { name: "3D Play" })).toBeVisible();
    await expect(page.getByText("Playback complete")).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("button", { name: "3D Play", exact: true })).toBeVisible();
  });
});