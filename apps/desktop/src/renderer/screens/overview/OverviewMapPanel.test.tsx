import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import { MAP_PANEL_SIZES, OverviewMapPanel } from "./OverviewMapPanel.js";

describe("OverviewMapPanel", () => {
  beforeAll(() => {
    // jsdom has no ResizeObserver; the glass card measures itself with one.
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });
  afterEach(cleanup);

  it("starts compact and lets the player pick a size", () => {
    render(<OverviewMapPanel sessionId="ses-1" />);
    const group = screen.getByRole("group", { name: "Map size" });
    expect(group.querySelectorAll("button")).toHaveLength(MAP_PANEL_SIZES.length);
    expect(screen.getByRole("button", { name: "Compact" }).getAttribute("aria-pressed")).toBe(
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "Large" }));
    expect(screen.getByRole("button", { name: "Large" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Compact" }).getAttribute("aria-pressed")).toBe(
      "false",
    );
  });

  it("loads the map lazily and tells the player about the full-screen shortcut", async () => {
    render(<OverviewMapPanel sessionId="ses-1" />);
    expect(screen.getByText("World map")).toBeTruthy();
    expect(screen.getByText("F1 opens it full-screen")).toBeTruthy();
    expect(await screen.findByRole("application", { name: /World map/ })).toBeTruthy();
  });
});
