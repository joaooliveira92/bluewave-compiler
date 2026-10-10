import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { describe, expect, it } from "vite-plus/test";
import { navalProfiles } from "./helpers/earlyContext.js";

/**
 * Production nation-coverage release gate (ADR-0096). Every nation the 1880 pack
 * offers as playable MUST have an authored national naval profile, unless it is a
 * recorded content gap in UNAUTHORED_PLAYABLE. This is an invariant, not a status
 * board: the allowlist may only shrink (author a profile, then remove the id).
 * A new playable nation without a profile, or a profiled nation that is not
 * playable, fails the gate.
 */
const root = join(__dirname, "..", "..", "..", "content", "production", "1880");

const UNAUTHORED_PLAYABLE = new Set([
  "austria_hungary",
  "italy",
  "japan",
  "qing",
  "russia",
  "spain",
  "usa",
]);

const countries = parse(readFileSync(join(root, "countries.yaml"), "utf8")) as {
  id: string;
  isPlayable?: boolean;
}[];
const playable = countries.filter((c) => c.isPlayable === true).map((c) => c.id);
const profiled = new Set(navalProfiles.map((p) => p.nationId));

describe("production nation coverage (release gate)", () => {
  it("every playable nation is either profiled or a recorded content gap", () => {
    const unauthored = playable.filter((id) => !profiled.has(id)).sort();
    expect(unauthored).toEqual([...UNAUTHORED_PLAYABLE].sort());
  });

  it("no profiled nation is outside the playable set", () => {
    const selectable = new Set(playable);
    for (const profile of navalProfiles) {
      expect(selectable.has(profile.nationId), `${profile.nationId} is profiled but not playable`);
    }
  });

  it("the allowlist contains no nation that is already profiled", () => {
    for (const id of UNAUTHORED_PLAYABLE) {
      expect(profiled.has(id), `${id} is profiled; remove it from UNAUTHORED_PLAYABLE`).toBe(false);
    }
  });
});
