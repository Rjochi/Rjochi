import { parse } from "yaml";

export interface DemoCopy {
  title: string;
  description: string;
  image_description: string;
  canvas_description: string;
  phase_label: string;
  phases: { search: string; refine: string; playback: string };
  note: string;
  fallback_note: string;
  controls: { play: string; pause: string; replay: string; restart: string; retry: string };
  status: { initial: string; search: string; refine: string; playback: string; complete: string; fallback: string; reduced_motion: string };
}
export interface PageCopy {
  meta: { title_suffix: string; fallback_name: string; fallback_headline: string };
  navigation: { skip: string; label: string; demo: string; github: string; new_tab: string };
  profile: { team_label: string };
  demo: DemoCopy;
  explanation: { title: string; steps: Array<{ title: string; body: string }> };
  work: { title: string };
  focus: { title: string };
  footer: { draft: string };
}

// Missing keys fail the build with the exact edit location instead of showing undefined.
export function parsePageCopy(source: string): PageCopy {
  const value: unknown = parse(source);
  const text = (path: string) => {
    const leaf = path.split(".").reduce<unknown>((node, key) => node !== null && typeof node === "object" ? (node as Record<string, unknown>)[key] : undefined, value);
    if (typeof leaf !== "string" || !leaf.trim()) throw new Error(`Invalid data/page.ja.yaml: ${path} must be a non-empty string`);
  };
  const groups: Record<string, string[]> = {
    meta: ["title_suffix", "fallback_name", "fallback_headline"],
    navigation: ["skip", "label", "demo", "github", "new_tab"],
    profile: ["team_label"],
    demo: ["title", "description", "image_description", "canvas_description", "phase_label", "note", "fallback_note"],
    "demo.phases": ["search", "refine", "playback"],
    "demo.controls": ["play", "pause", "replay", "restart", "retry"],
    "demo.status": ["initial", "search", "refine", "playback", "complete", "fallback", "reduced_motion"],
    explanation: ["title"], work: ["title"], focus: ["title"], footer: ["draft"],
  };
  for (const [group, keys] of Object.entries(groups)) for (const key of keys) text(`${group}.${key}`);
  const steps = (value as PageCopy).explanation.steps;
  if (!Array.isArray(steps) || !steps.length) throw new Error("Invalid data/page.ja.yaml: explanation.steps must be a non-empty list");
  steps.forEach((_, i) => { text(`explanation.steps.${i}.title`); text(`explanation.steps.${i}.body`); });
  return value as PageCopy;
}

// Escape raw-text script delimiters while keeping edited text intact after JSON.parse.
export function serializeInlineJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
