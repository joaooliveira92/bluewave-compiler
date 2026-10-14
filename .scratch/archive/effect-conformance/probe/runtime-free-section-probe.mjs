#!/usr/bin/env node
// Throwaway executable probe — ticket 05
// (.scratch/effect-conformance/issues/05-declination-confirmation.md)
//
// Confirms that `scripts/assert-runtime-free.mjs` is the machine gate that keeps
// every declined ai-docs section declined: it is a *closed allowlist*, so a
// representative import of each declined section's API must fail closed, while
// the eight runtime-free symbols must be admitted.
//
// Run from the repo root:
//   node .scratch/effect-conformance/probe/runtime-free-section-probe.mjs
//
// Authority: the gate imports its allowlist (`RUNTIME_FREE_SYMBOLS`) and its
// checker (`findRuntimeImports`) from the same module `pnpm preflight` runs, so
// this probe exercises the real gate, not a copy. The durable write-up lives in
// docs/research/effect-conformance-05-declination.md.

import { findRuntimeImports, RUNTIME_FREE_SYMBOLS } from "../../../scripts/assert-runtime-free.mjs"

/** @type {ReadonlyArray<{section: string, source: string, expect: "reject"|"allow"}>} */
const CASES = [
  // --- declined runtime sections: every representative import must fail closed ---
  { section: "01_effect/03_services (Context.Service)", source: 'import { Context } from "effect";', expect: "reject" },
  { section: "01_effect/03_services (Layer)", source: 'import { Layer } from "effect";', expect: "reject" },
  { section: "01_effect/05_resources (Effect.acquireRelease)", source: 'import { Effect } from "effect";', expect: "reject" },
  { section: "01_effect/05_resources (Scope)", source: 'import { Scope } from "effect";', expect: "reject" },
  { section: "01_effect/05_resources (LayerMap)", source: 'import { LayerMap } from "effect";', expect: "reject" },
  { section: "01_effect/06_running (NodeRuntime)", source: 'import { NodeRuntime } from "effect";', expect: "reject" },
  { section: "01_effect/07_pubsub (PubSub)", source: 'import { PubSub } from "effect";', expect: "reject" },
  { section: "03_stream (Stream)", source: 'import { Stream } from "effect";', expect: "reject" },
  { section: "03_stream (effect/NodeStream)", source: 'import { NodeStream } from "effect/NodeStream";', expect: "reject" },
  { section: "04_integration (ManagedRuntime)", source: 'import { ManagedRuntime } from "effect";', expect: "reject" },
  { section: "05_batching (Request/RequestResolver)", source: 'import { Request, RequestResolver } from "effect";', expect: "reject" },
  { section: "06_schedule (Schedule)", source: 'import { Schedule } from "effect";', expect: "reject" },
  { section: "07_datetime (DateTime)", source: 'import { DateTime } from "effect";', expect: "reject" },
  { section: "08_observability (Logger/Metric)", source: 'import { Logger, Metric } from "effect";', expect: "reject" },
  { section: "08_observability (effect/observability)", source: 'import * as Otlp from "effect/observability";', expect: "reject" },
  { section: "09_testing (@effect/vitest)", source: 'import { it } from "@effect/vitest";', expect: "reject" },
  // --- the allowlisted runtime-free surface must be admitted (incl. Predicate) ---
  { section: "10_predicate (Predicate allowed)", source: 'import { Predicate } from "effect";', expect: "allow" },
  { section: "allowlist (Schema/Data/Option/Equal/Hash/Result/SchemaIssue)", source: 'import { Schema, Data, Option, Equal, Hash, Result, SchemaIssue } from "effect";', expect: "allow" },
]

let failures = 0

for (const { section, source, expect } of CASES) {
  const findings = findRuntimeImports("probe.ts", source)
  const actual = findings.length > 0 ? "reject" : "allow"
  const pass = actual === expect
  if (!pass) failures += 1
  const detail = findings.length > 0 ? ` — ${findings.map((f) => f.detail).join("; ")}` : ""
  console.log(`  ${pass ? "ok  " : "FAIL"} [${expect}] ${section}${detail}`)
}

console.log(`\nallowlist (sorted): ${[...RUNTIME_FREE_SYMBOLS].sort().join(", ")}`)
console.log(failures === 0 ? `\n${CASES.length}/${CASES.length} — runtime-free gate declines every declined section` : `\n${failures} FAILED`)
process.exitCode = failures === 0 ? 0 : 1