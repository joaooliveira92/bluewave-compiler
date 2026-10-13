#!/usr/bin/env node
// Throwaway executable probe — ticket 09
// (.scratch/effect-conformance/issues/09-scripts-lint-effect-scope.md)
//
// Scans the whole `scripts/**` tree (recursively) for any import/export/require
// of `effect` or `@effect/*`, and counts the ambient-IO sites the Effect
// determinism advisories (`globalDate`/`globalRandom`/`processEnv`/
// `nodeBuiltinImport`) would flag if `lint:effect` were extended to cover them.
//
// The verdict this probe supports: `scripts/**` imports Effect nowhere, while it
// legitimately uses `process.env` / `readdirSync` / `new Date()` — so extending
// the Effect gate would produce only false positives. See
// docs/research/effect-conformance-09-scripts-lint-effect.md.
//
// Run from the repo root:
//   node .scratch/effect-conformance/probe/scripts-effect-usage-probe.mjs

import { readdirSync, readFileSync } from "node:fs"
import { join, relative, resolve } from "node:path"
import { parseSync } from "oxc-parser"

const ROOT = resolve(import.meta.dirname, "../../..")
const SCRIPTS = join(ROOT, "scripts")
const SOURCE_RE = /\.(?:[cm]?[jt]s|[jt]sx)$/u

/** All authored source files under scripts/, sorted, repo-relative. */
function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const abs = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(abs))
    else if (SOURCE_RE.test(entry.name)) out.push(relative(ROOT, abs))
  }
  return out
}

/** Every `effect`/`@effect/*` module specifier referenced by import/export/require. */
function effectSpecifiers(text) {
  const { program, errors } = parseSync("probe.ts", text)
  if (errors.length > 0) throw new Error(`cannot parse probe input: ${errors[0].message}`)
  const specifiers = []
  const visit = (node) => {
    if (node === null || typeof node !== "object") return
    if (Array.isArray(node)) return node.forEach(visit)
    if (typeof node.type === "string" && /^(?:Import|Export).*(?:Declaration|Specifier|Expression)$/u.test(node.type)) {
      const value = node.source?.value
      if (typeof value === "string" && (value === "effect" || value.startsWith("effect/") || value.startsWith("@effect/"))) {
        specifiers.push(value)
      }
    }
    if (node.type === "CallExpression" && node.callee?.type === "Identifier" && node.callee.name === "require") {
      const value = node.arguments?.[0]?.value
      if (typeof value === "string" && (value === "effect" || value.startsWith("effect/") || value.startsWith("@effect/"))) {
        specifiers.push(value)
      }
    }
    for (const key of Object.keys(node)) {
      if (key === "parent") continue
      visit(node[key])
    }
  }
  visit(program)
  return specifiers
}

const AMBIENT = [
  { label: "process.env", re: /process\.env\b/u },
  { label: "readdir(Sync)", re: /readdirSync|readdir\(/u },
  { label: "new Date()/Date.now", re: /new Date\(\)|Date\.now/u },
  { label: "Math.random/randomUUID", re: /Math\.random|randomUUID/u },
]

const files = walk(SCRIPTS)
let effectHits = 0
const ambient = Object.fromEntries(AMBIENT.map((a) => [a.label, 0]))

for (const file of files) {
  const text = readFileSync(join(ROOT, file), "utf8")
  const specs = effectSpecifiers(text)
  if (specs.length > 0) {
    effectHits += specs.length
    console.log(`  FAIL effect import in ${file}: ${specs.join(", ")}`)
  }
  for (const { label, re } of AMBIENT) if (re.test(text)) ambient[label] += 1
}

console.log(`\nscanned ${files.length} authored script files under scripts/**`)
console.log(`effect/@effect module references: ${effectHits}`)
for (const { label } of AMBIENT) console.log(`  ${label}: ${ambient[label]} file(s)`)
console.log(
  effectHits === 0
    ? "\n0 effect imports — nothing for lint:effect to cover; extending the gate would only flag the ambient-IO tooling above"
    : `\n${effectHits} effect reference(s) found — re-open the scope decision`,
)
process.exitCode = effectHits === 0 ? 0 : 1
