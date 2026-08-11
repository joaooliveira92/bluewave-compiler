import type {
  OceanId,
  SeaId,
  TheaterId,
  ChokepointId,
  GeographicRegionId,
  TerritoryCategory,
  SovereignId,
} from "./identifiers/index.ts";
import type { NationId } from "../nations/shared.ts";
import { AREAS } from "./areas.ts";
import { PORTS, CANALS } from "./ports-canals.ts";

export type {
  OceanId,
  SeaId,
  TheaterId,
  ChokepointId,
  GeographicRegionId,
  TerritoryCategory,
  SovereignId,
};

export type AreaType = "home_area" | "sea_zone" | "choke_point" | "canal_zone";
export type Climate = "temperate" | "mediterranean" | "arid" | "tropical";

export interface Area {
  id: string;
  name: string;
  type: AreaType;
  climate: Climate;
  adjacency: string[];
  theater?: TheaterId;
  ocean?: OceanId;
  seaId?: SeaId;
  chokepointId?: ChokepointId;
  geographicRegion?: GeographicRegionId;
  sovereign?: SovereignId;
  category?: TerritoryCategory;
  canonicalName?: string;
}

export type AreaId = string;

export interface Port {
  id: string;
  name: string;
  area: string;
  nation: string;
  coordinates: [number, number];
  portCapacity: number;
  dockSize: number;
  isHomePort: boolean;
}

export type CanalOperatingCondition = "operational" | "closed" | "damaged";
export type CanalAccessPolicy = "open" | "closed" | "restricted";

export interface Canal {
  id: string;
  name: string;
  area: string;
  legalOwner: string;
  militaryController: string;
  operatingCondition: CanalOperatingCondition;
  openSince?: string | null;
  scheduledOpen?: string | null;
  accessPolicy: CanalAccessPolicy;
  tensionBlockThreshold?: number;
}

export const getArea = (id: string) => (AREAS as Record<string, Area>)[id];
export const getPort = (id: string) => (PORTS as Record<string, Port>)[id];
export const getCanal = (id: string) => (CANALS as Record<string, Canal>)[id];
export const isHomeArea = (a: Area) => a.type === "home_area";
export const isSeaZone = (a: Area) => a.type === "sea_zone";
export const isChokePoint = (a: Area) => a.type === "choke_point";
export const isCanalZone = (a: Area) => a.type === "canal_zone";
export const getAreasByTheater = (t: TheaterId) =>
  Object.values(AREAS).filter((a) => a.theater === t);
export const getPortsByNation = (n: string) => Object.values(PORTS).filter((p) => p.nation === n);
export const getPortsByArea = (areaId: string) =>
  Object.values(PORTS).filter((p) => p.area === areaId);
