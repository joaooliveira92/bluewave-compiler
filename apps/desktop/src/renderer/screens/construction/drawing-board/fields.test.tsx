import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { NumberField, parseTypedNumber } from "./fields.js";

afterEach(cleanup);

describe("NumberField", () => {
  it("reads either decimal mark and refuses thousands separators and junk", () => {
    expect(parseTypedNumber("16.5")).toBe(16.5);
    expect(parseTypedNumber("16,5")).toBe(16.5);
    expect(parseTypedNumber(" 12 ")).toBe(12);
    expect(parseTypedNumber(".5")).toBe(0.5);
    expect(parseTypedNumber("1,500.0")).toBeNull();
    expect(parseTypedNumber("1.500,0")).toBeNull();
    expect(parseTypedNumber("12kn")).toBeNull();
    expect(parseTypedNumber("")).toBeNull();
  });

  it("always shows a decimal point, whatever the system locale, and commits internal units", () => {
    const onCommit = vi.fn();
    render(
      <NumberField
        label="Top speed"
        unit="kn"
        value={16_000}
        scale={1000}
        decimals={1}
        onCommit={onCommit}
      />,
    );
    const input = screen.getByLabelText("Top speed (kn)") as HTMLInputElement;
    expect(input.value).toBe("16.0");
    fireEvent.change(input, { target: { value: "17,5" } });
    fireEvent.blur(input);
    expect(onCommit).toHaveBeenCalledWith(17_500);
  });

  it("steps with the arrow keys within min and max, committing on blur", () => {
    const onCommit = vi.fn();
    render(<NumberField label="Grade" value={2} min={1} max={3} onCommit={onCommit} />);
    const input = screen.getByLabelText("Grade") as HTMLInputElement;
    fireEvent.keyDown(input, { key: "ArrowUp" });
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input.value).toBe("3");
    fireEvent.blur(input);
    expect(onCommit).toHaveBeenCalledWith(3);
    fireEvent.change(input, { target: { value: "9" } });
    fireEvent.blur(input);
    expect(onCommit).toHaveBeenLastCalledWith(3); // clamped to max
  });
});
