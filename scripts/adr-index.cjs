#!/usr/bin/env node
// Generate docs/adr/README.md from the ADR files themselves (ADR-0095).
//
// The index is a build artefact of the ADR corpus: titles come from each file's
// H1, the Status cell from its `## Status` lead keyword, and the Superseded-by
// cell from its `Superseded by:` line. docs-check fails when the committed index
// differs from this generator's output, so the two cannot drift.
//
// Curated input: the AREAS map below. Every ADR must be assigned to exactly one
// area; a new ADR without a home makes the generator (and therefore preflight)
// fail loudly rather than land unlisted.
//
// Regenerate: `pnpm adr:index`.

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const ADR_DIR = path.join(ROOT, "docs/adr");

// Closed vocabulary of index sections, in display order.
const AREAS = [
  {
    name: "Foundations",
    blurb: "Core engine geometry, determinism, persistence, and the compiler pipeline.",
    nums: [1, 2, 3, 4, 5, 6, 7, 8, 9, 32, 34, 35, 36, 37],
  },
  {
    name: "Effect adoption",
    blurb:
      "Adopting and vendoring Effect v4: the validator/runtime idiom, the read-only agent reference, and the determinism demotion.",
    nums: [100, 101, 102, 103, 104, 105],
  },
  {
    name: "Campaign & strategy",
    blurb: "Strategic layer: diplomacy, economy, fleet, officers, command screens, and time.",
    nums: [10, 11, 54, 60, 61, 62, 65, 68, 71, 75, 81, 86],
  },
  {
    name: "Combat",
    blurb:
      "Battle generation, tactical resolution, gunnery, torpedoes, mines, air, coastal defense, damage, weather.",
    nums: [
      12, 14, 15, 16, 17, 18, 19, 20, 21, 22, 25, 26, 27, 31, 33, 39, 40, 41, 42, 44, 46, 47, 48,
      49, 50, 51, 52, 53, 56, 72, 73, 93, 94, 97, 98,
    ],
  },
  {
    name: "Ship design & construction",
    blurb: "Ship design, classification, construction, repair, and rebuild.",
    nums: [13, 63, 64, 66, 67, 70, 74, 76, 77, 78, 80, 83, 85, 88, 116],
  },
  {
    name: "National content",
    blurb: "National naval profiles, the content pipeline, and AI procurement.",
    nums: [89, 90, 91, 92, 108, 109, 110, 111, 114, 117],
  },
  {
    name: "Desktop & UI",
    blurb: "Electron boundary, renderer screens, UX, and presentation.",
    nums: [23, 24, 28, 29, 30, 38, 55, 57, 58, 59, 69, 79, 82, 84, 87],
  },
  {
    name: "Process & documentation",
    blurb: "Repo process, docs/ADR authority, and release gates.",
    nums: [45, 95, 96, 99, 106, 107],
  },
];

const STATUS_OK = new Set(["accepted", "proposed", "deprecated", "superseded"]);
const pad = (n) => String(n).padStart(4, "0");

function buildIndex() {
  const files = fs
    .readdirSync(ADR_DIR)
    .filter((f) => /^ADR-\d{4}-.*\.md$/.test(f))
    .sort();

  const adrs = new Map();
  for (const f of files) {
    const n = Number(f.match(/ADR-(\d{4})/)[1]);
    const text = fs.readFileSync(path.join(ADR_DIR, f), "utf8");
    const h1 = text.match(/^# (.*)$/m);
    if (!h1) throw new Error(`${f}: missing H1 title`);
    const sm = text.match(/^## Status\s*\n+([^\n]+)/m);
    if (!sm) throw new Error(`${f}: missing "## Status" section`);
    const kw = (sm[1].trim().match(/^([a-z]+)/i) || [])[1]?.toLowerCase();
    if (!STATUS_OK.has(kw)) throw new Error(`${f}: status "${kw ?? "?"}" is not canonical`);
    const sup = text.match(/^Superseded by:\s*(ADR-\d{4})/m);
    adrs.set(n, {
      file: f,
      title: h1[1].replace(/^ADR-\d{4}:\s*/, ""),
      status: kw,
      supersededBy: sup ? sup[1] : null,
    });
  }

  // The area map must be a partition of the ADR set.
  const assigned = AREAS.flatMap((a) => a.nums);
  const missing = [...adrs.keys()].filter((n) => !assigned.includes(n));
  const extra = assigned.filter((n) => !adrs.has(n));
  if (missing.length || extra.length) {
    throw new Error(
      `scripts/adr-index.cjs AREAS map is not a partition of the ADRs ` +
        `(unassigned: ${missing.map(pad).join(", ") || "none"}; ` +
        `unknown: ${extra.map(pad).join(", ") || "none"})`,
    );
  }

  const max = Math.max(...adrs.keys());
  const out = [
    "# Architecture decision records",
    "",
    "One ADR per durable decision: `ADR-NNNN-<slug>.md`. New decisions take the",
    `highest existing number + 1 (the next number is ADR-${pad(max + 1)}).`,
    "Refresh this table from each file's H1 when one is added or re-titled.",
    "(ADR-0043 was never written; the sequence intentionally continues at 0044.)",
    "See [DESIGN amendments](AMENDMENTS.md) for which ADRs amend which DESIGN doc.",
    "Work an ADR records as deferred is tracked in [DEFERRALS](../DEFERRALS.md).",
    "",
    "Rows are grouped by area; the Status and Superseded-by cells mirror each ADR's",
    "own `## Status` / `Superseded by:` lines (`pnpm preflight` fails when either",
    "drifts). Process-only records are kept together under Process & documentation.",
    "",
  ];

  for (const { name, blurb, nums } of AREAS) {
    out.push(
      `## ${name}`,
      "",
      blurb,
      "",
      "| # | File | Title | Status | Superseded by |",
      "| --- | --- | --- | --- | --- |",
    );
    for (const n of nums) {
      const { file, title, status, supersededBy } = adrs.get(n);
      out.push(
        `| ${pad(n)} | [${file}](${file}) | ${title} | ${status} | ${supersededBy ?? "—"} |`,
      );
    }
    out.push("");
  }

  return out.join("\n");
}

module.exports = { buildIndex };

if (require.main === module) {
  const target = path.join(ADR_DIR, "README.md");
  fs.writeFileSync(target, buildIndex());
  console.log(`adr-index: wrote ${path.relative(ROOT, target)}`);
}
