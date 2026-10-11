import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { NationNavalProfile, RawReferenceDesign } from "@bluewave/ship-design";
import { parse } from "yaml";

const root = join(__dirname, "..", "..", "..", "..", "content", "production", "1880");
const sbDir = join(root, "ship-building");

/** Naval profiles live one file per nation under `ship-building/naval-profiles/` (ADR-0109). */
export const readNavalProfileEntries = (): NationNavalProfile[] =>
  readdirSync(join(sbDir, "naval-profiles"))
    .filter((f) => f.endsWith(".yaml"))
    .sort()
    .flatMap(
      (f) =>
        (
          parse(readFileSync(join(sbDir, "naval-profiles", f), "utf8")) as {
            navalProfiles: NationNavalProfile[];
          }
        ).navalProfiles,
    );

/** Deterministic nation order: the UK set leads, so `references[0]` stays the historical default. */
const nationOrder = (a: string, b: string): number =>
  a === b ? 0 : a === "uk" ? -1 : b === "uk" ? 1 : a < b ? -1 : 1;

/** Reference designs live one directory per nation (`starters.yaml` + `historical.yaml`) (ADR-0109). */
export const readReferenceDesignEntries = (): RawReferenceDesign[] =>
  readdirSync(join(sbDir, "reference-designs"))
    .sort(nationOrder)
    .flatMap((nation) =>
      ["starters.yaml", "historical.yaml"].flatMap((name) => {
        const path = join(sbDir, "reference-designs", nation, name);
        return existsSync(path)
          ? (parse(readFileSync(path, "utf8")) as { designs: RawReferenceDesign[] }).designs
          : [];
      }),
    );
