# Electron Packaging Target Format

Type: research
Status: resolved

## Question

What are the standard Electron packaging target formats for macOS, Windows, and Linux for an MVP desktop shell? Specifically:

- macOS: dmg vs zip vs both?
- Windows: nsis vs portable vs both?
- Linux: AppImage vs deb vs both?
- Which tool (electron-builder, electron-forge, etc.) is idiomatic for this project's stack (electron-vite at `apps/desktop`)?
- What are the minimal config requirements for each target?

Produce a brief recommendation with pro/cons and a concrete `electron-builder` or equivalent config stub.

## Answer

**Recommendation**: Use `electron-builder` as the packaging tool (electron-vite's primary documented option, no output-directory conflict). Targets per platform:

- macOS: `dmg` + `zip` (both required for auto-update, `dmg` is standard consumer format)
- Windows: `nsis` (default `.exe` installer, works with auto-update)
- Linux: `AppImage` (universal, no-install, broadest compatibility)

Full research findings with config stub and entitlements saved to `.scratch/engine-suite-roadmap/research/electron-packaging.md`.
