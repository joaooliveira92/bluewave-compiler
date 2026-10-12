import {
  Anchor,
  ClipboardCheck,
  Cog,
  Crosshair,
  LayoutDashboard,
  Radar,
  Shield,
  type LucideIcon,
} from "lucide-react";

/** The design map's sections, in navigation order: navigate by ship system. */
export const DESIGN_SECTIONS = [
  "overview",
  "hull",
  "machinery",
  "protection",
  "armament",
  "systems",
  "review",
] as const;
export type DesignSectionId = (typeof DESIGN_SECTIONS)[number];

export interface LocalTab {
  readonly id: string;
  readonly label: string;
}

export interface DesignSection {
  readonly id: DesignSectionId;
  readonly label: string;
  readonly icon: LucideIcon;
  /** Sibling concepts inside the section (2 to 4); the inspector shows them as its only tab row. */
  readonly tabs: readonly LocalTab[];
}

export const SECTIONS: { readonly [K in DesignSectionId]: DesignSection & { readonly id: K } } = {
  overview: {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    tabs: [
      { id: "summary", label: "Summary" },
      { id: "priorities", label: "Priorities" },
    ],
  },
  hull: {
    id: "hull",
    label: "Hull",
    icon: Anchor,
    tabs: [
      { id: "dimensions", label: "Dimensions" },
      { id: "seakeeping", label: "Seakeeping" },
      { id: "capacity", label: "Capacity" },
    ],
  },
  machinery: {
    id: "machinery",
    label: "Machinery",
    icon: Cog,
    tabs: [
      { id: "performance", label: "Performance" },
      { id: "propulsion", label: "Propulsion" },
    ],
  },
  protection: {
    id: "protection",
    label: "Protection",
    icon: Shield,
    tabs: [
      { id: "armour", label: "Armour" },
      { id: "underwater", label: "Underwater" },
      { id: "structural", label: "Structural" },
    ],
  },
  armament: {
    id: "armament",
    label: "Armament",
    icon: Crosshair,
    tabs: [
      { id: "main", label: "Main battery" },
      { id: "secondary", label: "Secondary" },
      { id: "torpedoes", label: "Torpedoes" },
      { id: "other", label: "Other" },
    ],
  },
  systems: {
    id: "systems",
    label: "Systems",
    icon: Radar,
    tabs: [
      { id: "fire-control", label: "Fire control" },
      { id: "sensors", label: "Sensors" },
      { id: "aviation", label: "Aviation" },
      { id: "accommodation", label: "Accommodation" },
    ],
  },
  review: {
    id: "review",
    label: "Review",
    icon: ClipboardCheck,
    tabs: [
      { id: "findings", label: "Findings" },
      { id: "finish", label: "Finish" },
    ],
  },
};

/** Sections in display order. */
export const SECTION_ORDER: readonly DesignSection[] = DESIGN_SECTIONS.map((id) => SECTIONS[id]);

/** Where the inspector is: a section and one of its local tabs. */
export interface InspectorPlace {
  readonly section: DesignSectionId;
  readonly tab: string;
}

/** The section's first local tab: where selecting a section in the map lands. */
export function placeOf(section: DesignSectionId, tab?: string): InspectorPlace {
  const tabs = SECTIONS[section].tabs;
  return { section, tab: tabs.some((t) => t.id === tab) ? tab! : tabs[0]!.id };
}
