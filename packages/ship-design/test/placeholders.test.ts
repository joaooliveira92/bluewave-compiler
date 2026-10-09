import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";

/**
 * Release ratchet. Content values with no source are marked PLACEHOLDER (ticket 30 lists them). Their number may only go DOWN:
 * replacing one with a sourced value means lowering the ceiling here in the same change; adding one means the new value has to be
 * justified in the review, because this test fails.
 */
const CEILING: Record<string, number> = {
  "balance.yaml": 2,
  "components.yaml": 34,
  "plants.yaml": 1,
  "hull-forms.yaml": 0,
  "reference-designs.yaml": 1,
};
const dir = join(process.cwd(), "..", "..", "content", "production", "1880", "ship-building");
const count = (file: string) =>
  readFileSync(join(dir, file), "utf8")
    .split("\n")
    .filter((line) => line.includes("PLACEHOLDER")).length;

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
