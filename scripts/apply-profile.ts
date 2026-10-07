import { access, cp, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const generatedReadme = resolve(root, "build/profile/README.md");
const generatedAssets = resolve(root, "build/profile/assets/generated");
const targetReadme = resolve(root, "README.md");
const targetAssets = resolve(root, "assets/generated");

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  if (!(await exists(generatedReadme)) || !(await exists(generatedAssets))) {
    throw new Error("Generated profile is missing. Run npm run profile:render first.");
  }

  if (process.env.PROFILE_APPLY !== "1") {
    console.log("Dry run: would update README.md and assets/generated/.");
    console.log("Set PROFILE_APPLY=1 only after reviewing build/profile/README.md.");
    return;
  }

  await mkdir(targetAssets, { recursive: true });
  await cp(generatedReadme, targetReadme);
  await cp(generatedAssets, targetAssets, { recursive: true });
  console.log("Applied generated README and Hero assets.");
}

void main();