# Maintenance

## Draft mode

Draft mode is the default. It displays `DRAFT / SAMPLE DATA`, emits `noindex, nofollow`, and permits incomplete profile data.

## Release mode

Release requires owner review, a display name, GitHub username, site origin, and base path. Run:

```bash
PROFILE_MODE=release npm run check:release
```

Do not bypass a failed release check by changing the validator or setting review flags without approval.

Generated output is also protected by a dry-run apply command. Review `build/profile/README.md`, then use `PROFILE_APPLY=1 npm run profile:apply` only when replacement is intended.

Repository snapshots must be fetched anonymously and only from owner-approved public targets. Private or unverifiable repositories are rejected; credentials and raw API responses are never stored.

## Recovery

If the interactive viewer fails, use Static view. If generated output is wrong, retain the last known-good public files and regenerate from reviewed source data. Never force-push or change GitHub settings as part of local maintenance.