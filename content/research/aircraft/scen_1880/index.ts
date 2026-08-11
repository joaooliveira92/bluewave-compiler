import type { AircraftPack } from "../../schema/aircraft.ts";

export const SCEN_1880_AIRCRAFT: AircraftPack = {
  scenario: "scen_1880",
  provenance: "CANONICAL_CONTENT",
  aircraft: [
    {
      id: "balloon_observation",
      name: "Observation Balloon",
      type: "airship",
      role: "patrol_aircraft",
      speed: 0,
      range: 0,
      toughness: 1,
      requires: ["aviation_balloon"],
      year: 1880,
    },
    {
      id: "airship_early_1885",
      name: "Early Airship",
      type: "airship",
      role: "patrol_aircraft",
      speed: 25,
      range: 200,
      toughness: 2,
      requires: ["aviation_balloon"],
      year: 1885,
    },
  ],
};
