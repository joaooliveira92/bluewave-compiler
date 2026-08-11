export { AREAS } from "./areas.ts";
export type {
  Area,
  AreaId,
  Port,
  Canal,
  AreaType,
  Climate,
  CanalOperatingCondition,
  CanalAccessPolicy,
} from "./helpers.ts";
export {
  getArea,
  getPort,
  getCanal,
  isHomeArea,
  isSeaZone,
  isChokePoint,
  isCanalZone,
  getAreasByTheater,
  getPortsByNation,
  getPortsByArea,
} from "./helpers.ts";
export { OCEANS, SEAS, THEATERS, CHOKEPOINTS, GEOGRAPHIC_REGIONS } from "./identifiers/index.ts";
export type {
  OceanId,
  SeaId,
  TheaterId,
  ChokepointId,
  GeographicRegionId,
  TerritoryCategory,
  SovereignId,
} from "./identifiers/index.ts";
export { PORTS, CANALS } from "./ports-canals.ts";
export { WORLD_AREAS_PACK, PORTS_CANALS_PACK } from "./packs.ts";
export type { WorldAreasPack, PortsCanalsPack } from "./packs.ts";
