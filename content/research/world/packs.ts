import type { WorldAreasPack, PortsCanalsPack } from "../schema/world.ts";
import { AREAS } from "./areas.ts";
import { PORTS, CANALS } from "./ports-canals.ts";

export type { WorldAreasPack, PortsCanalsPack };

export const WORLD_AREAS_PACK: WorldAreasPack = {
  scenario: "january_1880",
  provenance:
    "Phase 2 Canonical World Specification - Oceans/Seas/Theaters/Chokepoints/Areas - Immutable",
  areas: Object.values(AREAS),
};

export const PORTS_CANALS_PACK: PortsCanalsPack = {
  scenario: "january_1880",
  provenance:
    "Phase 2 Canonical Ports & Canals - Major ports per Section 9, Suez operational / Panama closed",
  ports: Object.values(PORTS),
  canals: Object.values(CANALS),
};
