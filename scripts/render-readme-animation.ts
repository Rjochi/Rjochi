import { chromium } from "@playwright/test";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { DEMO_TIMING } from "../src/demo/motion";

// Capture the actual Three.js renderer and shared path, not an unrelated illustration.
// Requires a running Astro dev server and Python 3 with Pillow.
async function main(): Promise<void> {
const baseURL = process.env.ANIMATION_BASE_URL ?? "http://127.0.0.1:4321/";
const output = resolve("build/profile/assets/generated/profile-demo.gif");
const frames = await mkdtemp(join(tmpdir(), "profile-demo-"));
const browser = await chromium.launch({ args: ["--enable-unsafe-swiftshader"] });
try {
  const page = await browser.newPage({ viewport: { width: 1040, height: 1100 }, reducedMotion: "reduce", deviceScaleFactor: 1 });
  await page.goto(baseURL);
  await page.evaluate(async () => {
    const { mountSignature } = await import(/* @vite-ignore */ new URL("/src/client/signature-viewer.ts", location.href).href);
    const host = document.querySelector<HTMLElement>("[data-scene-canvas]")!;
    const data = JSON.parse(document.querySelector("[data-signature-data]")!.textContent!);
    const renderer = mountSignature(host, data, () => { throw new Error("WebGL capture context lost"); });
    (window as unknown as { captureFrame: (seconds: number) => void }).captureFrame = renderer.render;
    document.querySelector<HTMLElement>("[data-signature]")!.dataset.renderer = "webgl";
  });
  const fps = 12;
  for (let i = 0; i < Math.ceil(DEMO_TIMING.duration * fps); i++) {
    await page.evaluate((seconds) => (window as unknown as { captureFrame: (seconds: number) => void }).captureFrame(seconds), i / fps);
    await page.locator("[data-scene-canvas] canvas").screenshot({ path: join(frames, `${String(i).padStart(4, "0")}.png`) });
  }
  await mkdir(resolve("build/profile/assets/generated"), { recursive: true });
  const encoded = spawnSync("python3", ["-c", `
from PIL import Image
from pathlib import Path
import sys
paths = sorted(Path(sys.argv[1]).glob('*.png'))
images = [Image.open(p).convert('RGB').resize((768, 416), Image.Resampling.LANCZOS) for p in paths]
samples = [images[i] for i in range(0, len(images), 24)]
strip = Image.new('RGB', (768, 416 * len(samples)))
for i, frame in enumerate(samples): strip.paste(frame, (0, i * 416))
palette = strip.quantize(colors=128)
frames = [frame.quantize(palette=palette, dither=Image.Dither.NONE) for frame in images]
# Repeat indefinitely, as requested by the owner.
frames[0].save(sys.argv[2], save_all=True, append_images=frames[1:], duration=[80, 80, 90] * (len(frames)//3) + [80]*(len(frames)%3), optimize=True, disposal=1, loop=0)
print(f'Generated {len(frames)} frames: {Path(sys.argv[2]).stat().st_size} bytes')
`, frames, output], { encoding: "utf8" });
  if (encoded.status !== 0) throw new Error(encoded.stderr);
  console.log(encoded.stdout.trim());
} finally {
  await browser.close();
  await rm(frames, { recursive: true, force: true });
}

}
void main();
