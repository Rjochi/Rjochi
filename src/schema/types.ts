export type Locale = "en" | "ja";

export interface LocalizedText {
  en: string | null;
  ja: string | null;
}

export interface ProfileDraft {
  schema_version: 1;
  profile: {
    display_name: string | null;
    github_username: string | null;
    headline: LocalizedText;
    summary: LocalizedText;
    team?: { name: string; url: string } | null;
    public_contact: string | null;
    reviewed_by_owner: boolean;
  };
  site: {
    origin: string | null;
    base_path: string | null;
    primary_locale: Locale;
    enabled_locales: readonly Locale[];
    deployment_enabled: boolean;
  };
  presentation: {
    theme_default: "system" | "light" | "dark";
    readme_motion: "once" | "off";
    allow_third_party_tracking: boolean;
  };
}

export interface DemoSceneDraft {
  schema_version: 1;
  id: string;
  status: "draft";
  units: "demo-units";
  workspace: { min: readonly [number, number, number]; max: readonly [number, number, number] };
  grid_step: number;
  robot_radius: number;
  clearance_presets: readonly number[];
  start: readonly [number, number, number];
  goal: readonly [number, number, number];
  obstacles: ReadonlyArray<{
    min: readonly [number, number, number];
    max: readonly [number, number, number];
  }>;
}

export interface ProjectsDraft {
  schema_version: 1;
  projects: ReadonlyArray<{
    id: string;
    publish: boolean;
    reviewed_by_owner: boolean;
    title: LocalizedText;
    description?: LocalizedText;
    repository?: string;
    branch?: string;
    url?: string;
    reference?: { label: string; url: string };
  }>;
}

export interface FocusDraft {
  schema_version: 1;
  focus: LocalizedText;
}

export interface PublicSnapshotDraft {
  schemaVersion: 1;
  asOfDateUtc: string | null;
  repositories: ReadonlyArray<{
    projectId: string;
    publicRepositoryUrl: string;
    branch: string;
    headSha: string;
    headUrl: string;
    headCommittedAt: string;
    visibilityChecked: true;
  }>;
}
