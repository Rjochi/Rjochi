import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { findPath, isCollisionFreeSegment } from "../../src/demo/path";
import { renderHeroSvg } from "../../src/render/hero";
import { fetchPublicSnapshot } from "../../src/github/public";
import type { DemoSceneDraft, ProfileDraft } from "../../src/schema/types";
import { normalizeProfile, normalizeContent } from "../../src/content/normalize";
import {
  parseDemoSceneDraft,
  parseFocusDraft,
  parseProfileDraft,
  parseProjectsDraft,
  parsePublicSnapshot,
} from "../../src/schema/validate";

describe("draft contract", () => {
  it("previews selected projects without granting publication approval", () => {
    const profile = parseProfileDraft(readFileSync(new URL("../../data/profile.yaml", import.meta.url), "utf8"));
    const projects = parseProjectsDraft(readFileSync(new URL("../../data/projects.yaml", import.meta.url), "utf8"));
    expect(profile.ok && projects.ok).toBe(true);
    if (!profile.ok || !projects.ok) return;
    const readyProfile = { ...profile.value, profile: { ...profile.value.profile, reviewed_by_owner: true }, site: { ...profile.value.site, origin: "https://example.com", base_path: "/" } };
    const focus = { schema_version: 1 as const, focus: { en: null, ja: null } };
    const snapshot = { schemaVersion: 1 as const, asOfDateUtc: null, repositories: [] };
    const unreviewedProjects = { ...projects.value, projects: projects.value.projects.map(project => ({ ...project, reviewed_by_owner: false })) };
    const draft = normalizeContent(readyProfile, unreviewedProjects, focus, snapshot, "draft");
    expect(draft.ok).toBe(true);
    if (draft.ok) expect(draft.value.projects.length).toBe(projects.value.projects.filter(project => project.publish).length);
    const release = normalizeContent(readyProfile, unreviewedProjects, focus, snapshot, "release");
    expect(release.ok).toBe(false);
    if (!release.ok) expect(release.issues.some(issue => issue.path.includes("reviewed_by_owner"))).toBe(true);
  });

  it("keeps profile publication disabled until owner review", () => {
    const profile: Pick<ProfileDraft["profile"], "reviewed_by_owner"> = {
      reviewed_by_owner: false,
    };
    const site: Pick<ProfileDraft["site"], "deployment_enabled"> = {
      deployment_enabled: false,
    };

    expect(profile.reviewed_by_owner).toBe(false);
    expect(site.deployment_enabled).toBe(false);
  });

  it("uses demo units for the initial scene", () => {
    const scene: Pick<DemoSceneDraft, "units" | "status"> = {
      units: "demo-units",
      status: "draft",
    };

    expect(scene.units).toBe("demo-units");
    expect(scene.status).toBe("draft");
  });

  it("parses the draft profile shape", () => {
    const result = parseProfileDraft(`
schema_version: 1
profile:
  display_name: null
  github_username: null
  headline: { en: "Robotics", ja: "ロボティクス" }
  summary: { en: null, ja: null }
  public_contact: null
  reviewed_by_owner: false
site:
  origin: null
  base_path: null
  primary_locale: en
  enabled_locales: [en, ja]
  deployment_enabled: false
presentation:
  theme_default: system
  readme_motion: once
  allow_third_party_tracking: false
`);

    expect(result.ok).toBe(true);
  });

  it("preserves explicit review and deployment flags for release checks", () => {
    const result = parseProfileDraft(`
schema_version: 1
profile:
  display_name: "Unreviewed"
  github_username: null
  headline: { en: "Robotics", ja: "ロボティクス" }
  summary: { en: null, ja: null }
  public_contact: null
  reviewed_by_owner: true
site:
  origin: https://example.com
  base_path: /
  primary_locale: en
  enabled_locales: [en, ja]
  deployment_enabled: true
presentation:
  theme_default: system
  readme_motion: once
  allow_third_party_tracking: false
`);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.profile.reviewed_by_owner).toBe(true);
      expect(result.value.site.deployment_enabled).toBe(true);
    }
  });

  it("rejects malformed scene coordinates", () => {
    const result = parseDemoSceneDraft(`
schema_version: 1
id: broken
status: draft
units: demo-units
workspace:
  min: [0, 0]
  max: [10, 6, 4]
grid_step: 0.25
robot_radius: 0.18
clearance_presets: [0.1]
start: [0, 0, 0]
goal: [1, 1, 1]
obstacles: []
`);

    expect(result.ok).toBe(false);
  });

  it("finds and simplifies a collision-free path for every clearance preset", () => {
    const source = readFileSync(new URL("../../data/scenes/signature.yaml", import.meta.url), "utf8");
    const result = parseDemoSceneDraft(source);
    expect(result.ok).toBe(true);
    if (result.ok) {
      for (const clearance of result.value.clearance_presets) {
        const path = findPath(result.value, clearance);
        expect(path.status).toBe("ok");
        expect(path.rawPath.length).toBeGreaterThan(1);
        expect(path.simplifiedPath.length).toBeLessThanOrEqual(path.rawPath.length);
        for (let index = 1; index < path.simplifiedPath.length; index += 1) {
          expect(isCollisionFreeSegment(result.value, path.simplifiedPath[index - 1], path.simplifiedPath[index], clearance)).toBe(true);
        }
      }
    }
  });

  it("renders the static hero from the computed path", () => {
    const source = readFileSync(new URL("../../data/scenes/signature.yaml", import.meta.url), "utf8");
    const result = parseDemoSceneDraft(source);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const path = findPath(result.value, result.value.clearance_presets[1]);
      const svg = renderHeroSvg(result.value, path);
      expect(svg.startsWith("<svg")).toBe(true);
      expect(svg).toContain("SEARCH / REFINE / PLAYBACK");
      expect(svg).toContain("GEOMETRY CHECKED");
      expect(renderHeroSvg(result.value, path, { compact: true, theme: "light" })).toContain('viewBox="0 0 480 420"');
    }
  });

  it("normalizes only public repository snapshot fields", async () => {
    const responses = [
      { ok: true, status: 200, json: async () => ({ private: false, visibility: "public", html_url: "https://github.com/example/demo" }) },
      { ok: true, status: 200, json: async () => ({ sha: "abc123", html_url: "https://github.com/example/demo/commit/abc123", commit: { author: { date: "2026-10-07T00:00:00Z" } } }) },
    ];
    const snapshot = await fetchPublicSnapshot(
      [{ projectId: "demo", owner: "example", name: "demo", branch: "main" }],
      "2026-10-07",
      async () => responses.shift() as Response,
    );

    expect(snapshot.repositories).toEqual([{
      projectId: "demo",
      publicRepositoryUrl: "https://github.com/example/demo",
      branch: "main",
      headSha: "abc123",
      headUrl: "https://github.com/example/demo/commit/abc123",
      headCommittedAt: "2026-10-07T00:00:00Z",
      visibilityChecked: true,
    }]);
  });

  it("rejects a private repository before fetching its commit", async () => {
    await expect(fetchPublicSnapshot(
      [{ projectId: "private", owner: "example", name: "private", branch: "main" }],
      "2026-10-07",
      async () => ({ ok: true, status: 200, json: async () => ({ private: true }) } as Response),
    )).rejects.toThrow("not publicly verifiable");
  });

  it("accepts the checked-in draft inputs", () => {
    const profileSource = readFileSync(new URL("../../data/profile.yaml", import.meta.url), "utf8");
    const sceneSource = readFileSync(new URL("../../data/scenes/signature.yaml", import.meta.url), "utf8");
    const projectsSource = readFileSync(new URL("../../data/projects.yaml", import.meta.url), "utf8");
    const focusSource = readFileSync(new URL("../../data/focus.yaml", import.meta.url), "utf8");
    const snapshotSource = readFileSync(new URL("../../data/public-snapshot.json", import.meta.url), "utf8");

    expect(parseProfileDraft(profileSource).ok).toBe(true);
    expect(parseDemoSceneDraft(sceneSource).ok).toBe(true);
    expect(parseProjectsDraft(projectsSource).ok).toBe(true);
    expect(parseFocusDraft(focusSource).ok).toBe(true);
    expect(parsePublicSnapshot(snapshotSource).ok).toBe(true);
  });

  it("keeps partially completed profile data usable in draft mode", () => {
    const result = parseProfileDraft(readFileSync(new URL("../../data/profile.yaml", import.meta.url), "utf8"));
    expect(result.ok).toBe(true);
    if (result.ok) {
      const normalized = normalizeProfile(result.value, "draft");
      expect(normalized.ok).toBe(true);
      if (normalized.ok) expect(normalized.value.displayName).toBe("Rjochi");
    }
  });

  it("rejects unreviewed profile data in release mode", () => {
    const result = parseProfileDraft(readFileSync(new URL("../../data/profile.yaml", import.meta.url), "utf8"));
    expect(result.ok).toBe(true);
    if (result.ok) {
      const normalized = normalizeProfile({ ...result.value, profile: { ...result.value.profile, reviewed_by_owner: false } }, "release");
      expect(normalized.ok).toBe(false);
      if (!normalized.ok) {
        expect(normalized.issues.some((item) => item.path === "profile.reviewed_by_owner")).toBe(true);
      }
    }
  });
});