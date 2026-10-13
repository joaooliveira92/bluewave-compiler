# ADR-0139: Effect Language Service (tsgo) — patch at install and enable the TypeScript integration

## Status

Accepted (2026-10-12).

## Context

ADR-0101 §7 adopted `@effect/tsgo` with the **Oxlint-only** patch
(`effect-tsgo patch --no-typescript --oxlint`), invoked inline by
`pnpm lint:effect`, and set `@effect/language-service` to `diagnostics: false` so
the LSP and Oxlint never double-report.

The upstream `@effect/tsgo setup` wizard (`@effect/tsgo@0.51.1`) prescribes a
different wiring: patch **both** integrations once, at install time, from the
`prepare` lifecycle (`effect-tsgo patch --typescript --oxlint`), add the plugin
options `$schema` to the project tsconfig, and point a VS Code-based editor at
the native tsgo TypeScript server. The repo had only ever wired the Oxlint half:
`prepare` never patched, and `lint:effect` — which CI does not run — was the only
place the patch happened. A plain `pnpm install` therefore left both integrations
unpatched, the editor was never pointed at the Effect LSP, and the Oxlint patch
was dead weight in CI because `pnpm lint:effect` is not a CI step.

## Decision

1. **Patch at install.** The root `prepare` script becomes
   `node scripts/install-hooks.mjs && node scripts/link-claude-skills.mjs && effect-tsgo patch --typescript --oxlint`,
   so a fresh clone patches both integrations once per install and needs no extra
   patch ceremony. This is the wizard default.
2. **Enable the native TypeScript integration.** `effect-tsgo patch --typescript`
   wires the Effect language service into the native TypeScript-Go server in
   addition to Oxlint. This provides in-editor refactors, quickinfo, completions,
   and `tsc`-mode plumbing that the Oxlint-only patch did not.
3. **Oxlint stays the sole diagnostics authority.** `@effect/language-service`
   remains `diagnostics: false`; the Effect **diagnostics** are emitted only by
   the type-aware Oxlint gate (`oxlint.effect.json`). Enabling the TypeScript
   integration does not open a second diagnostics channel, so ADR-0101 §7's
   no-double-report invariant holds.
4. **Plugin-options schema and editor wiring.** `tsconfig.base.json` gains
   `"$schema": "./node_modules/@effect/tsgo/schema.json"` for validation and
   completions of the plugin options. `.vscode/settings.json` gains
   `js/ts.experimental.useTsgo`, `js/ts.tsdk.path`,
   `js/ts.tsdk.promptToUseWorkspaceVersion`, and `js/ts.tsdk.additionalLocations`
   so the workspace resolves the native tsgo server and loads the plugin.
5. **`lint:effect` keeps a self-sufficient Oxlint re-patch.** The script keeps
   its idempotent `effect-tsgo patch --no-typescript --oxlint && oxlint …` prefix
   so the gate works when run outside a fresh install. It deliberately does **not**
   re-patch TypeScript, keeping install-time patching single-sourced and avoiding
   a mid-`pnpm check` rewrite of the TypeScript binary ahead of `typecheck`.

## Consequences

- `pnpm install` runs one extra fast, idempotent patch step; a second run reports
  `already-patched` and writes nothing.
- The Effect LSP is active in a VS Code-based editor (`refactors`, `quickinfo`,
  `completions`, `goto`), while `floatingEffect`, `duplicatePackage` and the rest
  of the diagnostics still come only from `pnpm lint:effect`.
- ADR-0101's single-copy invariant is unchanged: `duplicatePackage` remains an
  Oxlint **error** and `scripts/assert-single-effect.mjs` remains a hard
  `pnpm preflight` gate.
- The `--no-typescript` → `--typescript` shift at install is explicit rather than
  inferred; the Oxlint half of the integration is unchanged.

## Amendments

- Amends ADR-0101 §7 (toolchain): the patch now runs from `prepare` with both
  integrations; the Oxlint-as-diagnostics-authority decision it recorded is
  retained.

## Alternatives considered

- **Keep the Oxlint-only patch.** Rejected: it is the wizard's non-default, it
  left the editor integration half-wired, and it left the patch to a script CI
  never runs.
- **Drop the patch from `lint:effect` and rely on `prepare` alone.** Rejected:
  `lint:effect` would then fail when run before `pnpm install` has patched the
  Oxlint binary; the redundant, idempotent re-patch is cheaper than the failure.
- **Patch only via `lint:effect` (status quo).** Rejected: CI runs `prepare` on
  every install but not `lint:effect`, so neither integration was ever patched in
  CI.

## Related

- ADR-0100, ADR-0101 (Effect adoption and vendoring), ADR-0107 (verification
  hardening), `oxlint.effect.json`, `scripts/assert-single-effect.mjs`.
