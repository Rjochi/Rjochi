# Implementation Status

## Current summary — 2026-10-07

実装済み: 共通YAML、型・公開条件の検証、三次元A*探索・衝突確認付き曲線化、独立した幾何学3Dデモ、日本語優先の落ち着いたプロフィール、遅延Three.js・静止図フォールバック、公開ブランチへの取り組みリンク、日本語README生成・反映。

未完了: GitHub Pagesの設定と公開URL、英語版のデザイン同期、ライトテーマ、公開Repository Snapshotの更新運用。

本人より文章への肯定と、危険な内容がないことを確認したうえでのコミット・pushを指示済み。承認されたプロフィール・取り組みの `reviewed_by_owner` をtrueに設定。本人の追加指示により、READMEのGIF直下から「詳しくはこちら」で操作可能なPagesにもリンクする。公開URLは https://rjochi.github.io/Rjochi/ 、GitHub Actionsでmain push時に公開。README上で3Dの動きを見せるため、実際のThree.js描画をキャプチャした無限ループGIFを埋め込む。インタラクティブな操作はPages側のみ。

検証: typecheck・Astro build・README生成・unit 25件。ブラウザテストは編集可能なYAML文言を参照し、UIの動作と公開前の安全性を確認する。

## Step 0: Initial state

- Status: complete for the current foundation slice
- Mode: draft
- Working branch: `main`
- Latest source commit: `35c4af8`
- GitHub username: verified via `gh api user --jq .login` as `Rjochi`; repository ownership: not verified
- Default branch and Pages settings: not verified
- Public deployment permission: not verified
- Existing README: minimal draft content; preserve until generated replacement is reviewed
- Existing application: minimal Astro page at `src/pages/index.astro`
- Existing generated output: ignored `dist/` and `.astro/` directories
- Candidate projects, contribution scope, contact details, and asset permissions: not verified

## Protection decisions

- Do not publish or invent profile claims before owner review.
- Do not modify GitHub settings, create repositories, or push changes without explicit approval.
- Keep source data separate from generated output.
- Keep credentials out of source, logs, generated pages, and test fixtures.

## Step 0 result

- Completed: current branch, clean start state, existing files, and unknown publication settings recorded.
- Completed: no GitHub settings, repositories, Pages deployments, or pushes changed.
- Validation: `npm run build` passed.
- Validation: `npm run test` initially reported no test files; Step 1 now adds the first contract tests.

## Step 1: Development foundation

- Status: in progress
- Added draft-only profile, project, focus, snapshot, and scene inputs under `data/`.
- Added initial TypeScript data contracts under `src/schema/`.
- Added offline contract tests under `tests/unit/`.
- Added YAML parsing and runtime validation for profile and scene draft inputs.
- Added `npm run validate` for the offline schema validation slice.
- Added `tsconfig.json` and `npm run typecheck` so TypeScript is checked explicitly.
- Added tests against the checked-in profile and scene draft inputs.
- Added a normalized profile model with explicit draft/release behavior.
- Release mode rejects unreviewed or incomplete publication settings.
- Added validation contracts for projects, focus, and public snapshot inputs.
- Added one normalized content model and a build-time data loader.
- Connected the Astro home page to the shared draft model with static fallback text.

Validation for this slice:

- `npm run validate` passed: 8 tests.
- `npm run typecheck` passed.
- `npm run build` passed.
- Browser QA: local draft page rendered with the draft marker and fallback copy.
- Browser QA: mobile-width screenshot and 1440px viewport check showed no horizontal overflow.
- Browser QA: static Hero rendered as an accessible SVG with obstacle outlines, search path, refined path, and geometry status.
- Browser QA: Hero viewBox `0 0 960 380` rendered at mobile and 1440px widths.
- Added deterministic Wide/Compact and Light/Dark Hero generation under `scripts/render-profile.ts`.
- `npm run profile:render` writes four SVGs to ignored `build/profile/` without changing README or public assets.
- Repeated generation produced identical SHA-256 hashes for all four SVGs.
- Added `templates/readme.md` and extended `npm run profile:render` to generate a reviewable README draft under `build/profile/`.
- Existing `README.md` remains untouched until the generated draft is reviewed.
- Added Pages planning controls for Search / Refined / Playback, clearance presets, envelope visibility, Play, Reset, Static view, and demo launch.
- Added a deferred Three.js viewer; the initial HTML references only the controls bundle, while the viewer is loaded after launch.
- Browser QA: Search, Play/Pause, Reset, and Run planning demo updated their accessible states; the runtime canvas mounted successfully.
- Viewer QA: Three.js playback responded to Play/Pause, Reset returned the marker state, and Static view hid the runtime while retaining the poster.
- Viewer QA: mobile runtime had no horizontal overflow; WebGL runtime canvas was visible in the browser screenshot.
- Added draft `noindex, nofollow` metadata and an explicit `npm run check:release` gate.
- Clearance preset changes now update the static raw/refined path and reset any active runtime.
- Added a static noindex 404 page with a return link.
- Added a Japanese static entry at `/ja/` using the same draft data and Hero scene.
- Added setup, content editing, maintenance, and QA handoff documents.
- Browser QA: `/ja/` rendered with Japanese fallback copy, language switch, draft noindex, and no mobile overflow.
- Added Playwright E2E coverage for draft routes, clearance switching, and deferred demo launch.
- E2E validation: 4 Chromium tests passed.
- Added a dry-run-by-default `profile:apply` command for generated README and Hero assets.
- Added an anonymous public Repository Snapshot fetcher with allowlisted output fields and fixture tests.
- Static Hero now auto-plays once on page load for 3.6 seconds; reduced-motion keeps it still.
- E2E coverage includes autoplay start and completion states.
- 3D interaction is now one-step: the initial poster remains visible, and `3D Play` loads and starts the viewer immediately.
- Root route is now Japanese; English is available at `/en/`, with `/ja/` retained as an explicit Japanese route.

## Next step

Owner-review the generated README and content inputs, then configure release values before public deployment.