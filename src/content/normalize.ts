import type {
  FocusDraft,
  ProfileDraft,
  ProjectsDraft,
  PublicSnapshotDraft,
} from "../schema/types";
import type { ValidationIssue, ValidationResult } from "../schema/validate";

export type ContentMode = "draft" | "release";

export interface NormalizedProfile {
  mode: ContentMode;
  displayName: string | null;
  githubUsername: string | null;
  headline: ProfileDraft["profile"]["headline"];
  summary: ProfileDraft["profile"]["summary"];
  team: NonNullable<ProfileDraft["profile"]["team"]> | null;
  publicContact: string | null;
  site: ProfileDraft["site"];
}

export interface NormalizedProject {
  id: string;
  title: ProjectsDraft["projects"][number]["title"];
  description: ProjectsDraft["projects"][number]["description"];
  repository?: string;
  branch?: string;
  url?: string;
  reference?: { label: string; url: string };
}

export interface NormalizedContent {
  mode: ContentMode;
  profile: NormalizedProfile;
  projects: readonly NormalizedProject[];
  focus: FocusDraft["focus"];
  snapshot: PublicSnapshotDraft;
}

function issue(path: string, message: string): ValidationIssue {
  return { path, message };
}

export function normalizeProfile(
  draft: ProfileDraft,
  mode: ContentMode,
): ValidationResult<NormalizedProfile> {
  const issues: ValidationIssue[] = [];

  if (mode === "release") {
    if (!draft.profile.reviewed_by_owner) {
      issues.push(issue("profile.reviewed_by_owner", "must be true for release"));
    }
    if (draft.profile.display_name === null) {
      issues.push(issue("profile.display_name", "is required for release"));
    }
    if (draft.profile.github_username === null) {
      issues.push(issue("profile.github_username", "is required for release"));
    }
    if (draft.site.origin === null) {
      issues.push(issue("site.origin", "is required for release"));
    }
    if (draft.site.base_path === null) {
      issues.push(issue("site.base_path", "is required for release"));
    }
    if (draft.site.deployment_enabled && (draft.site.origin === null || draft.site.base_path === null)) {
      issues.push(issue("site.deployment_enabled", "requires origin and base_path"));
    }
  }

  if (issues.length > 0) return { ok: false, issues };

  return {
    ok: true,
    value: {
      mode,
      displayName: draft.profile.display_name,
      githubUsername: draft.profile.github_username,
      headline: draft.profile.headline,
      summary: draft.profile.summary,
      team: draft.profile.team ?? null,
      publicContact: draft.profile.public_contact,
      site: draft.site,
    },
  };
}

export function normalizeContent(
  profileDraft: ProfileDraft,
  projectsDraft: ProjectsDraft,
  focusDraft: FocusDraft,
  snapshot: PublicSnapshotDraft,
  mode: ContentMode,
): ValidationResult<NormalizedContent> {
  const profile = normalizeProfile(profileDraft, mode);
  if (!profile.ok) return profile;

  const issues: ValidationIssue[] = [];
  if (mode === "release") {
    projectsDraft.projects.forEach((project, index) => {
      if (project.publish && !project.reviewed_by_owner) {
        issues.push(issue(`projects[${index}].reviewed_by_owner`, "must be true for release"));
      }
    });
  }

  if (issues.length > 0) return { ok: false, issues };

  return {
    ok: true,
    value: {
      mode,
      profile: profile.value,
      projects: projectsDraft.projects
        .filter((project) => project.publish && (mode === "draft" || project.reviewed_by_owner))
        .map(({ id, title, description, repository, branch, url, reference }) => ({ id, title, description, repository, branch, url, reference })),
      focus: focusDraft.focus,
      snapshot,
    },
  };
}
