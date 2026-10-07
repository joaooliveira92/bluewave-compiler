import { describe, expect, it } from "vite-plus/test";
import { buildOwnershipRows, describeArea } from "./map-a11y.js";

describe("describeArea", () => {
  it("states ownership and fleet count in words", () => {
    expect(
      describeArea({ id: "a", name: "North Sea", owner: "Britain", fleets: 2, selected: false }),
    ).toBe("North Sea: held by Britain, 2 fleets");
    expect(describeArea({ id: "b", name: "Baltic", owner: null, fleets: 1, selected: false })).toBe(
      "Baltic: unclaimed, 1 fleet",
    );
    expect(
      describeArea({ id: "c", name: "Arctic", owner: "Russia", fleets: 0, selected: false }),
    ).toBe("Arctic: held by Russia, no fleets");
  });
});

describe("buildOwnershipRows", () => {
  it("sorts by name and marks the selection", () => {
    const rows = buildOwnershipRows(
      [
        { id: "z", name: "Zanzibar" },
        { id: "a", name: "Aden" },
      ],
      (id) => (id === "a" ? "Britain" : null),
      (id) => (id === "z" ? 3 : 0),
      "z",
    );
    expect(rows.map((r) => r.name)).toEqual(["Aden", "Zanzibar"]);
    expect(rows[0]).toMatchObject({ owner: "Britain", fleets: 0, selected: false });
    expect(rows[1]).toMatchObject({ owner: null, fleets: 3, selected: true });
  });
});
