import { describe, it, expect, beforeEach, afterEach, vi } from "vite-plus/test";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { App } from "../src/renderer/src/App.js";

describe("App", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    (window as unknown as { electronAPI: Record<string, unknown> }).electronAPI = {
      compile: vi.fn(),
      openProject: vi.fn(),
      newProject: vi.fn(),
      saveProject: vi.fn(),
      saveProjectAs: vi.fn(),
      loadCampaignSave: vi.fn(),
    };
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it("renders the Editor and Campaign Save Viewer tabs", () => {
    act(() => {
      root = createRoot(container);
      root.render(<App />);
    });

    expect(container.textContent).toContain("Bluewave Campaign Compiler");
    expect(container.textContent).toContain("Editor");
    expect(container.textContent).toContain("Campaign Save Viewer");
    expect(container.textContent).toContain("New Project");
    expect(container.textContent).toContain("Compile Campaign");
  });

  it("disables project-dependent actions until a project is open", () => {
    act(() => {
      root = createRoot(container);
      root.render(<App />);
    });

    const compileBtn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === "Compile Campaign",
    );
    expect(compileBtn?.disabled).toBe(true);
  });
});
