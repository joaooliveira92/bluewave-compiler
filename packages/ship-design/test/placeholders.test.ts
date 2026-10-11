import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";

/**
 * Release ratchet. Content values with no source are marked PLACEHOLDER (ticket 30 lists them). Their number may only go DOWN:
 * replacing one with a sourced value means lowering the ceiling here in the same change; adding one means the new value has to be
 * justified in the review, because this test fails.
 */
const CEILING: Record<string, number> = {
  "balance.yaml": 1,
  // Raised 26 -> 50 by the pre-1880 armament pass: the new RML/early-BL and foreign guns carry PLACEHOLDER volume and deck
  // footprint figures (no source gives a per-gun volume), while their mass/charge/projectile/M.V. are sourced. Sources:
  // docs/research/ship-building-1880-pre-era-armament.md. Every marker is justified in the review; the ceiling stays put otherwise.
  "components.yaml": 50,
  "plants.yaml": 1,
  // Lowered 1 -> 0: merchant_liner_form is no longer a borrowed-coefficient PLACEHOLDER; formBp is now fitted to White
  // 1894's passenger-steamer hull fraction (docs/research/ship-building-merchant-liner.md, ADR-0088).
  "hull-forms.yaml": 0,
  // Reference designs are split per nation under reference-designs/ (ADR-0109); the whole tree must stay at zero.
  "reference-designs": 0,
};
const dir = join(process.cwd(), "..", "..", "content", "production", "1880", "ship-building");
const countFile = (path: string) =>
  readFileSync(path, "utf8")
    .split("\n")
    .filter((line) => line.includes("PLACEHOLDER")).length;
const count = (rel: string): number => {
  const path = join(dir, rel);
  if (!statSync(path).isDirectory()) return countFile(path);
  return readdirSync(path).reduce((n, entry) => {
    const child = join(path, entry);
    if (statSync(child).isDirectory()) return n + count(join(rel, entry));
    return entry.endsWith(".yaml") ? n + countFile(child) : n;
  }, 0);
};

describe("unsourced content values (PLACEHOLDER ratchet)", () => {
  for (const [file, ceiling] of Object.entries(CEILING)) {
    it(`${file} has no more than ${String(ceiling)} placeholder markers`, () => {
      expect(count(file)).toBeLessThanOrEqual(ceiling);
    });
  }
  it("the ceilings are tight: a removed placeholder lowers its ceiling", () => {
    for (const [file, ceiling] of Object.entries(CEILING)) expect(count(file)).toBe(ceiling);
  });
  it("the revision constants are decided design values, not placeholders", () => {
    const text = readFileSync(join(dir, "balance.yaml"), "utf8");
    const block = text.slice(text.indexOf("\nrevision:"));
    expect(block).not.toContain("PLACEHOLDER");
  });
});
