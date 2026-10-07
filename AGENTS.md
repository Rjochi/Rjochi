# AGENTS.md

Read `github_profile_design.md` before major changes.

## Stack
- Node.js 22
- TypeScript
- Astro
- Three.js
- Vitest
- Playwright
- Docker

Run:

```bash
npm run dev -- --host 0.0.0.0
```

## Rules

- Preserve unrelated user changes.
- Check `git status` before editing.
- Do not use destructive Git commands unless requested.
- Do not invent achievements, contribution scope, performance, affiliations, or status.
- Do not set `reviewed_by_owner: true` without approval.
- Do not use JAXA logos, Int-Ball2 photos/CAD, or imitate its distinctive appearance.
- Use original geometric visuals.
- Treat the demo as an independent geometric demo, not the real GNC system.
- Prefer `SEARCH -> REFINE -> PLAYBACK`.
- README and Pages should share the same scene/path data.
- Keep source data separate from generated files.
- Never expose tokens, credentials, or private repository data.
- Three.js should load only when needed.
- Always provide a static fallback.

## Visual QA

For UI changes:

- Open the real site in a browser.
- Check desktop and mobile.
- Check light and dark themes.
- Inspect screenshots, not only code/tests.

Local README rendering is not equivalent to GitHub rendering.

## Testing

Run relevant checks:

```bash
npm run build
npm run test
```

Use Playwright for browser-related changes.

## Priority

```text
correctness
-> readability
-> originality
-> reliability
-> visual quality
-> extra features
```

Do not add optional features before the core experience is polished.