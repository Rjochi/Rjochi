import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  parseDemoSceneDraft,
  parseFocusDraft,
  parseProfileDraft,
  parseProjectsDraft,
  parsePublicSnapshot,
} from "../schema/validate";
import type { DemoSceneDraft } from "../schema/types";
import { normalizeContent, type ContentMode, type NormalizedContent } from "./normalize";

function readSource(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

function unwrap<T>(result: { ok: true; value: T } | { ok: false; issues: readonly { path: string; message: string }[] }, source: string): T {
  if (result.ok) return result.value;
  const details = result.issues.map(({ path, message }) => `${path}: ${message}`).join("; ");
  throw new Error(`Invalid ${source}: ${details}`);
}

export function loadContent(mode: ContentMode = "draft"): NormalizedContent {
  const profile = unwrap(parseProfileDraft(readSource("data/profile.yaml")), "profile.yaml");
  const projects = unwrap(parseProjectsDraft(readSource("data/projects.yaml")), "projects.yaml");
  const focus = unwrap(parseFocusDraft(readSource("data/focus.yaml")), "focus.yaml");
  const snapshot = unwrap(parsePublicSnapshot(readSource("data/public-snapshot.json")), "public-snapshot.json");

  return unwrap(normalizeContent(profile, projects, focus, snapshot, mode), "publication data");
}

export function loadScene(): DemoSceneDraft {
  return unwrap(parseDemoSceneDraft(readSource("data/scenes/signature.yaml")), "signature.yaml");
}