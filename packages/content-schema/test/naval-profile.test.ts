import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { describe, expect, it } from "vite-plus/test";
import { NavalProfileCatalogueSchema } from "../src/index.js";
import { decodeIssue, decodeOk } from "./decode-helpers.js";

const file = join(
  process.cwd(),
  "..",
  "..",
  "content",
  "production",
  "1880",
  "ship-building",
  "naval-profiles",
  "uk.yaml",
);
const read = () => parse(readFileSync(file, "utf8"));

describe("NavalProfileCatalogueSchema — authored production catalogue", () => {
  it("decodes the whole catalogue under the strict excess-key policy (records and all)", () => {
    const data = read();
    expect(
      decodeOk(NavalProfileCatalogueSchema, data),
      decodeIssue(NavalProfileCatalogueSchema, data),
    ).toBe(true);
  });

  it("rejects an excess key on a nested profile", () => {
    const data = read();
    const first = data.navalProfiles[0];
    data.navalProfiles[0] = { ...first, excess: 1 };
    expect(decodeOk(NavalProfileCatalogueSchema, data)).toBe(false);
  });
});
