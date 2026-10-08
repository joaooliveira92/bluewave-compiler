import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import type { PreTurnReviewBridge } from "./usePreTurnReviewData.js";
import { usePreTurnReviewData } from "./usePreTurnReviewData.js";

afterEach(cleanup);

function successfulBridge() {
  const execute = vi.fn(async (command: string): Promise<unknown> => {
    switch (command) {
      case "inspectCampaign":
        return {
          outcome: "success",
          value: { projection: { economy: { researchSpend: 1234 } } },
          diagnostics: [],
        };
      case "inspectPriorities":
        return {
          outcome: "success",
          value: {
            priorities: [{ id: "p1", title: "t", summary: "s", severity: "warning" }],
          },
          diagnostics: [],
        };
      case "inspectConstructionScreen":
        return {
          outcome: "success",
          value: {
            projects: [
              { status: "IN_PROGRESS", totalWork: 100, completedWork: 95 },
              { status: "QUEUED", totalWork: 100, completedWork: 10 },
              { status: "COMPLETED", totalWork: 100, completedWork: 100 },
            ],
          },
          diagnostics: [],
        };
      default:
        throw new Error(`unexpected command ${command}`);
    }
  });
  return { bridge: { campaign: { execute } } as unknown as PreTurnReviewBridge, execute };
}

describe("usePreTurnReviewData", () => {
  it("loads the three projections and derives the construction figures", async () => {
    const { bridge } = successfulBridge();

    const { result } = renderHook(() => usePreTurnReviewData("ses_1", true, bridge));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.researchSpend).toBe(1234);
    expect(result.current.priorities).toHaveLength(1);
    expect(result.current.constructionCount).toBe(2);
    expect(result.current.expectedCompletions).toBe(1);
  });

  it("does not touch the bridge while the dialog is closed", () => {
    const { bridge, execute } = successfulBridge();

    renderHook(() => usePreTurnReviewData("ses_1", false, bridge));

    expect(execute).not.toHaveBeenCalled();
  });

  it("loads once the dialog opens", async () => {
    const { bridge, execute } = successfulBridge();

    const { result, rerender } = renderHook(
      ({ open }: { open: boolean }) => usePreTurnReviewData("ses_1", open, bridge),
      { initialProps: { open: false } },
    );
    expect(execute).not.toHaveBeenCalled();

    rerender({ open: true });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(execute).toHaveBeenCalledTimes(3);
  });

  it("reports nulls rather than stale figures when the engine rejects", async () => {
    const execute = vi.fn(
      async (): Promise<unknown> => ({ outcome: "rejected", reason: "x", diagnostics: [] }),
    );
    const bridge = { campaign: { execute } } as unknown as PreTurnReviewBridge;

    const { result } = renderHook(() => usePreTurnReviewData("ses_1", true, bridge));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.researchSpend).toBeNull();
    expect(result.current.constructionCount).toBeNull();
    expect(result.current.expectedCompletions).toBeNull();
    expect(result.current.priorities).toEqual([]);
  });
});
