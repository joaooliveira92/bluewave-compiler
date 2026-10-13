import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { Advanced } from "./Advanced.js";

afterEach(cleanup);

describe("Advanced disclosure", () => {
  it("keeps its specialist controls behind a summary, closed until opened", () => {
    render(
      <Advanced>
        <span>Inclination</span>
      </Advanced>,
    );
    const details = screen.getByText("Advanced").closest("details") as HTMLDetailsElement;
    expect(details.open).toBe(false);
    expect(screen.getByText("Inclination")).toBeTruthy();
  });

  it("takes a label so a section can name its own specialist group", () => {
    render(
      <Advanced label="Advanced propulsion details">
        <span>Fuel capacity</span>
      </Advanced>,
    );
    expect(screen.getByText("Advanced propulsion details")).toBeTruthy();
  });
});
