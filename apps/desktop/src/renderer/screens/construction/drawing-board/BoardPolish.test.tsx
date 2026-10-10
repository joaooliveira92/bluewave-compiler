import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { DrawingBoard } from "./DrawingBoard.js";
import { plural } from "./plural.js";
import { openTab } from "./test-helpers.js";

vi.mock("../../../shell/CampaignShellContext.js", () => ({
  useCampaignRevision: () => null,
  useCampaignMonthId: () => "1880-01",
}));

afterEach(cleanup);

const editPower = (value: string) => {
  const input = screen.getByLabelText(/installed power/i) as HTMLInputElement;
  fireEvent.change(input, { target: { value } });
  fireEvent.blur(input);
};

describe("Drawing Board polish", () => {
  it("undoes and redoes with the keyboard, but leaves a text field's own undo alone", () => {
    render(<DrawingBoard />);
    const board = screen.getByTestId("drawing-board");
    editPower("2600");
    expect(screen.getByText("1 edit")).toBeTruthy();
    fireEvent.keyDown(screen.getByLabelText(/installed power/i), { key: "z", metaKey: true });
    expect(screen.getByText("1 edit")).toBeTruthy();
    fireEvent.keyDown(board, { key: "z", metaKey: true });
    expect(screen.getByText("No edits")).toBeTruthy();
    fireEvent.keyDown(board, { key: "z", ctrlKey: true, shiftKey: true });
    expect(screen.getByText("1 edit")).toBeTruthy();
    fireEvent.keyDown(board, { key: "z", ctrlKey: true });
    fireEvent.keyDown(board, { key: "y", ctrlKey: true });
    expect(screen.getByText("1 edit")).toBeTruthy();
  });

  it("shows the campaign's technology date as fixed text, not a one-option dropdown", () => {
    render(<DrawingBoard />);
    expect(screen.queryByLabelText("Technology as of")).toBeNull();
    expect(screen.getByLabelText("Technology as of 1880-01 (campaign date)")).toBeTruthy();
  });

  it("keeps the long drawing disclaimer behind a short line", () => {
    render(<DrawingBoard />);
    expect(screen.getByText(/Schematic, not a lines plan\./)).toBeTruthy();
    expect(screen.queryByText(/waterplane coefficient, LCB, sheer/)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "About this drawing" }));
    expect(screen.getByText(/waterplane coefficient, LCB, sheer/)).toBeTruthy();
  });

  it("mounts a tab's panels when first opened and keeps them mounted after", () => {
    render(<DrawingBoard />);
    expect(screen.queryByRole("region", { name: "Edit history", hidden: true })).toBeNull();
    openTab("History and files");
    const history = screen.getByRole("region", { name: "Edit history" });
    openTab("Hull and machinery");
    expect(history.isConnected).toBe(true);
  });

  it("words counts in English", () => {
    expect(plural(0, "edit", "edits", "No edits")).toBe("No edits");
    expect(plural(1, "edit")).toBe("1 edit");
    expect(plural(1500, "fitting")).toBe("1,500 fittings");
    expect(plural(0, "warning")).toBe("0 warnings");
  });
});
