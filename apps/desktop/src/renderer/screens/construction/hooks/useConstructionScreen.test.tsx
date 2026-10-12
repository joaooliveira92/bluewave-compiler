import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { useConstructionScreen } from "./useConstructionScreen.js";

// The hook's transport port is mocked; the fake bridge is a plain object literal returned from the (untyped) mock
// factory, so no `as unknown` bridge cast is needed.
const mocks = vi.hoisted(() => ({ execute: vi.fn() }));
vi.mock("../../../lib/bridge-context.js", () => ({
  useBridge: () => ({ campaign: { execute: mocks.execute } }),
}));

afterEach(() => {
  cleanup();
  mocks.execute.mockReset();
});

const projection = {
  revision: 3,
  month: { month: 1, year: 1880 },
  economy: {
    treasury: 1_000,
    monthlyAppropriation: 0,
    shipyardCapacity: 2,
    dockMaxBuildDisplacementKg: 13_000_000,
    maxConcurrentConstructionMassKg: 39_000_000,
    committedNewConstructionMassKg: 0,
    exemptNewConstructionMassKg: 0,
    dockExpansionDurationMonths: 12,
    dockExpansionNextStepKg: 1_000_000,
    dockPossessions: [{ id: "pos-1", name: "Portsmouth" }],
  },
  designs: [{ designId: "d1" }],
  projects: [],
  workspace: { commands: [], treasuryReserved: 0, capacityReserved: 0 },
};

describe("useConstructionScreen dock expansion (SB3-R16)", () => {
  it("issues authorizeDockExpansionCommand with the possession and current revision", async () => {
    mocks.execute.mockImplementation(async (command: string) => {
      if (command === "inspectConstructionScreen")
        return { outcome: "success", value: projection, diagnostics: [] };
      if (command === "authorizeDockExpansionCommand")
        return {
          outcome: "success",
          value: {
            commandId: "cmd-1",
            bodyType: "AuthorizeDockExpansion",
            appliedOnNextTurn: true,
          },
          diagnostics: [],
        };
      throw new Error(`unexpected command ${command}`);
    });

    const { result } = renderHook(() => useConstructionScreen("ses_1"));
    await waitFor(() => expect(result.current.state.revision).toBe(3));

    await act(async () => {
      result.current.authorizeDockExpansion("pos-1");
    });

    await waitFor(() =>
      expect(mocks.execute).toHaveBeenCalledWith(
        "authorizeDockExpansionCommand",
        expect.objectContaining({
          sessionId: "ses_1",
          possessionId: "pos-1",
          expectedRevision: 3,
        }),
      ),
    );
    // The queued outcome is surfaced as the same "applies next month" notice as the other steering commands.
    await waitFor(() =>
      expect(result.current.state.notice).toMatch(/AuthorizeDockExpansion queued/),
    );
  });
});
