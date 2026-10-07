import { readFileSync } from "node:fs";
import { defineConfig } from "astro/config";
import { parseProfileDraft } from "./src/schema/validate";
const result = parseProfileDraft(readFileSync(new URL("./data/profile.yaml", import.meta.url), "utf8"));
if (!result.ok) throw new Error("Invalid data/profile.yaml in Astro configuration");
export default defineConfig({
  site: result.value.site.origin ?? undefined,
  base: process.env.PROFILE_MODE === "release" ? result.value.site.base_path ?? "/" : "/",
  trailingSlash: "always",
});
