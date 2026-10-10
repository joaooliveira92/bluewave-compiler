import { describe, expect, it } from "vite-plus/test";
import {
  armamentContentHash,
  loadShipBuildingContent,
  shipBuildingContentHash,
} from "./shipBuildingContent.js";

describe("ship-building runtime content (ADR-0093 Step 3)", () => {
  it("loads first-class armament content into the runtime context", () => {
    const content = loadShipBuildingContent();
    expect(content.armament).not.toBeNull();
    const env = content.environmentFor("1880-01", "uk");
    expect(env.ctx.armamentContent).toBe(content.armament);
  });

  it("keeps the legacy content hash and adds a separate deterministic armament hash", () => {
    const legacy = shipBuildingContentHash();
    const armament = armamentContentHash();
    expect(legacy).toMatch(/^[0-9a-f]{64}$/);
    expect(armament).toMatch(/^[0-9a-f]{64}$/);
    expect(armament).not.toBe(legacy);
    // Deterministic across repeated calls in the same process.
    expect(shipBuildingContentHash()).toBe(legacy);
    expect(armamentContentHash()).toBe(armament);
  });
});
