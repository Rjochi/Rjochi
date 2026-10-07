import { readFileSync } from "node:fs";
import { parsePageCopy } from "../../src/content/page-copy";
import { expect, test } from "@playwright/test";

const copy = parsePageCopy(readFileSync("data/page.ja.yaml", "utf8"));

test.describe("Japanese signature experience", () => {
  test("autoplays one scene, pauses in place, resumes and restarts", async ({ page }) => {
    await page.goto("./");
    const scene = page.locator("[data-signature]");
    await expect(scene).toHaveAttribute("data-renderer", "webgl");
    await expect(scene).toHaveAttribute("data-animation", "playing");
    await expect(scene).toHaveAttribute("data-stage", "playback", { timeout: 8000 });
    await page.getByRole("button", { name: copy.demo.controls.pause, exact: true }).click();
    await expect(scene).toHaveAttribute("data-animation", "paused");
    await page.waitForTimeout(150);
    const paused = await page.locator("canvas").screenshot();
    await page.waitForTimeout(200);
    expect((await page.locator("canvas").screenshot()).equals(paused)).toBe(true);
    await page.getByRole("button", { name: copy.demo.controls.play, exact: true }).click();
    await expect(scene).toHaveAttribute("data-stage", "playback");
    await page.waitForTimeout(350);
    expect((await page.locator("canvas").screenshot()).equals(paused)).toBe(false);
    await page.getByRole("button", { name: copy.demo.controls.restart, exact: true }).click();
    await expect(scene).toHaveAttribute("data-stage", "search");
    await expect(page.locator("canvas")).toHaveCount(1);
  });

  for (const width of [320, 390, 768, 1440]) {
    test(`fits ${width}px and defaults to dark even with a light OS preference`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
      await page.goto("./");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await page.locator("body").evaluate((e) => getComputedStyle(e).backgroundColor)).toBe("rgb(25, 27, 30)");
      await expect(page.locator("[data-scene-poster] svg")).toBeVisible();
    });
  }

  test("reduced motion keeps the poster and defers Three.js until explicit play", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const requests: string[] = [];
    page.on("request", (request) => requests.push(request.url()));
    await page.goto("./");
    await expect(page.getByText(copy.demo.status.reduced_motion)).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(0);
    expect(requests.some((url) => /signature-viewer|three(?:\.module|\.core)?[.\-/]/.test(url))).toBe(false);
    await page.getByRole("button", { name: copy.demo.controls.play, exact: true }).click();
    await expect(page.locator("[data-signature]")).toHaveAttribute("data-renderer", "webgl");
    await expect(page.getByRole("button", { name: copy.demo.controls.pause, exact: true })).toBeVisible();
  });

  test("retains useful content and a curved poster without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(test.info().project.use.baseURL ?? "http://127.0.0.1:4321");
    await expect(page.getByRole("heading", { name: "Rjochi", exact: true })).toBeVisible();
    await expect(page.locator("[data-scene-poster] svg")).toBeVisible();
    await expect(page.locator("[data-playback-controls]")).toBeHidden();
    await expect(page.locator("[data-scene-poster] path[d*='Q']")).toHaveCount(1);
    await context.close();
  });

  test("WebGL failure preserves the poster and offers a retry", async ({ page }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
        if (type.includes("webgl")) return null;
        return Reflect.apply(original, this, [type, ...args]);
      } as typeof original;
    });
    await page.goto("./");
    await expect(page.locator("[data-signature]")).toHaveAttribute("data-renderer", "static");
    await expect(page.locator("[data-scene-poster]")).toHaveCSS("opacity", "1");
    await expect(page.getByRole("button", { name: copy.demo.controls.retry })).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(0);
  });

  test("context loss returns to the poster and can recover", async ({ page }) => {
    await page.goto("./");
    await expect(page.locator("canvas")).toHaveCount(1);
    await page.locator("canvas").evaluate((canvas: HTMLCanvasElement) => {
      const extension = canvas.getContext("webgl2")?.getExtension("WEBGL_lose_context");
      if (!extension) throw new Error("Context-loss testing extension unavailable");
      extension.loseContext();
    });
    await expect(page.locator("[data-signature]")).toHaveAttribute("data-renderer", "static");
    await expect(page.locator("[data-scene-poster]")).toHaveCSS("opacity", "1");
    await page.getByRole("button", { name: copy.demo.controls.retry }).click();
    await expect(page.locator("[data-signature]")).toHaveAttribute("data-renderer", "webgl");
    await expect(page.locator("canvas")).toHaveCount(1);
  });

  test("does not continue requesting frames when the scene is offscreen", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 640 });
    await page.addInitScript(() => {
      (window as unknown as { demoFrames: number }).demoFrames = 0;
      const original = window.requestAnimationFrame;
      window.requestAnimationFrame = (callback) => original.call(window, (time) => {
        (window as unknown as { demoFrames: number }).demoFrames++;
        callback(time);
      });
    });
    await page.goto("./");
    await page.locator("[data-signature]").scrollIntoViewIfNeeded();
    await expect(page.locator("[data-signature]")).toHaveAttribute("data-renderer", "webgl");
    await page.locator("footer").scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const stopped = await page.evaluate(() => (window as unknown as { demoFrames: number }).demoFrames);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => (window as unknown as { demoFrames: number }).demoFrames)).toBe(stopped);
    await page.locator("[data-signature]").scrollIntoViewIfNeeded();
    await expect.poll(() => page.evaluate(() => (window as unknown as { demoFrames: number }).demoFrames)).toBeGreaterThan(stopped);
  });
});
