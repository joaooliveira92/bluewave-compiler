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
