#!/usr/bin/env node
// Documentation hygiene gate (ADR-0095).
//
// Three checks over the canonical docs, cheapest failures first:
//   1. relative markdown links resolve (docs/**, root *.md, .ai/*.md)   -> FAIL
//   2. docs/adr/README.md index matches the ADR files + next number      -> FAIL
//   3. ADRs referencing a DESIGN-N are classified in AMENDMENTS.md       -> WARN
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
const adrFiles = tracked("docs/adr/ADR-*.md")
  .map((f) => ({ f, n: path.basename(f).match(/ADR-(\d{4})/)?.[1] }))
  .filter((x) => x.n);
const adrReadmePath = path.join(root, "docs/adr/README.md");
if (!fs.existsSync(adrReadmePath)) {
  problems.push("docs/adr/README.md is missing");
} else {
  const readme = fs.readFileSync(adrReadmePath, "utf8");
  const listed = new Set([...readme.matchAll(/\[ADR-(\d{4})-/g)].map((m) => m[1]));
  const missing = adrFiles.filter((x) => !listed.has(x.n)).map((x) => x.n);
  if (missing.length)
    problems.push(
      `docs/adr/README.md is missing rows for: ${missing.map((n) => "ADR-" + n).join(", ")}`,
    );
  const max = Math.max(...adrFiles.map((x) => Number(x.n)));
  const next = String(max + 1).padStart(4, "0");
  const declared = readme.match(/next number is ADR-(\d{4})/)?.[1];
  if (declared !== next)
    problems.push(`docs/adr/README.md says next is ADR-${declared ?? "?"}; should be ADR-${next}`);
}

// ---- 3. amendment classification (warn only) ----
const amendPath = path.join(root, "docs/adr/AMENDMENTS.md");
if (fs.existsSync(amendPath)) {
  const amend = fs.readFileSync(amendPath, "utf8");
  const table = (amend.split("| DESIGN doc")[1] ?? "").split("\n");
  const classified = new Set();
  for (const line of table) {
    for (const a of line.matchAll(/ADR-(\d{4})/g)) classified.add(a[1]);
  }
  const candidates = [];
  for (const { f, n } of adrFiles) {
    const text = fs.readFileSync(path.join(root, f), "utf8");
    for (const d of new Set([...text.matchAll(/DESIGN-(\d+)/g)].map((m) => m[1]))) {
      if (!classified.has(n)) {
        candidates.push(`ADR-${n} references DESIGN-${d}`);
        break;
      }
    }
  }
  if (candidates.length)
    warnings.push(
      `${candidates.length} ADR(s) reference a DESIGN doc but are not classified in ` +
        `docs/adr/AMENDMENTS.md (candidate amendments — add the real ones, ignore scope-only ADRs):`,
    );
  for (const c of candidates.slice(0, 8)) warnings.push(`      ${c}`);
  if (candidates.length > 8) warnings.push(`      … ${candidates.length - 8} more`);
} else {
  warnings.push("docs/adr/AMENDMENTS.md is missing — amendment classification cannot be checked");
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
