# Electron Packaging for MVP Desktop Shell

## 1. Research Sources

| Source                                  | URL                                               | What it covers                                                                                                                                          |
| --------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| electron-vite Distribution Guide        | https://electron-vite.org/guide/distribution.html | Official electron-vite docs on packaging; provides both electron-builder and Forge config stubs; explicitly recommends electron-builder as first option |
| electron-builder Configuration          | https://www.electron.build/docs/configuration     | All config options, file macros, hooks                                                                                                                  |
| electron-builder macOS Targets          | https://www.electron.build/docs/mac               | DMG, ZIP, PKG, MAS targets; default is `dmg` + `zip`                                                                                                    |
| electron-builder Windows Targets        | https://www.electron.build/docs/win               | NSIS (default), portable, AppX, MSIX, MSI; default is `nsis`                                                                                            |
| electron-builder Linux Targets          | https://www.electron.build/docs/linux             | AppImage (default), deb, rpm, snap, flatpak, pacman, apk                                                                                                |
| electron-builder Target Selection Guide | https://www.electron.build/docs/targets           | Decision trees per platform, combining multiple targets                                                                                                 |

## 2. Recommended Packaging Targets per Platform (MVP)

### macOS: `dmg` + `zip`

- **`dmg`** — standard consumer-facing distribution format. Drag-and-drop install into `/Applications`. Customizable window, background, icon layout. (Source: electron-builder macOS docs: "Standard consumer distribution")
- **`zip`** — required as the update payload for `electron-updater`. Built alongside `dmg` by default. (Source: electron-builder macOS docs: "The default targets are `zip` and `dmg` (both are required for Squirrel.Mac auto-update)")
- **Rationale**: `dmg` is the universal macOS install experience. `zip` is the smallest artifact for auto-update delivery. Squirrel.Mac — the legacy auto-update mechanism — requires both `dmg` and `zip` enabled simultaneously (electron-builder macOS docs). For MVP, shipping both adds negligible complexity.

### Windows: `nsis`

- **`nsis`** — default Windows installer format. Produces a lightweight `.exe` installer. Supports both per-user (no admin) and per-machine install modes. Works with `electron-updater` for auto-updates. (Source: electron-builder Windows docs: "NSIS (Nullsoft Scriptable Install System) is the default Windows installer format")
- **Rationale**: NSIS is the most widely used Electron Windows installer. It is the default for good reason — it just works. No need for `portable` at MVP (that's a niche use case).

### Linux: `AppImage`

- **`AppImage`** — single-file, no-install, runs on virtually any x86_64 Linux distribution. No root required. Works with `electron-updater` (delta updates via embedded blockmap). (Source: electron-builder Linux docs: "AppImage — best first choice for broad compatibility")
- **Rationale**: AppImage is the default Linux target for a reason: it's universal. No need to ship separate `deb` and `rpm` packages at MVP. Users who prefer their distro's package manager can be supported post-MVP.

### Summary Table

| Platform | Target(s)    | Purpose                                     |
| -------- | ------------ | ------------------------------------------- |
| macOS    | `dmg`, `zip` | User-facing installer + auto-update payload |
| Windows  | `nsis`       | Standard `.exe` installer                   |
| Linux    | `AppImage`   | Universal single-file portable              |

## 3. Recommended Tooling: `electron-builder`

**Recommendation: electron-builder** (npm: `electron-builder`)

Reasoning:

1. **electron-vite officially documents electron-builder first** — the Distribution Guide at https://electron-vite.org/guide/distribution.html shows electron-builder as the primary option, with a full config stub and CLI scripts. Electron Forge is documented as a secondary alternative.

2. **electron-builder is a single dependency** — one package (`electron-builder`) handles all platforms. Forge requires a separate `@electron-forge/maker-*` package per target format (e.g. `@electron-forge/maker-squirrel`, `@electron-forge/maker-dmg`).

3. **No output-directory conflict** — electron-vite's default build output is `out/`, which **conflicts with Electron Forge's default output directory** (also `out/`). The electron-vite docs explicitly warn: "Electron Forge's default output directory is `out` and forbids to override, which conflicts with electron-vite. So we can set `outDir` to `dist`." This is a persistent footgun with Forge.

4. **Mature, widely used** — electron-builder is the most popular Electron packaging tool. Large ecosystem, extensive documentation, and good CI support.

### Alternatives Considered

| Tool                  | Pros                                                                                                      | Cons                                                                                                                               |
| --------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **electron-builder**  | Single dependency, all platforms, no output-dir conflict with electron-vite, mature, auto-update built-in | YAML config can be verbose; some advanced options are opaque                                                                       |
| **Electron Forge**    | Official Electron tooling, first-party support                                                            | Requires one `@electron-forge/maker-*` package per format; output-dir conflict with electron-vite; more boilerplate                |
| **electron-packager** | Simple, low-level                                                                                         | Only produces the raw app directory (`.app`/`win32`/`linux` dirs), not installers; must be combined with a separate installer tool |

## 4. Minimal Config Stub

### `electron-builder.yml` (placed at repo root or `apps/desktop/`)

```yaml
appId: com.bluewave.desktop
productName: Bluewave
directories:
  buildResources: build
  output: dist-electron
files:
  - "!**/.vscode/*"
  - "!src/*"
  - "!electron.vite.config.{js,ts,mjs,cjs}"
  - "!{.eslintignore,.eslintrc.cjs,.prettierignore,.prettierrc.yaml,CHANGELOG.md,README.md}"
  - "!{tsconfig.json,tsconfig.node.json,tsconfig.web.json}"
  - "!{tsconfig.tsbuildinfo,.gitignore}"
mac:
  artifactName: ${name}-${version}-${arch}.${ext}
  target:
    - dmg
    - zip
win:
  artifactName: ${name}-${version}-setup.${ext}
  target:
    - nsis
  executableName: bluewave
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  deleteAppDataOnUninstall: false
linux:
  artifactName: ${name}-${version}.${ext}
  target:
    - AppImage
  category: Utility
  maintainer: bluewave@example.com
```

### `package.json` scripts (add to `apps/desktop/package.json`)

```json
{
  "scripts": {
    "build:mac": "electron-vite build && electron-builder --mac --config",
    "build:win": "electron-vite build && electron-builder --win --config",
    "build:linux": "electron-vite build && electron-builder --linux --config"
  },
  "devDependencies": {
    "electron-builder": "^25.0.0"
  }
}
```

### Required non-code files

| File                                   | Purpose                                                        |
| -------------------------------------- | -------------------------------------------------------------- |
| `build/icon.icns`                      | macOS app icon                                                 |
| `build/icon.ico`                       | Windows app icon                                               |
| `build/icons/256x256.png`              | Linux app icon (PNG with size in filename)                     |
| `build/entitlements.mac.plist`         | macOS entitlements (minimal: JIT + unsigned-executable-memory) |
| `build/entitlements.mac.inherit.plist` | macOS helper entitlements (same as above)                      |

### Minimal entitlements for macOS (`build/entitlements.mac.plist`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
</dict>
</plist>
```

## 5. Pros/Cons of Alternatives Considered

### macOS: `zip` only (skip `dmg`)

- **Pro**: One fewer artifact to build; smaller CI output.
- **Con**: Users must unzip and drag to Applications manually — non-standard, confusing for typical macOS users. DMG is the expected macOS install experience. (Source: electron-builder macOS docs: "DMG — standard consumer distribution")

### Windows: `portable` instead of `nsis`

- **Pro**: No install required; single `.exe` file.
- **Con**: No Start menu entry, no file associations, no auto-update support via `electron-updater`. Niche use case. (Source: electron-builder Windows docs: "Portable — use when no installation at all is the goal")

### Linux: `deb` + `rpm` instead of `AppImage`

- **Pro**: Native package manager integration; users can install via `apt`/`dnf`.
- **Con**: Two artifacts instead of one; requires maintaining per-distro dependency lists; `dpkg`/`rpm` must be run as root. Fine for post-MVP but unnecessary for initial release. (Source: electron-builder Linux docs: "AppImage — best first choice for broad compatibility")

### Electron Forge instead of electron-builder

- **Pro**: Official Electron tooling.
- **Con**: Output-directory conflict with electron-vite (both default to `out/`); requires installing a separate maker package per target format; more boilerplate config. (Source: electron-vite distribution guide: warns about the Forge output-directory conflict)
