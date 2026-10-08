import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import { SidebarProvider } from "../components/ui/sidebar.js";
import { AppSidebar } from "./AppSidebar.js";

const debugFlag = vi.hoisted(() => ({ on: false }));
vi.mock("./debug-flag.js", () => ({
  get DEBUG_MODE() {
    return debugFlag.on;
  },
}));

const SESSION = "ecfd0892-05b3-4baf-aa64-295c439a19c1";

function renderSidebar() {
  render(
    <SidebarProvider>
      <AppSidebar screen="overview" onSelect={() => undefined} footer={SESSION} />
    </SidebarProvider>,
  );
}

describe("AppSidebar session footer (ADR-0058)", () => {
  beforeAll(() => {
    // jsdom has no matchMedia; the sidebar's mobile hook needs one.
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });
  afterEach(cleanup);

  it("never shows the engine session id in a release build", () => {
    debugFlag.on = false;
    renderSidebar();
    expect(screen.queryByText(SESSION)).toBeNull();
    expect(screen.getByText("Overview")).toBeTruthy();
  });

  it("shows the session id in a debug build", () => {
    debugFlag.on = true;
    renderSidebar();
    expect(screen.getByText(SESSION)).toBeTruthy();
  });
});

describe("AppSidebar sections (N-2)", () => {
  beforeAll(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });
  afterEach(cleanup);

  it("groups the screens under Admiralty, Operations, Government and Foreign, in that order", () => {
    renderSidebar();
    const labels = ["Admiralty", "Operations", "Government", "Foreign"].map((label) =>
      screen.getByText(label),
    );
    for (let i = 1; i < labels.length; i++) {
      // Document order: each heading comes after the one before it.
      expect(
        labels[i - 1]!.compareDocumentPosition(labels[i]!) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });

  it("puts each screen in the section for its job", () => {
    const { container } = render(
      <SidebarProvider>
        <AppSidebar screen="overview" onSelect={() => undefined} />
      </SidebarProvider>,
    );
    const names = (id: string) =>
      [...container.querySelectorAll(`[data-sidebar-section="${id}"] button span`)].map(
        (node) => node.textContent,
      );
    expect(names("operations")).toEqual(expect.arrayContaining(["Fleet", "Construction"]));
    expect(names("government")).toEqual(
      expect.arrayContaining(["Research & Technology", "Treasury"]),
    );
    expect(names("foreign")).toEqual(["Diplomacy & War"]);
    expect(names("settings")).toEqual(expect.arrayContaining(["Campaign Preferences", "Options"]));
  });

  it("selects a screen when its entry is clicked", () => {
    const onSelect = vi.fn();
    render(
      <SidebarProvider>
        <AppSidebar screen="overview" onSelect={onSelect} />
      </SidebarProvider>,
    );
    screen.getByRole("button", { name: "Treasury" }).click();
    expect(onSelect).toHaveBeenCalledWith("treasury");
  });
});
