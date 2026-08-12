//packages/combat/src/tactical/state.ts
import type { SafeInt } from "@bluewave/contracts";
import type { TacticalShipUnit } from "./unit.js";
import type { TacticalDivision } from "./division.js";

// DESIGN-38 §8 core tactical state scaffolding. B-1 carries typed placeholders
// only — movement/spotting/weather mechanics land in B-2/B-4/B-5.
export type TacticalSideId = "ATTACKER" | "DEFENDER";

export interface TacticalSideRecord {
  sideId: TacticalSideId;
  participantIds: string[];
}

export interface WeatherVisibilityPlaceholder {
  weather: string;
  seaState: string;
  visibilityNm: number;
  daylight: boolean;
}

export interface ObjectiveRecord {
  objectiveId: string;
  missionType: string;
  participantId: string;
}

export interface ExitZoneTactical {
  exitZoneId: string;
  sideId: TacticalSideId;
}

export interface BattleContact {
  contactId: string;
  targetId: string;
  confidenceBp: SafeInt;
}

export interface TacticalBattleEvent {
  eventId: string;
  battleId: string;
  eventType: string;
  actorId: string;
  targetId?: string;
}

export interface TacticalBattleState {
  battleId: string;
  mapId: string;
  sides: TacticalSideRecord[];
  forces: Record<string, string[]>;
  divisions: TacticalDivision[];
  units: TacticalShipUnit[];
  contacts: BattleContact[];
  objectives: ObjectiveRecord[];
  weather: WeatherVisibilityPlaceholder;
  exitZones: ExitZoneTactical[];
  battleEventLedger: TacticalBattleEvent[];
}
