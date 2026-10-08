import { describe, expect, it } from "vite-plus/test";
import { DEFERRED_MOVEMENT_ITEMS, DEFERRED_SUBMARINE_ITEMS } from "./fleet-screen-state.js";

describe("DEFERRED_SUBMARINE_ITEMS", () => {
  it("records why submarines are not shown, with unique ids", () => {
    expect(DEFERRED_SUBMARINE_ITEMS.map((i) => i.id)).toEqual([
      "submarine-roster",
      "submarine-auto-build",
    ]);
    expect(DEFERRED_SUBMARINE_ITEMS.every((i) => i.reason.length > 20)).toBe(true);
    // The era fact the roster verdict rests on stays stated.
    expect(DEFERRED_SUBMARINE_ITEMS[0]?.reason).toMatch(/1880/);
  });
});

describe("DEFERRED_MOVEMENT_ITEMS", () => {
  it("states why fleets cannot be ordered to sail", () => {
    expect(DEFERRED_MOVEMENT_ITEMS.map((i) => i.id)).toEqual(["movement-orders"]);
    expect(DEFERRED_MOVEMENT_ITEMS[0]?.reason).toMatch(/no command/);
  });
});
