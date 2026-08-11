import type { DiplomacyPack } from "./diplomacy.ts";
import type { EventsPack } from "./events/index.ts";
import type { FleetsPack } from "./fleets.ts";
import type { NationsPack } from "./nations/shared.ts";
import type { PossessionsPack } from "./possessions/index.ts";
import type { RulesetPack } from "./ruleset/index.ts";
import type { ShipComponentsPack } from "./ship_components/index.ts";
import type { TechnologiesPack } from "./technologies.ts";
import type { WarsPack } from "./wars/index.ts";
import type { PortsCanalsPack, WorldAreasPack } from "./world/index.ts";

export interface ContentPackBundle {
  scenarioId: string;
  nations: NationsPack;
  diplomacy: DiplomacyPack;
  possessions: PossessionsPack;
  worldAreas: WorldAreasPack;
  portsCanals: PortsCanalsPack;
  technologies: TechnologiesPack;
  shipComponents: ShipComponentsPack;
  fleets: FleetsPack;
  ruleset: RulesetPack;
  wars?: WarsPack;
  events?: EventsPack;
}
