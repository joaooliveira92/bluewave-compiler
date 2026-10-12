/* @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { DecorativeGlobe } from "./DecorativeGlobe.js";

describe("DecorativeGlobe", () => {
  afterEach(cleanup);

  it("draws the sphere but is hidden from assistive technology", () => {
    const { container } = render(<DecorativeGlobe />);

    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.closest("[aria-hidden='true']")).not.toBeNull();
    expect(svg?.getAttribute("role")).toBeNull();
    expect(svg?.getAttribute("aria-label")).toBeNull();
    expect(container.querySelector("circle")).not.toBeNull();
  });

  it("exposes no listbox, option, button or image semantics", () => {
    render(<DecorativeGlobe />);

    for (const role of ["listbox", "option", "button", "img", "link"] as const) {
      expect(screen.queryAllByRole(role, { hidden: true })).toEqual([]);
    }
  });

  it("offers no nation pins or selection ring to pick from", () => {
    const { container } = render(<DecorativeGlobe />);

    expect(container.querySelector("[data-country-id]")).toBeNull();
    expect(container.querySelector(".svg-globe-pin, .svg-globe-ring, .pin-hit-target")).toBeNull();
  });

  it("ignores click, drag and wheel input", () => {
    const { container } = render(<DecorativeGlobe />);
    const svg = container.querySelector("svg") as SVGSVGElement;
    const before = svg.innerHTML;
    const onClick = vi.fn();
    container.addEventListener("click", onClick);

    // d3-zoom/d3-drag would call preventDefault on wheel and take the pointer.
    const wheelNotPrevented = fireEvent.wheel(svg, { deltaY: -120 });
    fireEvent.mouseDown(svg, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(window, { clientX: 80, clientY: 40 });
    fireEvent.mouseUp(window, { clientX: 80, clientY: 40 });
    fireEvent.click(svg);

    expect(wheelNotPrevented).toBe(true);
    expect(svg.innerHTML).toBe(before);
    expect(svg.style.cursor).toBe("");
  });

  it("does not let the pointer land on it", () => {
    const { container } = render(<DecorativeGlobe />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).toContain("pointer-events-none");
  });
});
