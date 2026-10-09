/* @vitest-environment jsdom */
import type { BattleManifest } from "@bluewave/campaign-engine";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { BattleManifestView } from "./BattleManifestView.js";

/**
 * Render tests for the battle manifest readout. It shows the raw engagement
 * header and the two sides' squadron lists (ship + division ids) exactly as the
 * projection emitted them — no invented names beyond the fixed dev-tool
 * attacker/defender labels.
 */
const manifest = {
  battleId: "battle_1",
  missionType: "surface_action",
  sides: [
    {
      sideId: "attacker",
      nationId: "uk",
      participants: [
        { shipId: "HMS Majestic", divisionId: "Channel Squadron", nationId: "uk" },
        { shipId: "HMS Daring", divisionId: "Cruiser Squadron", nationId: "uk" },
      ],
    },
    {
      sideId: "defender",
      nationId: "germany",
      participants: [
        { shipId: "SMS Wörth", divisionId: "High Seas Squadron", nationId: "germany" },
      ],
    },
  ],
} as unknown as BattleManifest;

afterEach(() => {
  cleanup();
});

describe("BattleManifestView", () => {
  it("renders the engagement header and both sides' squadrons", () => {
    render(<BattleManifestView manifest={manifest} />);

    expect(screen.getByText("BATTLE: battle_1")).not.toBeNull();
    expect(screen.getByText("surface_action")).not.toBeNull();

    expect(screen.getByText("United Kingdom (Player)")).not.toBeNull();
    expect(screen.getByText("German Empire (AI)")).not.toBeNull();

    expect(screen.getByText("• HMS Majestic (Channel Squadron)")).not.toBeNull();
    expect(screen.getByText("• HMS Daring (Cruiser Squadron)")).not.toBeNull();
    expect(screen.getByText("• SMS Wörth (High Seas Squadron)")).not.toBeNull();
  });
});
