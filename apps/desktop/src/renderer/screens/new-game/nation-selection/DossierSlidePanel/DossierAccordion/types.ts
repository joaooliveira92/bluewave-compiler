import type { LucideIcon } from "lucide-react";

export type DossierSectionId = "economy" | "military" | "diplomacy";

export interface DossierSection {
  id: DossierSectionId;
  label: string;
  text: string;
  icon: LucideIcon;
  accent: "gold" | "red" | "blue";
}
