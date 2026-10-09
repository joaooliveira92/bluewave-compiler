import { fireEvent, screen } from "@testing-library/react";

/** Panels in the workspace's ship view: visible on every tab, so no tab needs opening. */
const SHIP_VIEW_PANELS: ReadonlySet<string> = new Set(["Hull plan"]);

/** The tab each panel lives on, so a test can ask for a panel by name and land on the right tab. */
const PANEL_TAB: Record<string, string> = {
  "Hull and displacement": "Hull and machinery",
  "Design brief": "Hull and machinery",
  "Machinery, fuel and range": "Hull and machinery",
  "Components and arrangement": "Arrangement",
  Batteries: "Arrangement",
  Protection: "Arrangement",
  "Topside load": "Arrangement",
  Validation: "Analysis",
  Performance: "Analysis",
  "Compared with starting design": "Analysis",
  "Weight summary": "Analysis",
  "Cost and construction forecast": "Analysis",
  "Submit for construction": "Build",
  "Revision preview": "Build",
  "Edit history": "History and files",
  "Design file": "History and files",
  "AI alternatives": "History and files",
};

export const openTab = (name: string) =>
  fireEvent.click(screen.getByRole("tab", { name: new RegExp(name, "i") }));

/** Opens a `<Select>` by its trigger's accessible name and clicks the option whose visible text matches. */
export function chooseOption(trigger: string | RegExp, option: string | RegExp): void {
  fireEvent.click(screen.getByLabelText(trigger));
  fireEvent.click(screen.getByRole("option", { name: option }));
}

/** Opens a `<Select>` by its trigger's accessible name and clicks the option at `index`. */
export function chooseOptionAt(trigger: string | RegExp, index: number): void {
  fireEvent.click(screen.getByLabelText(trigger));
  const options = screen.getAllByRole("option");
  const chosen = options[index];
  if (chosen === undefined) throw new Error(`no option at index ${index}`);
  fireEvent.click(chosen);
}

/** Opens the tab that holds the named panel (if it is on one) and returns the panel. */
export function region(name: string): HTMLElement {
  if (SHIP_VIEW_PANELS.has(name)) return screen.getByRole("region", { name });
  const tab = PANEL_TAB[name];
  if (tab === undefined) throw new Error(`no tab known for panel "${name}"`);
  openTab(tab);
  return screen.getByRole("region", { name });
}
