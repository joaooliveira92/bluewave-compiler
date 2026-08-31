import { describe, it, expect } from "vite-plus/test";
import { type Nation, type NationId, NationIdSchema, NationSchema } from "../src/index.js";
import { fixtureNations } from "./nation-fixtures.js";

const EXPECTED_TAGS: Record<NationId, string> = {
  uk: "GBR",
  germany: "GER",
  usa: "USA",
  japan: "JPN",
  france: "FRA",
  italy: "ITA",
  russia: "RUS",
  austria_hungary: "AUT",
  spain: "ESP",
  qing: "CHI",
  ottoman_empire: "OTT",
  egypt: "EGY",
  netherlands: "NLD",
  belgium: "BEL",
  denmark: "DEN",
  sweden_norway: "SWE",
  portugal: "POR",
  greece: "GRC",
  brazil: "BRA",
  chile: "CHL",
  argentina: "ARG",
  korea: "KOR",
  persia: "PRS",
  siam: "SIA",
};

function corpusNations(): Nation[] {
  return fixtureNations();
}

describe("NationSchema", () => {
  it("exports a 24-member lowercase NationId enum", () => {
    expect(NationIdSchema.options).toHaveLength(24);
    for (const id of NationIdSchema.options) {
      expect(id).toMatch(/^[a-z_]+$/);
    }
  });

  it("accepted ids exactly cover the research canon ids", () => {
    const enumIds = new Set(NationIdSchema.options);
    const corpusIds = new Set(corpusNations().map((n) => n.id));
    expect([...enumIds].sort()).toEqual([...corpusIds].sort());
  });

  it("parses all 24 research canon objects", () => {
    const nations = corpusNations();
    expect(nations).toHaveLength(24);
    for (const nation of nations) {
      const result = NationSchema.safeParse(nation);
      expect(result.success, `nations/${nation.id} failed: ${JSON.stringify(result.error)}`).toBe(
        true,
      );
    }
  });

  it("locks the uppercase 3-letter tag for every canon nation", () => {
    for (const nation of corpusNations()) {
      expect(nation.tag).toBe(EXPECTED_TAGS[nation.id]);
      expect(nation.tag).toMatch(/^[A-Z]{3}$/);
    }
  });

  it("is strict and rejects unknown keys", () => {
    const nation = corpusNations()[0]!;
    const result = NationSchema.safeParse({ ...nation, unknownField: "x" });
    expect(result.success).toBe(false);
  });

  it("rejects an id outside the canonical 24-member enum", () => {
    const nation = { ...corpusNations()[0]!, id: "atlantis" };
    const result = NationSchema.safeParse(nation);
    expect(result.success).toBe(false);
  });

  it("rejects a lowercase or non-3-letter tag", () => {
    const base = corpusNations()[0]!;
    expect(NationSchema.safeParse({ ...base, tag: "gbr" }).success).toBe(false);
    expect(NationSchema.safeParse({ ...base, tag: "GB" }).success).toBe(false);
  });

  it("rejects non-hex presentation colors", () => {
    const base = corpusNations()[0]!;
    const result = NationSchema.safeParse({
      ...base,
      presentation: { colorBg: "red", colorFg: "#FFFFFF" },
    });
    expect(result.success).toBe(false);
  });

  it("requires the rich canon fields", () => {
    const base = corpusNations()[0]!;
    const { identity: _identity, ...withoutIdentity } = base;
    expect(NationSchema.safeParse(withoutIdentity).success).toBe(false);
  });

  it("requires slot.id", () => {
    const base = corpusNations()[0]!;
    const { slot: _slot, ...rest } = base;
    expect(
      NationSchema.safeParse({
        ...rest,
        slot: { order: 1, participation: "active" as const },
      }).success,
    ).toBe(false);
  });

  it("treats military as optional", () => {
    const nation = corpusNations()[0]!;
    if (nation.military === undefined) {
      // Ignore nations that already omit military.
      return;
    }
    const { military: _military, ...withoutMilitary } = nation;
    expect(NationSchema.safeParse(withoutMilitary).success).toBe(true);
  });
});
