import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { loadContent, loadScene } from "../src/content/load";
import { findPath } from "../src/demo/path";
import { renderHeroSvg } from "../src/render/hero";

const outputDirectory = resolve(process.cwd(), "build/profile");
const assetDirectory = resolve(outputDirectory, "assets/generated");
const scene = loadScene();
const path = findPath(scene, scene.clearance_presets[1] ?? scene.clearance_presets[0]);

if (path.status !== "ok") throw new Error("Signature scene did not produce a valid path");

async function main(): Promise<void> {
  await mkdir(assetDirectory, { recursive: true });
  for (const theme of ["dark", "light"] as const) {
    await writeFile(resolve(assetDirectory, `hero-wide-${theme}.svg`), renderHeroSvg(scene, path, { theme }));
    await writeFile(resolve(assetDirectory, `hero-compact-${theme}.svg`), renderHeroSvg(scene, path, { theme, compact: true }));
  }

  const content = loadContent();
  const template = await readFile(resolve(process.cwd(), "templates/readme.md"), "utf8");
  const projects = content.projects.length > 0
    ? content.projects.map((project) => {
      const title = project.title[content.profile.site.primary_locale] ?? project.title.ja ?? project.title.en ?? project.id;
      const description = project.description?.[content.profile.site.primary_locale] ?? project.description?.ja ?? project.description?.en ?? "";
      const brief = content.profile.site.primary_locale === "ja" ? description.split("。")[0] + (description ? "。" : "") : description;
      const link = project.url ? `[${title}](${project.url})` : title;
      const reference = project.reference ? ` [${project.reference.label}](${project.reference.url})` : "";
      return `- **${link}** — ${brief}${reference}`;
    }).join("\n")
    : "No reviewed projects are published yet.";
  const snapshot = content.snapshot.asOfDateUtc && content.snapshot.repositories.length > 0
    ? `## Public repository snapshot\n\nSnapshot as of ${content.snapshot.asOfDateUtc} (UTC).`
    : "";
  const locale = content.profile.site.primary_locale;
  const site = content.profile.site;
  const profilePage = site.origin && site.base_path ? `[詳しくはこちら](${new URL(site.base_path, site.origin).href})` : "";
  const focusText = content.focus[locale] ?? content.focus.ja ?? content.focus.en;
  const values: Record<string, string> = {
    displayName: content.profile.displayName ?? "Profile in progress",
    headline: content.profile.headline.en ?? content.profile.headline.ja ?? "Robotics / Autonomous Systems",
    profilePage,
    summary: content.profile.summary[locale] ?? content.profile.summary.ja ?? content.profile.summary.en ?? "",
    focusSection: focusText ? `\n## 現在の関心\n\n${focusText}\n` : "",
    team: content.profile.team ? `${content.profile.site.primary_locale === "ja" ? "所属チーム" : "Team"}: [${content.profile.team.name}](${content.profile.team.url})` : "",
    draftNotice: content.mode === "draft" ? "> **DRAFT / SAMPLE DATA** — owner review is required before publication." : "",
    projects,
    focus: content.focus.en ?? content.focus.ja ?? "Content awaiting owner review.",
    snapshot,
  };
  const readme = template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => values[key] ?? "");
  await writeFile(resolve(outputDirectory, "README.md"), readme.trimEnd() + "\n");
}

void main();
