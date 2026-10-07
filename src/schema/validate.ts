import { parseDocument } from "yaml";
import type {
  DemoSceneDraft,
  FocusDraft,
  LocalizedText,
  ProfileDraft,
  ProjectsDraft,
  PublicSnapshotDraft,
} from "./types";

export interface ValidationIssue {
  path: string;
  message: string;
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; issues: readonly ValidationIssue[] };

function issue(path: string, message: string): ValidationIssue {
  return { path, message };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isLocalizedText(value: unknown): value is LocalizedText {
  return (
    isRecord(value) &&
    isNullableString(value.en) &&
    isNullableString(value.ja)
  );
}

function isVec3(value: unknown): value is readonly [number, number, number] {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every((coordinate) => typeof coordinate === "number" && Number.isFinite(coordinate))
  );
}

export function parseYamlObject(source: string): ValidationResult<Record<string, unknown>> {
  const document = parseDocument(source, { uniqueKeys: true });
  if (document.errors.length > 0 || document.warnings.length > 0) {
    return {
      ok: false,
      issues: [...document.errors, ...document.warnings].map((error) =>
        issue("$", error.message),
      ),
    };
  }

  const value: unknown = document.toJS();
  if (!isRecord(value)) {
    return { ok: false, issues: [issue("$", "expected a mapping at the document root")] };
  }

  return { ok: true, value };
}

export function parseProfileDraft(source: string): ValidationResult<ProfileDraft> {
  const parsed = parseYamlObject(source);
  if (!parsed.ok) return parsed;

  const value = parsed.value;
  const profile = value.profile;
  const site = value.site;
  const presentation = value.presentation;
  const issues: ValidationIssue[] = [];

  if (value.schema_version !== 1) issues.push(issue("schema_version", "must be 1"));
  if (!isRecord(profile)) issues.push(issue("profile", "must be a mapping"));
  if (!isRecord(site)) issues.push(issue("site", "must be a mapping"));
  if (!isRecord(presentation)) issues.push(issue("presentation", "must be a mapping"));

  if (isRecord(profile)) {
    if (!isNullableString(profile.display_name)) issues.push(issue("profile.display_name", "must be a string or null"));
    if (!isNullableString(profile.github_username)) issues.push(issue("profile.github_username", "must be a string or null"));
    if (!isLocalizedText(profile.headline)) issues.push(issue("profile.headline", "must contain en and ja strings or null"));
    if (!isLocalizedText(profile.summary)) issues.push(issue("profile.summary", "must contain en and ja strings or null"));
    if (profile.team !== undefined && profile.team !== null) {
      if (!isRecord(profile.team) || typeof profile.team.name !== "string" || !profile.team.name.trim()) {
        issues.push(issue("profile.team.name", "must be a non-empty string"));
      }
      if (!isRecord(profile.team) || typeof profile.team.url !== "string" || !/^https:\/\/[^\s]+$/.test(profile.team.url)) {
        issues.push(issue("profile.team.url", "must be an HTTPS URL"));
      }
    }
    if (!isNullableString(profile.public_contact)) issues.push(issue("profile.public_contact", "must be a string or null"));
    if (typeof profile.reviewed_by_owner !== "boolean") issues.push(issue("profile.reviewed_by_owner", "must be boolean"));
  }

  if (isRecord(site)) {
    if (!isNullableString(site.origin)) issues.push(issue("site.origin", "must be a string or null"));
    if (!isNullableString(site.base_path)) issues.push(issue("site.base_path", "must be a string or null"));
    if (site.primary_locale !== "en" && site.primary_locale !== "ja") issues.push(issue("site.primary_locale", "must be en or ja"));
    if (!Array.isArray(site.enabled_locales) || site.enabled_locales.some((locale) => locale !== "en" && locale !== "ja")) {
      issues.push(issue("site.enabled_locales", "must contain only en or ja"));
    }
    if (typeof site.deployment_enabled !== "boolean") issues.push(issue("site.deployment_enabled", "must be boolean"));
  }

  if (isRecord(presentation)) {
    if (presentation.theme_default !== "system" && presentation.theme_default !== "light" && presentation.theme_default !== "dark") {
      issues.push(issue("presentation.theme_default", "must be system, light, or dark"));
    }
    if (presentation.readme_motion !== "once" && presentation.readme_motion !== "off") issues.push(issue("presentation.readme_motion", "must be once or off"));
    if (typeof presentation.allow_third_party_tracking !== "boolean") issues.push(issue("presentation.allow_third_party_tracking", "must be boolean"));
  }

  return issues.length > 0
    ? { ok: false, issues }
    : { ok: true, value: value as unknown as ProfileDraft };
}

export function parseDemoSceneDraft(source: string): ValidationResult<DemoSceneDraft> {
  const parsed = parseYamlObject(source);
  if (!parsed.ok) return parsed;

  const value = parsed.value;
  const workspace = value.workspace;
  const issues: ValidationIssue[] = [];

  if (value.schema_version !== 1) issues.push(issue("schema_version", "must be 1"));
  if (typeof value.id !== "string" || value.id.length === 0) issues.push(issue("id", "must be a non-empty string"));
  if (value.status !== "draft") issues.push(issue("status", "must be draft until reviewed"));
  if (value.units !== "demo-units") issues.push(issue("units", "must be demo-units"));
  if (!isRecord(workspace) || !isVec3(workspace.min) || !isVec3(workspace.max)) issues.push(issue("workspace", "must contain min and max Vec3 values"));
  if (typeof value.grid_step !== "number" || value.grid_step <= 0) issues.push(issue("grid_step", "must be positive"));
  if (typeof value.robot_radius !== "number" || value.robot_radius <= 0) issues.push(issue("robot_radius", "must be positive"));
  if (!Array.isArray(value.clearance_presets) || value.clearance_presets.some((clearance) => typeof clearance !== "number" || clearance < 0)) {
    issues.push(issue("clearance_presets", "must contain non-negative numbers"));
  }
  if (!isVec3(value.start)) issues.push(issue("start", "must be a finite Vec3"));
  if (!isVec3(value.goal)) issues.push(issue("goal", "must be a finite Vec3"));
  if (!Array.isArray(value.obstacles)) issues.push(issue("obstacles", "must be an array"));

  if (Array.isArray(value.obstacles)) {
    value.obstacles.forEach((obstacle, index) => {
      if (!isRecord(obstacle) || !isVec3(obstacle.min) || !isVec3(obstacle.max)) {
        issues.push(issue(`obstacles[${index}]`, "must contain finite min and max Vec3 values"));
      }
    });
  }

  return issues.length > 0
    ? { ok: false, issues }
    : { ok: true, value: value as unknown as DemoSceneDraft };
}

export function parseProjectsDraft(source: string): ValidationResult<ProjectsDraft> {
  const parsed = parseYamlObject(source);
  if (!parsed.ok) return parsed;

  const value = parsed.value;
  const issues: ValidationIssue[] = [];
  if (value.schema_version !== 1) issues.push(issue("schema_version", "must be 1"));
  if (!Array.isArray(value.projects)) issues.push(issue("projects", "must be an array"));
  if (Array.isArray(value.projects)) {
    value.projects.forEach((project, index) => {
      if (!isRecord(project)) {
        issues.push(issue(`projects[${index}]`, "must be a mapping"));
        return;
      }
      if (typeof project.id !== "string" || project.id.length === 0) issues.push(issue(`projects[${index}].id`, "must be a non-empty string"));
      if (typeof project.publish !== "boolean") issues.push(issue(`projects[${index}].publish`, "must be boolean"));
      if (typeof project.reviewed_by_owner !== "boolean") issues.push(issue(`projects[${index}].reviewed_by_owner`, "must be boolean"));
      if (!isLocalizedText(project.title)) issues.push(issue(`projects[${index}].title`, "must contain en and ja strings or null"));
      if (project.description !== undefined && !isLocalizedText(project.description)) issues.push(issue(`projects[${index}].description`, "must contain en and ja strings or null"));
      for (const field of ["repository", "branch"] as const) {
        if (project[field] !== undefined && (typeof project[field] !== "string" || project[field].length === 0)) issues.push(issue(`projects[${index}].${field}`, "must be a non-empty string"));
      }
      if (project.url !== undefined && (typeof project.url !== "string" || !/^https:\/\/github\.com\/[^/]+\/[^/]+\/tree\/[^\s]+$/.test(project.url))) issues.push(issue(`projects[${index}].url`, "must be a GitHub branch URL"));
      if (project.reference !== undefined && (!isRecord(project.reference) || typeof project.reference.label !== "string" || project.reference.label.length === 0 || typeof project.reference.url !== "string" || !/^https:\/\/[^\s]+$/.test(project.reference.url))) issues.push(issue(`projects[${index}].reference`, "must contain a label and HTTPS URL"));
    });
  }

  return issues.length > 0
    ? { ok: false, issues }
    : { ok: true, value: value as unknown as ProjectsDraft };
}

export function parseFocusDraft(source: string): ValidationResult<FocusDraft> {
  const parsed = parseYamlObject(source);
  if (!parsed.ok) return parsed;

  const value = parsed.value;
  const issues: ValidationIssue[] = [];
  if (value.schema_version !== 1) issues.push(issue("schema_version", "must be 1"));
  if (!isLocalizedText(value.focus)) issues.push(issue("focus", "must contain en and ja strings or null"));

  return issues.length > 0
    ? { ok: false, issues }
    : { ok: true, value: value as unknown as FocusDraft };
}

export function parsePublicSnapshot(source: string): ValidationResult<PublicSnapshotDraft> {
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch (error) {
    return { ok: false, issues: [issue("$", error instanceof Error ? error.message : "invalid JSON")] };
  }

  if (!isRecord(value)) return { ok: false, issues: [issue("$", "expected an object at the document root")] };
  const issues: ValidationIssue[] = [];
  if (value.schemaVersion !== 1) issues.push(issue("schemaVersion", "must be 1"));
  if (value.asOfDateUtc !== null && typeof value.asOfDateUtc !== "string") issues.push(issue("asOfDateUtc", "must be a date string or null"));
  if (!Array.isArray(value.repositories)) issues.push(issue("repositories", "must be an array"));

  return issues.length > 0
    ? { ok: false, issues }
    : { ok: true, value: value as unknown as PublicSnapshotDraft };
}
