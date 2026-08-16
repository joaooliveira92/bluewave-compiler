# Ticket 02 — Toolchain Compatibility

**Type:** research
**Status:** resolved
**Blocked by:** none

## Question

Does Effect v4 compile and run cleanly under this repo's exact toolchain:
TypeScript 7.0.2 (native tsgo — does consumer code need erasable-only syntax,
no enums / parameter properties?), `module: NodeNext` + composite/declarationMap
builds, pnpm 11 workspace + turbo, the `vp` (vite-plus) lint/format/test runner,
and Vite-bundled Electron main + renderer (ESM)? Is `effect` ESM-only? What is
the renderer bundle-size and startup impact of importing `effect` modules? Any
known vite / electron / tsgo interop gotchas?

Resolve via a `/research` subagent against primary sources (Effect docs + repo,
TypeScript tsgo docs, Vite/Electron issues). Context pointer →
`docs/research/effect-v4-toolchain-compatibility.md`.

## Answer

Research note: `docs/research/effect-v4-toolchain-compatibility.md`
(empirically verified against the repo's exact compiler `typescript@7.0.2` ×
`effect@4.0.0-rc.109`). (1) **Clean under tsgo/erasable-only**: all standard v4
consumer idioms compile with `erasableSyntaxOnly` + `verbatimModuleSyntax`;
keep `skipLibCheck: true` (load-bearing — `Channel.d.ts` references DOM
`TextDecoderOptions`). (2) **NodeNext + composite works** (`tsc -b` clean).
(3) **ESM-only in v4** (single build; v3.22.1 still dual) — TS ≥ 5.9 / Node ≥
18 / `strict`, repo exceeds all. (4) **No vite/electron/vp blockers**; do not
import `effect` in the sandboxed preload (electron-vite externalizes
dependencies). (5) Bundle cost (BALANCE TARGET): core Effect 28 kB gzip, +Schema
68 kB gzip, realistic set ~86 kB gzip; `msgpackr` is a new v4 dependency (pure-JS
fallback OK under `allowBuilds`). Hand-off notes: erasableSyntaxOnly-on and
preload policy → ticket 05; bundle budget → ticket 06.