import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vite-plus/test";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select.js";

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(cleanup);

function renderSelect(props?: {
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  return render(
    <Select value={props?.value} onValueChange={props?.onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="a">Alpha</SelectItem>
        <SelectItem value="b">Bravo</SelectItem>
        <SelectItem value="c">Charlie</SelectItem>
      </SelectContent>
    </Select>,
  );
}

describe("Select", () => {
  it("shows the selected option label on first render", () => {
    renderSelect({ value: "b" });

    expect(screen.getByRole("combobox").textContent).toContain("Bravo");
  });

  it("selects an option by pointer and reports the value", () => {
    const onValueChange = vi.fn();
    renderSelect({ onValueChange });

    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(screen.getByRole("option", { name: "Charlie" }));

    expect(onValueChange).toHaveBeenCalledWith("c");
  });

  it("opens with ArrowDown and confirms the active option with Enter", () => {
    const onValueChange = vi.fn();
    renderSelect({ value: "b", onValueChange });

    const trigger = screen.getByRole("combobox");
    fireEvent.keyDown(trigger, { key: "ArrowDown" });

    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.keyDown(trigger, { key: "Enter" });

    expect(onValueChange).toHaveBeenCalledWith("c");
  });

  it("moves the active option with typeahead", () => {
    renderSelect({ value: "a" });

    const trigger = screen.getByRole("combobox");
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.keyDown(trigger, { key: "c" });

    const active = screen
      .getAllByRole("option")
      .find((option) => option.getAttribute("data-active") !== null);

    expect(active?.textContent).toContain("Charlie");
  });

  it("does not select a disabled option", () => {
    const onValueChange = vi.fn();
    render(
      <Select onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Alpha</SelectItem>
          <SelectItem value="b" disabled>
            Bravo
          </SelectItem>
        </SelectContent>
      </Select>,
    );

    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(screen.getByRole("option", { name: "Bravo" }));

    expect(onValueChange).not.toHaveBeenCalled();
  });
});
