# Release checklist

A release is cut from `dev` to `main` and a signed artifact is published. Every
box must be true; none is "obvious". See `docs/delivery/desktop-signing.md` for the
signing setup and `.github/workflows/release.yml` for the build.

## Before tagging

- [ ] `pnpm check` green on the exact commit (preflight, format, lint, license,
      typecheck, build, unit, e2e).
- [ ] Determinism gate green on linux/windows/macos; goldens verified
      (`node scripts/verify-golden-hashes.cjs`).
- [ ] `pnpm audit --prod --audit-level=high` clean.
- [ ] Every playable nation has an authored profile, or is a recorded gap
      (`packages/ship-design/test/productionNationCoverage.test.ts`, ADR-0096).
- [ ] `CHANGELOG.md` moved from "Unreleased" to the version, dated.
- [ ] Version bumped in `apps/desktop/package.json` (and any other published package).
- [ ] Real icons installed: `apps/desktop/build/icon.icns` / `icon.ico` are not the
      70-byte placeholders.
- [ ] A save made on the previous release still loads (or its rejection is intended
      and documented — the current contract is reject-on-mismatch, DESIGN-52).

## Tag and build

- [ ] `git tag vX.Y.Z && git push origin vX.Y.Z` (or dispatch the Release workflow).
- [ ] Release workflow produces signed + notarized mac `.dmg`/`.zip`, signed win
      `.exe`, linux `.AppImage`.

## Verify the artifact

- [ ] mac: `spctl -a -vvv -t install Bluewave.app` → accepted;
      `xcrun stapler validate Bluewave.app` → worked.
- [ ] win: SmartScreen does not warn; the signature is the expected publisher.
- [ ] Smoke the packaged app (`pnpm --filter @bluewave/desktop smoke:packaged`).
- [ ] Promote the draft GitHub Release.

## Dependency advisories

- [ ] Triage open Dependabot alerts. Ship-blocking: any **high/critical in a
      production dependency** (gate enforces this). Dev-only advisories are triaged
      and either patched or recorded with a reason; do not let the count grow
      unexamined.
