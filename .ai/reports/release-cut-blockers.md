# Release-cut blockers (production-readiness WS1)

**Date:** 2026-10-12 · **Branch:** `dev` · **Driver:** production-readiness mission
(`.scratch/handoff/production-readiness-prompt.md`).

**Outcome:** the release is **not cut**. Every code-level blocker found is fixed
and CI-verified — the Release workflow now builds the Linux artifact and fails on
macOS/Windows **only** at the signing-credential guard. The one remaining blocker
is operational: none of the seven required signing secrets exist. This is the
mission's "precise blocker report" deliverable.

## Code-level blockers — fixed and verified this session

| Blocker                                                                                                                                                                                                                                                                   | Fix                                                             | Commit                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------- |
| Windows Determinism Gate red: `project.ts isFileWithin` used a `/`-joined prefix test that never matches on Windows, so every content file resolved as "not found"                                                                                                        | use `path.relative`                                             | `aaa59919`                    |
| Windows Determinism Gate red: `contentPack.test.ts` expected a POSIX-separated resources path                                                                                                                                                                             | build the expectation with `path.join`                          | `aaa59919`                    |
| Windows Determinism Gate red: `content-boundary.test.ts` excluded `bake-*.ts` with a `/`-anchored regex, but recursive `readdirSync` returns `\` paths on Windows                                                                                                         | accept both separators                                          | `aaa59919`                    |
| Windows pack failed: `Icon is not a valid ICO file` (1×1 PNG stub)                                                                                                                                                                                                        | real 1024² `build/icon.png` + derived `icon.icns`/`icon.ico`    | `e4ef55e1`                    |
| macOS pack would fail the same way once signing succeeds (70-byte `icon.icns` stub)                                                                                                                                                                                       | same icon set                                                   | `e4ef55e1`                    |
| Linux AppImage: `executableName … @bluewavedesktop`                                                                                                                                                                                                                       | `electron-builder.yml` `linux.executableName: bluewave`         | `4172869f` (already on `dev`) |
| macOS cryptic `… not a file` on an empty `CSC_LINK`                                                                                                                                                                                                                       | `release.yml` "Require … signing credentials" fail-fast guards  | `4172869f` (already on `dev`) |
| Linux `pack:linux` failed at `mksquashfs`: all three platforms set `artifactName: ${name}-…`, and `${name}` is the scoped package name `@bluewave/desktop`, so the `/` became a path separator and the AppImage wrote to `dist-electron/@bluewave/desktop-1.2.0.AppImage` | use the sanitized `${productName}` (`Bluewave`)                 | `c4b0d463`                    |
| Windows guard was itself broken: `Require Windows signing credentials` used `$env:$v`, invalid PowerShell, so the job died with a `ParserError` instead of naming the missing secrets                                                                                     | `[Environment]::GetEnvironmentVariable($v)`                     | `c4b0d463`                    |
| Linux `desktopName` warning (desktop environments cannot link the window to the launcher)                                                                                                                                                                                 | `desktopName: com.bluewave.app` + `linux.syncDesktopName: true` | `05fb8e86`                    |

Evidence — the Release workflow dispatched on `dev` (run `38268352280`):

- `linux` → **success**; artifact `linux-artifacts` (178 MB) contains
  `Bluewave-1.2.0.AppImage`; no `desktopName` warning.
- `mac` → fails only at `Require macOS signing credentials`:
  `Missing signing secrets: CSC_LINK CSC_KEY_PASSWORD APPLE_ID APPLE_APP_SPECIFIC_PASSWORD APPLE_TEAM_ID.`
- `win` → fails only at `Require Windows signing credentials`:
  `Missing signing secrets: CSC_LINK, CSC_KEY_PASSWORD.`
- `draft-release` → skipped (needs all three).

Also: `Determinism Gate` green on `347709ca` (ubuntu + windows + macos);
local `electron-builder --mac --dir` packs `Bluewave.app` with the new `icon.icns`;
`pnpm audit --prod --audit-level=high` → no known vulnerabilities.

## The hard blocker — no signing credentials

`gh secret list` and `gh api repos/joaooliveira92/bluewave-compiler/actions/secrets`
are **empty**: none of the seven secrets `release.yml` requires exist.

Evidence from the one tagged Release run that fired (`v1.2.0`, run `38255352646`),
before the guards/icons/artifact-name fixes:

- `mac` → `pack:mac` failed: `…/apps/desktop not a file` (empty `CSC_LINK`).
- `win` → `Icon is not a valid ICO file` (now fixed).
- `linux` → `executableName contains characters … @bluewavedesktop` (now fixed).

With the fixes now on `dev`, a re-run fails at exactly
`Require macOS signing credentials` / `Require Windows signing credentials` and
names the missing secrets — the precise blocker.

## To cut the release (human steps, in order)

1. Run `scripts/release-signing-wizard.sh` once to create the Developer ID
   (macOS) and code-signing (Windows) certs and set the seven repository secrets
   (`docs/delivery/desktop-signing.md`).
2. Freeze `dev` (the concurrent shipbuilding writer is landing authoritative
   changes; the golden hashes must be re-pinned in the freeze commit).
3. Tag the frozen HEAD. The existing `v1.2.0` tag points at the pre-fix commit
   `fb80f52e` and its Release run failed, so either delete/recreate it at the
   frozen HEAD or cut `v1.2.1`. `apps/desktop/package.json` is already `1.2.0`.
4. `git push origin v1.2.0` → `Release` workflow builds signed + notarized
   `dmg`/`zip` (mac), signed `nsis` `.exe` (win) and `AppImage` (linux) onto a
   **draft** GitHub Release; verify with `spctl -a -vvv` / `xcrun stapler validate`
   and the packaged smoke test, then promote.
