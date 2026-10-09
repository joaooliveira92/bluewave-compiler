import { fireEvent, screen } from "@testing-library/react";

/** The tab each panel lives on, so a test can ask for a panel by name and land on the right tab. */
const PANEL_TAB: Record<string, string> = {
  "Hull plan": "Hull and machinery",
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

/** Opens the tab that holds the named panel and returns the panel. */
export function region(name: string): HTMLElement {
  const tab = PANEL_TAB[name];
  if (tab === undefined) throw new Error(`no tab known for panel "${name}"`);
  openTab(tab);
  return screen.getByRole("region", { name });
}
