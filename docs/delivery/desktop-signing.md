# Desktop release signing and notarization

Status: process defined 2026-10-10; credentials not yet provisioned.

An unsigned macOS/Windows build is a broken release: Gatekeeper blocks the DMG
("damaged / cannot be opened") and SmartScreen warns on the installer. This
document is the release-signing contract; `scripts/release-signing-wizard.sh`
walks a human through the one-time credential setup.

## Current state

- `apps/desktop/electron-builder.yml` builds `dmg` + `zip` (mac), `nsis` (win),
  `AppImage` (linux), with entitlements at `apps/desktop/build/entitlements.mac.plist`.
- `hardenedRuntime` and `gatekeeperAssess: false` are enabled for macOS.
- No signing/notarization credentials are configured; `.github/workflows/release.yml`
  consumes them from repository secrets.

## Gaps to close before the first release

1. **Credentials** — Developer ID Application cert (macOS) and an EV/OV
   code-signing cert (Windows). See the wizard.
2. **Notarization** — electron-builder notarizes automatically when `APPLE_ID`,
   `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID` are present (skipped for
   local/unsigned builds). Verify a notarized build once with `spctl -a -vvv` and
   `xcrun stapler validate`.
3. **Publisher identity** — `nsis` has no `publisherName`; set it to the signed
   certificate's subject once known.

Resolved: the placeholder icons were replaced on 2026-10-12 with a 1024²
`build/icon.png` and derived `build/icon.{icns,ico}` (electron-builder now packs
all three platforms without an icon error).

## Required GitHub secrets

| Secret | Used for |
| --- | --- |
| `MAC_CSC_LINK` | base64 Developer ID `.p12` (electron-builder `CSC_LINK`) |
| `MAC_CSC_KEY_PASSWORD` | password for the `.p12` (`CSC_KEY_PASSWORD`) |
| `APPLE_ID` | notarization Apple ID |
| `APPLE_APP_SPECIFIC_PASSWORD` | app-specific password for the Apple ID |
| `APPLE_TEAM_ID` | Apple Developer team id |
| `WIN_CSC_LINK` | base64 Windows code-signing `.pfx` |
| `WIN_CSC_KEY_PASSWORD` | password for the `.pfx` |

## Release flow

1. Run `scripts/release-signing-wizard.sh` once to create the certs and set the
   secrets.
2. Cut a release: `git tag vX.Y.Z && git push origin vX.Y.Z` (or dispatch the
   `Release` workflow). CI builds all three platforms, signs, notarizes, staples,
   and attaches the artifacts to a draft GitHub Release.
3. Verify: on macOS, `spctl -a -vvv -t install Bluewave.app` → `accepted`;
   `xcrun stapler validate Bluewave.app` → `The validate action worked`.

## Local unsigned builds

`apps/desktop/scripts/packaged-smoke.mjs` sets `CSC_IDENTITY_AUTO_DISCOVERY=false`
so the packaged smoke test can run locally without credentials. Do not remove it.
