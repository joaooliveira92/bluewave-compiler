# 01 — B9 Electron boundary milestone brief

## Question

What exactly goes into the B9 milestone brief at `.ai/briefs/B9-ELECTRON-BOUNDARY.md`?

The following decisions have been pre-settled in charting grilling:

- Electron integration: `electron-vite`
- App package: `apps/desktop`
- CSP: strict (`default-src 'self'`)
- IPC channels (MVP): `compile` only (open + compile content)
- Smoke test: process-start + IPC-responds + clean-exit only

Remaining decisions:

- Electron packaging target format(s) per platform (dmg/zip for macOS, nsis/portable for Windows, AppImage/deb for Linux)
- Whether the MVP renderer shows read-only compiled output or is a blank shell with CLI integration
- Main process module structure (how it wires the compile IPC handler)
- Preload script API surface (exactly what the `compile` channel exposes)
- Determine whether `electron-vite` imposes any constraints on the existing package graph (e.g., ESM/CJS interop with Node.js packages)
- CSP: should we also restrict `img-src`, `style-src` beyond `'self'`?
- Dev workflow: does the dev run `apps/desktop` via `electron-vite dev` or through the turbo pipeline?

Type: grilling
Status: resolved
Blocked by: none

## Resolution

All questions in this ticket were resolved through sub-tickets:

- **Electron packaging targets**: See [01-electron-packaging-targets.md](01-electron-packaging-targets.md) — electron-builder, macOS dmg+zip, Windows nsis, Linux AppImage
- **Renderer: CLI-only vs read-only**: See [02-b9-desktop-content-display.md](02-b9-desktop-content-display.md) — CLI-only
- **B9 milestone brief**: See [03-b9-milestone-brief.md](03-b9-milestone-brief.md) — produced at `.ai/briefs/b9-desktop-shell.md`
- **Main process structure, preload API, electron-vite constraints, CSP, dev workflow**: Already settled in charting session and implemented in `apps/desktop` (see ADR-0008)
