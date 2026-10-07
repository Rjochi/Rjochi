# QA Report

## Personal academic profile layout

Owner feedback: the 3D motion is satisfactory, but the surrounding design feels like an AI-generated promotional site. The Japanese page now leads with the actual display name and a short biography, followed by the demo and a plain description of its implementation. Decorative branding and promotional slogans were removed; the page uses neutral gray, white, and restrained blue links. Graduate-student status comes from the owner's explicit statement, with publication-review flags still unchanged.

The scene, camera, trajectory generation, and playback timing are unchanged. Only the surrounding layout, text, styling, and completion-message copy were revised. Desktop and mobile screenshots were inspected with dark and light OS preferences; the site retains the requested dark default. Production build, typecheck, 22 unit tests, and 16 Chromium E2E tests passed. The E2E checks still cover pause/resume/restart, offscreen suspension, reduced motion, JavaScript-disabled fallback, and WebGL loss/recovery.

## Japanese signature redesign — 2026-10-07

This section supersedes the earlier Japanese UI findings below. The owner requested Japanese-first delivery, a dark default, and automatic 3D playback; English visual parity and a light theme are deferred.

- `/` and `/ja/` now share one Japanese composition and one scene. Controls are pause/resume and restart; the three planning phases advance automatically.
- The animation loads after the scene enters the viewport, plays once, and settles at the destination. Pause/resume retains its position; restart is explicit.
- The scene source remains `data/scenes/signature.yaml`. Shared path generation now produces continuously verified quadratic corner curves, also consumed by the README SVG generator. All three clearance presets round every corner without fallback in the current scene.
- Curve verification uses recursive convex-hull bounds, checks the workspace, and separately validates the chords used for rendering. Unit tests cover obstacle intersections, boundary contact, safe subdivision, endpoint/tangent continuity, no-path results, and distance-based playback.
- TypeScript check, production build, and 22 unit tests passed.
- 16 Chromium E2E tests passed against the built site: `PLAYWRIGHT_BASE_URL=http://127.0.0.1:4323 npm run test:e2e`. Includes the retained English smoke tests.
- Browser checks cover automatic launch, pause/resume/restart, 320/390/768/1440px layouts, light OS preference retaining the requested dark design, reduced motion deferring Three.js, JavaScript-disabled content, failed WebGL initialization, actual `WEBGL_lose_context` loss and retry, and suspension of animation frames offscreen.
- Desktop and mobile screenshots were inspected and the camera, obstacle height, route weight, typography, and mobile spacing were adjusted from those observations.
- Publication remains disabled and owner-review flags are unchanged. No profile claims, projects, affiliations, or achievements were invented.

Remaining scope: English redesign, a separate light palette, owner-supplied profile/project content, real-device and non-Chromium QA, GitHub-hosted README rendering, and production deployment.

## Current local draft

- Date: 2026-10-07
- Mode: draft
- Environment: Ubuntu 24.04.5 LTS, Node.js 22, Astro static build
- Automated tests: 10 Vitest tests passed
- Typecheck: passed
- Static build: passed
- Release check: correctly rejects unreviewed placeholder data
- Browser: mobile and 1440px layouts checked; no horizontal overflow observed
- Browser: Search, Playback, Reset, Static view, Run planning demo, and clearance switching checked
- Browser: `/ja/` rendered with `lang="ja"`, draft noindex metadata, language link, and no mobile overflow
- E2E coverage: English draft, Japanese route, clearance switching, and deferred demo launch are defined in `tests/e2e/profile.spec.ts`
- E2E coverage: static Hero autoplay and completion are included
- Static Hero autoplay: one 3.6-second pass with reduced-motion fallback implemented
- 3D launch: static poster remains available; `3D Play` loads and starts playback in one action
- Route QA: `/` is Japanese, `/en/` is English, and `/ja/` remains available

## Not verified

- GitHub-hosted README rendering and theme switching
- Production Pages URL and base path
- Firefox, WebKit, and physical mobile devices
- Owner-approved content, repository snapshot, and public deployment

## Representative projects — 2026-10-07

- Japanese page: six descriptions after the demo implementation details; six verified GitHub branch links. ESP32 public visibility and README verified after the owner made it public; jazzy-devel selected (23 Rjochi commits, tied with humble-devel).
- Branches: GNC humble-devel (140 Rjochi commits), common humble-devel (8), platform humble-bridge (21), ASR jazzy-devel (4), TTS jazzy-devel (56). Tied top branches have identical Rjochi commit SHA sets; choose the default branch. See project-source-review.md.
- Team SOBITS first place verified against SAIRA competition results; owner clarified competition implementation is noetic-devel, while demo-related research is humble-devel. Main link goes to humble-devel; the supplementary competition link goes to noetic-devel. No individual award or sole-development claim.
- README draft uses the same project source and branch URLs. Owner review flags remain false.
- Typecheck, build, README rendering, 23 unit tests and 16 Chromium E2E tests passed.
- Browser screenshots inspected at 390px and 1440px, under dark and light OS preferences. Default stays dark as requested. Six entries and six branch links checked; no horizontal overflow. Screenshots: /tmp/github-profile-projects/.

## Editable Japanese page copy

- Added `data/page.ja.yaml` for shared Japanese main-page text: navigation, headings, demo description and notes, explanation steps, playback controls/status, SVG/canvas accessibility labels, draft footer.
- Profile/projects/focus content stays in existing source YAML files. English-page synchronization remains deferred.
- Raw YAML import tracks dev-server changes. Required keys and explanation entries validate before rendering; missing text reports the exact source key. Inline JSON escapes script delimiters and SVG labels escape XML characters.
- Typecheck, build, 25 unit tests and 16 Playwright Chromium tests passed. Desktop/mobile screenshots under light/dark OS preferences inspected in `/tmp/github-profile-copy/`; default remains dark, layout preserved. Owner edits to demo.description during the task were preserved and rebuilt for final browser checks.

## Commit/push preflight

- Public files scanned for credential/token patterns, private keys, credential URLs and sensitive filenames; no findings. Ignored build output, dependency folders, local environment files, AGENTS.md and design notes are excluded from commits.
- Cleaned accidental shell-command wrapper text from .gitignore, preserving exclusion rules.
- Updated browser checks to read editable Japanese labels from source YAML; old fixed wording caused failures after owner edits.
- Typecheck, build, README generation and 25 unit tests passed. Initial state: GitHub Pages was not enabled. Owner then requested an indefinitely looping README GIF with a link below to the interactive page. Added a release-gated GitHub Actions Pages workflow and configured the project base path.

## Final requested publication layout

README contains the actual Three.js demo captured as a 16.5-second, 768×416, indefinitely looping GIF (191,813 bytes), followed by 「詳しくはこちら」 linking to https://rjochi.github.io/Rjochi/. The source scene/path is shared with the interactive page. GIF frame samples inspected; loop=0 verified with Pillow. No screenshot of external or copyrighted robot artwork was used.

Release validation, typecheck, 25 unit tests, build and README generation passed. Both draft and release browser configurations were checked. Final release screenshots inspected for desktop/mobile with dark/light OS preferences; the page stays dark by default. Owner publication instructions authorize the reviewed content flags; Pages publication uses the standard GitHub Actions mechanism with only contents-read in build and Pages/id-token write in deploy.

Publication setting: GitHub Pages enable API returned HTTP 403 (current credential lacks required setting permission). Owner asked to set Settings → Pages → Source to GitHub Actions. README/GIF source push can proceed; verify actual deployment after the setting is enabled. Final release E2E: 16 passed.
