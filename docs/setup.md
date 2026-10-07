# Setup

## Local development

```bash
npm install
npm run dev -- --host 0.0.0.0
```

The local site starts in draft mode and does not require GitHub credentials.

## Checks

```bash
npm run test
npm run typecheck
npm run build
npm run profile:render
npm run test:e2e
```

`PROFILE_MODE=release npm run check:release` is expected to fail until owner-reviewed data and site settings are present.
## Publication

Main-branch pushes run `.github/workflows/pages.yml`: release validation, typecheck, unit tests and static build precede GitHub Pages deployment. The public site is https://rjochi.github.io/Rjochi/ . Enable Pages with GitHub Actions as the build source. Development stays at the local root; release builds use `/Rjochi/` from `data/profile.yaml`.

The GitHub profile README includes a looping GIF and a link to the interactive page. To regenerate the GIF, run the Astro dev server, then `npm run profile:animate` (requires Python 3/Pillow and Playwright Chromium).
