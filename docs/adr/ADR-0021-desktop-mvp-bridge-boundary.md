# ADR-0021: Desktop MVP — `campaign-engine` Package Boundary and `campaign:execute` Electron Boundary

## Status

Accepted

## Context

The desktop app's renderer (`shell/`, `screens/`) was built in a prior
effort against a `@bluewave/campaign-engine` package and a
`window.bluewave.campaign.execute(command, payload)` IPC bridge that never
existed — confirmed by grep: every screen imports from
`@bluewave/campaign-engine` and calls `bridge.campaign.execute(...)`, but
neither the package nor the preload/main wiring existed anywhere in the
repo (`.scratch/desktop-mvp/map.md`, tickets 01/07-11). The
ENGINEERING-CONTRACT's ADR threshold covers package boundaries and
Electron boundaries; this ADR records the two boundary decisions the
desktop-mvp wayfinder tickets made, without duplicating their full detail.

## Decision

1. **New package boundary: `packages/campaign-engine`.** A thin package
   depending on `@bluewave/campaign` + `@bluewave/persistence`, producing
   the UI-shaped domain types the screens already assume (`PlayerProjection`,
   `CommitMonthResponse`, the archetype system, battle/simulation types).
   `apps/desktop`'s main process is the only consumer; nothing depends on
   it in the other direction. Full type-by-type rationale:
   `.scratch/desktop-mvp/issues/07-campaign-engine-projection-shape.md`.
2. **Electron boundary: single `campaign:execute` IPC channel, command
   dispatch inside.** `src/preload/index.ts` exposes exactly one bridge
   surface (`campaign.execute`, plus frameless-window controls) rather than
   one IPC channel per command — `src/main/index.ts` registers
   `ipcMain.handle("campaign:execute", ...)` once, and
   `src/main/campaignBridge.ts`'s `dispatchCampaignCommand` routes on the
   command name against a fixed 22-command registry (enumerated across
   `.scratch/desktop-mvp/issues/07-10`). This keeps the *IPC surface* fixed
   as the *command set* grows — adding command #23 never touches
   `main/index.ts`'s `ipcMain` registrations.
3. **`BridgeResult<T>` is a three-way discriminated union** (`success` |
   `rejected` | `error`), not two — `rejected` alone carries an optional
   `currentRevision` for optimistic-concurrency conflicts. This was
   discovered (not originally specified) from `command-screen-workflow.ts`'s
   `Extract<BridgeResult<unknown>, { outcome: "rejected" }>` usage during
   implementation; it supersedes ticket 07's original two-way sketch.
4. **Ticket 11 scaffolds the boundary only.** Every command in the
   registry currently returns `{ outcome: "error", reason: "NOT_IMPLEMENTED" }`
   regardless of payload — no payload validation exists yet because there is
   no real payload processing to validate against. Per-command Zod request/
   response schemas (ENGINEERING-CONTRACT's "Validate IPC requests and
   responses with Zod") land with each command's real implementation
   (`.scratch/desktop-mvp/issues/12-16`), not speculatively ahead of the
   shapes they'd validate.

## Consequences

- The desktop app now has exactly one Electron IPC channel for all campaign
  operations, matching the ENGINEERING-CONTRACT's "narrow capability-specific
  preload methods" principle at the channel level (one capability: "run a
  campaign command"), with fine-grained authorization/validation living
  inside the dispatcher, not the transport.
- `packages/campaign-engine` becomes the place all future desktop-domain
  type decisions land — screens and tests import from it, not from
  `@bluewave/campaign` directly, keeping the DESIGN-03 canonical engine
  types insulated from UI-convenience reshaping.
- Zod validation is deferred, not skipped — tracked as an explicit
  per-ticket obligation (12-16), not forgotten. A future audit should
  confirm each of those tickets actually adds it before marking the
  desktop MVP acceptance-ready.

## Related requirements

- ENGINEERING-CONTRACT.md, "Electron boundary" and "ADR threshold" sections.

## Related ADRs

- None yet in this track — first ADR for the desktop-mvp effort.
