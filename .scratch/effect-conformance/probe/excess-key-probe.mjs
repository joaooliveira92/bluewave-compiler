#!/usr/bin/env node
// Throwaway executable probe — ticket 04
// (.scratch/effect-conformance/issues/04-schema-struct-excess-key-contradiction.md)
//
// Settles the real `effect@4.0.2` behaviour of `Schema.Struct` on excess keys,
// against the byte-identical vendored artifact (vendor/effect, UPSTREAM.md).
//
// Run from the repo root:  node .scratch/effect-conformance/probe/excess-key-probe.mjs
//
// Authority: vendor/effect/dist is exactly what a consumer of the workspace
// `effect` package loads (`import { Schema } from "effect"`), so importing it by
// relative path here is importing the vendored artifact. The durable write-up of
// this probe lives in docs/research/effect-conformance-04-schema-struct-excess-key.md.

import { readFileSync } from "node:fs"
import { Result, Schema } from "../../../vendor/effect/dist/index.js"

const vendoredVersion = JSON.parse(
  readFileSync(new URL("../../../vendor/effect/package.json", import.meta.url), "utf8"),
).version

const schema = Schema.Struct({ a: Schema.String })
const sym = Symbol("sym")
const input = { a: "a", extra: "x", third: "y", [sym]: "s" }

let failures = 0

function report(label, actual, expected) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected)
  if (!pass) failures += 1
  console.log(`${pass ? "PASS" : "FAIL"}  ${label}`)
  console.log(`        actual   = ${JSON.stringify(actual)}`)
  console.log(`        expected = ${JSON.stringify(expected)}`)
}

// Symbol-keyed properties are invisible to JSON.stringify, so compare the full
// own-key set explicitly (this is the case the "strips string *and* symbol" claim
// rests on).
function ownKeysShape(value) {
  return {
    strings: Object.keys(value).sort(),
    symbols: Object.getOwnPropertySymbols(value).map(String),
  }
}

console.log(`effect version: vendored ${vendoredVersion}`)
console.log("input:", JSON.stringify(input), "symbol key present:", sym in input)
console.log("")

// 1. Default decode (no options): is `extra` stripped, kept, or rejected?
const defaultDecoded = Schema.decodeUnknownSync(schema)(input)
report("1. default decode strips string AND symbol excess keys", ownKeysShape(defaultDecoded), {
  strings: ["a"],
  symbols: [],
})

// 2. Explicit `onExcessProperty: "ignore"`: strips, same as default.
const ignoreDecoded = Schema.decodeUnknownSync(schema, { onExcessProperty: "ignore" })(input)
report("2. {onExcessProperty:'ignore'} strips string AND symbol excess keys", ownKeysShape(ignoreDecoded), {
  strings: ["a"],
  symbols: [],
})

// 3. `onExcessProperty: "error"`: rejects.
let errorThrew = false
let errorMessage = ""
try {
  Schema.decodeUnknownSync(schema, { onExcessProperty: "error" })(input)
} catch (e) {
  errorThrew = true
  errorMessage = String(e?.message ?? e)
}
report("3. {onExcessProperty:'error'} rejects", errorThrew, true)
console.log(`        message  = ${JSON.stringify(errorMessage)}`)

// 3b. The Result-returning form fails too (not a defect throw).
const errorResult = Schema.decodeUnknownResult(schema, { onExcessProperty: "error" })(input)
report("3b. decodeUnknownResult + error is a failure", Result.isFailure(errorResult), true)

// 3c. A declared symbol key is NOT excess under "error".
const symSchema = Schema.Struct({ a: Schema.String, [sym]: Schema.String })
const symError = Schema.decodeUnknownResult(symSchema, { onExcessProperty: "error" })(
  { a: "a", [sym]: "s" },
)
report("3c. declared symbol key is covered, not excess", Result.isSuccess(symError), true)

// 4. JSON-Schema emission default: is it open ("ignore") or closed?
const doc = Schema.toJsonSchemaDocument(schema)
const json = JSON.stringify(doc)
const additionalPropertiesFalse = /"additionalProperties":false/.test(json)
report(
  "4. JSON-Schema default is open (no additionalProperties:false)",
  additionalPropertiesFalse,
  false,
)
console.log(`        additionalProperties in doc = ${/"additionalProperties":[^,}]*/.exec(json)?.[0] ?? "(absent)"}`)

console.log("")
console.log(failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
