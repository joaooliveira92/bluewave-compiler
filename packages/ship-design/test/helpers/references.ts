import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import type { DesignDraft } from "../../src/index.js";

const file = parse(
  readFileSync(
    join(
      __dirname,
      "..",
      "..",
      "..",
      "..",
      "content",
      "production",
      "1880",
      "ship-building",
      "reference-designs.yaml",
    ),
    "utf8",
  ),
) as {
  designs: { id: string; name: string; month: string; draft: DesignDraft }[];
};
const by = (id: string) => file.designs.find((d) => d.id === id)!.draft;

/** Reference designs now live in content/production/1880/ship-building/reference-designs.yaml (shared with the UI). */
export const havock = by("havock_like");
export const majestic = by("majestic_like");
