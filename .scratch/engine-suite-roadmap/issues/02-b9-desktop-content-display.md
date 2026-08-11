# B9 Desktop Content Display: CLI-only vs Read-only Render

Type: grilling
Status: resolved

## Question

Should the B9 Electron desktop app include a read-only render of compiled content, or should it only provide CLI integration (compile via IPC, output to terminal) for the MVP?

The settled B9 decisions are: electron-vite at `apps/desktop`, strict CSP, `compile` IPC channel only (MVP), process/IPC smoke test. The open question is whether the desktop window shows anything beyond a terminal/log view.

Factors to consider:
- MVP scope discipline
- Whether a read-only render provides meaningful validation for the IPC architecture
- How this affects the B10a brief (desktop UX dependency)

## Answer

**CLI-only for B9 MVP.** The Electron shell's job in B9 is to prove the boundary works (electron-vite, CSP, compile IPC, smoke test). A read-only render adds UI surface area, renderer CSP config, and content parsing without validating the architecture any better than a CLI smoke test. The read-only render can be added in B10a if the brief calls for it, once the shell is validated.