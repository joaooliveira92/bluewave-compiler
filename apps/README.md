# Apps

The only platform entry points; everything else is a library under
[packages/](../packages/README.md).

| App | What | Entry docs |
| --- | --- | --- |
| `compiler-cli` | `bwc` CLI: `validate`, `compile`, `inspect`, `verify`, `compare`, `campaign`, `turn`, `replay`, plus a battle debug surface. | `--help`; [campaign compilation](../docs/architecture/campaign-compilation.md). |
| `desktop` | Electron + React 19 client (main / preload / renderer). | [Viewing the desktop UI](../docs/agents/desktop-view.md) (`pnpm snap`); ADR-0008/ADR-0030 for the Electron boundary. |

Boundary rule (ADR-0030): the desktop **renderer never imports engine packages
or filesystem APIs**; the Electron main process resolves built workspace
packages. UI state is never authoritative simulation state (`DESIGN-57`).
