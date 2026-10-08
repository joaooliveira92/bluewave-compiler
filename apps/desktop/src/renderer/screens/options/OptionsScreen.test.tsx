import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { BackgroundProvider } from "../../shell/BackgroundContext.js";
import { DensityProvider } from "../../shell/DensityContext.js";
import { OptionsScreen } from "./OptionsScreen.js";

function renderOptions() {
  return render(
    <BackgroundProvider>
      <DensityProvider>
        <OptionsScreen saving={false} onSave={vi.fn()} onCopy={vi.fn()} onCloseCampaign={vi.fn()} />
      </DensityProvider>
    </BackgroundProvider>,
  );
}

describe("OptionsScreen display density", () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset["density"];
  });
  afterEach(cleanup);

  it("offers Comfortable and Compact, starting on Comfortable", () => {
    renderOptions();
    const group = screen.getByRole("group", { name: "Display density" });
    expect(group.querySelectorAll("button")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Comfortable" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(screen.getByRole("button", { name: "Compact" }).getAttribute("aria-pressed")).toBe(
      "false",
    );
  });

  it("switches the whole app to compact and remembers it", () => {
    renderOptions();
    fireEvent.click(screen.getByRole("button", { name: "Compact" }));
    expect(screen.getByRole("button", { name: "Compact" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(document.documentElement.dataset["density"]).toBe("compact");
    expect(localStorage.getItem("bluewave-density")).toBe("compact");
  });
});
