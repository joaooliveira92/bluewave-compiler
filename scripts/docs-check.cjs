#!/usr/bin/env node
// Documentation hygiene gate (ADR-0095).
//
// Four checks over the canonical docs, cheapest failures first:
//   1. relative markdown links resolve (docs/**, root *.md, .ai/*.md)   -> FAIL
//   2. docs/adr/README.md index matches the ADR files + next number      -> FAIL
//   3. every ADR has a valid `## Status` section, matching its index row -> FAIL
//   4. ADRs referencing a DESIGN-N are classified in AMENDMENTS.md       -> FAIL
//
// Wired into `pnpm preflight` (and therefore `pnpm dev` / `pnpm check`).
// Standalone: `node scripts/docs-check.cjs`.

"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const problems = [];
const warnings = [];

function git(args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}
function tracked(pattern) {
  return git(["ls-files", pattern]).split("\n").filter(Boolean);
}

// ---- 1. relative link integrity ----
// git pathspecs are recursive for `*.md`, so filter to the canonical scope:
// everything under docs/, the root markdown files, and .ai/*.md.
const LINK_SCOPE = tracked("*.md").filter(
  (f) => f.startsWith("docs/") || !f.includes("/") || /^\.ai\/[^/]+\.md$/.test(f),
);
const LINK_RE = /\]\(([^)]+)\)/g;
let linkCount = 0;
for (const file of LINK_SCOPE) {
  const dir = path.dirname(path.join(root, file));
  const text = fs.readFileSync(path.join(root, file), "utf8");
  for (const m of text.matchAll(LINK_RE)) {
    const target = m[1].split("#")[0].trim();
    if (!target || target.startsWith("<") || /^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
    if (!target.endsWith(".md")) continue;
    linkCount++;
    const resolved = path.resolve(dir, decodeURIComponent(target));
    if (!fs.existsSync(resolved)) {
      problems.push(`broken link: ${file} -> ${m[1]}`);
    }
  }
}

// ---- 2. ADR index sync ----
// Read the directory (not git) so a newly created, not-yet-staged ADR is counted.
const adrFiles = fs
  .readdirSync(path.join(root, "docs/adr"))
  .filter((f) => /^ADR-\d{4}-.*\.md$/.test(f))
  .map((f) => ({ f: `docs/adr/${f}`, n: f.match(/ADR-(\d{4})/)[1] }));

// Canonical status keyword: the first word of the `## Status` section body.
// The free-text note after it is unconstrained; the lead word is not.
const STATUS_OK = new Set(["accepted", "proposed", "deprecated", "superseded"]);
function adrStatus(text) {
  const m = text.match(/^## Status\s*\n+([^\n]+)/m);
  if (!m) return null;
  const kw = m[1].trim().match(/^([a-z]+)/i);
  return kw ? kw[1].toLowerCase() : null;
}

const adrReadmePath = path.join(root, "docs/adr/README.md");
if (!fs.existsSync(adrReadmePath)) {
  problems.push("docs/adr/README.md is missing");
} else {
  const readme = fs.readFileSync(adrReadmePath, "utf8");
  // Index rows end in a Status cell, so a row without one counts as missing.
  const rowRe = /^\|\s*(\d{4})\s*\|.*\[ADR-\d{4}-[^\]]*\]\([^)]+\)\s*\|.*\|\s*([a-z]+)\s*\|\s*$/;
  const rows = new Map(); // number -> status cell
  for (const line of readme.split("\n")) {
    const m = line.match(rowRe);
    if (!m) continue;
    if (rows.has(m[1])) problems.push(`docs/adr/README.md lists ADR-${m[1]} more than once`);
    rows.set(m[1], m[2].toLowerCase());
  }
  const missing = adrFiles.filter((x) => !rows.has(x.n)).map((x) => x.n);
  if (missing.length)
    problems.push(
      `docs/adr/README.md is missing rows for: ${missing.map((n) => "ADR-" + n).join(", ")}`,
    );
  const max = Math.max(...adrFiles.map((x) => Number(x.n)));
  const next = String(max + 1).padStart(4, "0");
  const declared = readme.match(/next number is ADR-(\d{4})/)?.[1];
  if (declared !== next)
    problems.push(`docs/adr/README.md says next is ADR-${declared ?? "?"}; should be ADR-${next}`);

  for (const { f, n } of adrFiles) {
    if (!rows.has(n)) continue;
    const kw = adrStatus(fs.readFileSync(path.join(root, f), "utf8"));
    if (kw !== rows.get(n))
      problems.push(
        `docs/adr/README.md row ADR-${n} status "${rows.get(n)}" ` +
          `does not match the ADR's status "${kw ?? "none"}"`,
      );
  }
}

// ---- 3. ADR status sections ----
for (const { f, n } of adrFiles) {
  const kw = adrStatus(fs.readFileSync(path.join(root, f), "utf8"));
  if (kw === null) problems.push(`ADR-${n} has no "## Status" section`);
  else if (!STATUS_OK.has(kw))
    problems.push(`ADR-${n} status "${kw}" is not one of {${[...STATUS_OK].join(", ")}}`);
}

// ---- 4. amendment classification ----
const amendPath = path.join(root, "docs/adr/AMENDMENTS.md");
if (!fs.existsSync(amendPath)) {
  problems.push("docs/adr/AMENDMENTS.md is missing — amendment classification cannot be checked");
} else {
  const amend = fs.readFileSync(amendPath, "utf8");
  const classified = new Set();
  for (const a of amend.matchAll(/ADR-(\d{4})/g)) classified.add(a[1]);
  for (const { f, n } of adrFiles) {
    if (classified.has(n)) continue;
    const text = fs.readFileSync(path.join(root, f), "utf8");
    for (const d of new Set([...text.matchAll(/DESIGN-(\d+)/g)].map((m) => m[1]))) {
      problems.push(
        `ADR-${n} references DESIGN-${d} but is classified in neither the Amendments nor ` +
          `the Scope/process section of docs/adr/AMENDMENTS.md`,
      );
      break;
    }
  }
}

// ---- report ----
if (warnings.length) {
  console.warn("docs-check: warnings");
  for (const w of warnings) console.warn(`  - ${w}`);
}
if (problems.length) {
  console.error("docs-check: FAILED\n");
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`docs-check: ok (${linkCount} links, ${adrFiles.length} ADRs indexed)`);
