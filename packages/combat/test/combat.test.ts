//packages/combat/test/combat.test.ts
import { describe, it, expect } from "vitest";
import { SafeInt } from "@bluewave/contracts";
import { RandomEngine } from "@bluewave/random";
import type {
  BattleInstance,
  FleetState,
  NationState,
  Ship,
  BattleResult,
} from "@bluewave/campaign";
import { BattleResolver } from "../src/resolver.js";
import { StrengthCalculator } from "../src/strength.js";

function makeShip(overrides: Partial<Ship> & { id: string }): Ship {
  return {
    name: "Test Ship",
    classId: "test-class",
    nationId: "test-nation",
    locationAreaId: "area-1",
    hitPoints: SafeInt(100),
    maxHitPoints: SafeInt(100),
    speed: SafeInt(10),
    firepower: SafeInt(10),
    armor: SafeInt(10),
    isUnderConstruction: false,
    constructionProgress: SafeInt(0),
    constructionTotalWork: SafeInt(0),
    ...overrides,
  };
}

function makeFleet(overrides: Partial<FleetState> & { id: string; ships: Ship[] }): FleetState {
  return {
    nationId: "test-nation",
    name: "Test Fleet",
    locationAreaId: "area-1",
    ...overrides,
  };
}

function makeNation(
  id: string,
  fleets: FleetState[],
  overrides?: Partial<NationState>,
): NationState {
  return {
    id,
    name: `Nation ${id}`,
    tag: id,
    treasury: SafeInt(1000),
    income: SafeInt(100),
    expenses: SafeInt(50),
    fleets,
    research: {
      nationId: id,
      technologies: [],
    },
    constructionProjects: [],
    isPlayable: true,
    isAI: false,
    ...overrides,
  };
}

describe("combat (narrow)", () => {
  const resolver = new BattleResolver();

  it("resolves battle with winner and loser determined", () => {
    const attackerShips = [
      makeShip({ id: "att-ship-1", firepower: SafeInt(20), armor: SafeInt(15) }),
      makeShip({ id: "att-ship-2", firepower: SafeInt(18), armor: SafeInt(12) }),
    ];
    const defenderShips = [
      makeShip({ id: "def-ship-1", firepower: SafeInt(5), armor: SafeInt(5) }),
      makeShip({ id: "def-ship-2", firepower: SafeInt(4), armor: SafeInt(5) }),
    ];

    const attFleet = makeFleet({ id: "att-fleet", nationId: "ATK", ships: attackerShips });
    const defFleet = makeFleet({ id: "def-fleet", nationId: "DEF", ships: defenderShips });

    const attackerNation = makeNation("ATK", [attFleet], { tag: "ATK" });
    const defenderNation = makeNation("DEF", [defFleet], { tag: "DEF" });

    const battle: BattleInstance = {
      id: "battle-1",
      phase: "pending",
      attackerId: "ATK",
      defenderId: "DEF",
      areaId: "area-1",
      attackerFleetIds: ["att-fleet"],
      defenderFleetIds: ["def-fleet"],
    };

    const engine = new RandomEngine("battle-test-seed");
    const result = resolver.resolve(battle, attackerNation, defenderNation, engine);

    expect(result.winnerId).toBe("ATK");
    expect(result.loserId).toBe("DEF");
    expect(result.explanation.length).toBeGreaterThanOrEqual(1);
  });

  it("damage is bounded: losses < total ships", () => {
    const attackerShips = [
      makeShip({ id: "a1", firepower: SafeInt(15), armor: SafeInt(10) }),
      makeShip({ id: "a2", firepower: SafeInt(15), armor: SafeInt(10) }),
    ];
    const defenderShips = [
      makeShip({ id: "d1", firepower: SafeInt(10), armor: SafeInt(10) }),
      makeShip({ id: "d2", firepower: SafeInt(10), armor: SafeInt(10) }),
      makeShip({ id: "d3", firepower: SafeInt(10), armor: SafeInt(10) }),
    ];

    const attFleet = makeFleet({ id: "af", nationId: "ATK", ships: attackerShips });
    const defFleet = makeFleet({ id: "df", nationId: "DEF", ships: defenderShips });

    const attackerNation = makeNation("ATK", [attFleet], { tag: "ATK" });
    const defenderNation = makeNation("DEF", [defFleet], { tag: "DEF" });

    const battle: BattleInstance = {
      id: "battle-2",
      phase: "pending",
      attackerId: "ATK",
      defenderId: "DEF",
      areaId: "area-1",
      attackerFleetIds: ["af"],
      defenderFleetIds: ["df"],
    };

    const engine = new RandomEngine("bounded-damage-seed");
    const result = resolver.resolve(battle, attackerNation, defenderNation, engine);

    const totalLoserShips = result.winnerId === "ATK" ? defenderShips.length : attackerShips.length;
    const totalLosses = result.attackerLosses.length + result.defenderLosses.length;
    expect(totalLosses).toBeLessThan(totalLoserShips);
  });

  it("no ship is in two unresolved battles after resolution", () => {
    const shipsA = [
      makeShip({ id: "sa1", firepower: SafeInt(12), armor: SafeInt(8), inBattleId: "battle-3" }),
      makeShip({ id: "sa2", firepower: SafeInt(12), armor: SafeInt(8), inBattleId: "battle-3" }),
    ];
    const shipsD = [
      makeShip({ id: "sd1", firepower: SafeInt(8), armor: SafeInt(6), inBattleId: "battle-3" }),
      makeShip({ id: "sd2", firepower: SafeInt(8), armor: SafeInt(6), inBattleId: "battle-3" }),
    ];

    const fA = makeFleet({ id: "fleet-a", nationId: "ATK", ships: shipsA });
    const fD = makeFleet({ id: "fleet-d", nationId: "DEF", ships: shipsD });

    const attackerNation = makeNation("ATK", [fA], { tag: "ATK" });
    const defenderNation = makeNation("DEF", [fD], { tag: "DEF" });

    const battle: BattleInstance = {
      id: "battle-3",
      phase: "pending",
      attackerId: "ATK",
      defenderId: "DEF",
      areaId: "area-1",
      attackerFleetIds: ["fleet-a"],
      defenderFleetIds: ["fleet-d"],
    };

    const engine = new RandomEngine("no-duplicate-seed");
    resolver.resolve(battle, attackerNation, defenderNation, engine);

    for (const ship of shipsA) {
      expect(ship["inBattleId"]).toBe("battle-3");
    }
    for (const ship of shipsD) {
      expect(ship["inBattleId"]).toBe("battle-3");
    }
  });

  it("explanation tree contains strength comparison", () => {
    const shipsA = [makeShip({ id: "xa1", firepower: SafeInt(14), armor: SafeInt(10) })];
    const shipsD = [makeShip({ id: "xd1", firepower: SafeInt(6), armor: SafeInt(5) })];

    const fA = makeFleet({ id: "fa", nationId: "ATK", ships: shipsA });
    const fD = makeFleet({ id: "fd", nationId: "DEF", ships: shipsD });

    const attackerNation = makeNation("ATK", [fA], { tag: "ATK" });
    const defenderNation = makeNation("DEF", [fD], { tag: "DEF" });

    const battle: BattleInstance = {
      id: "battle-4",
      phase: "pending",
      attackerId: "ATK",
      defenderId: "DEF",
      areaId: "area-1",
      attackerFleetIds: ["fa"],
      defenderFleetIds: ["fd"],
    };

    const engine = new RandomEngine("explanation-seed");
    const result = resolver.resolve(battle, attackerNation, defenderNation, engine);

    const explanationStr = result.explanation[0] ?? "";
    expect(explanationStr).toContain("battle:resolve");
    expect(explanationStr).toContain("attackerStrength");
    expect(explanationStr).toContain("defenderStrength");
  });

  it("deterministic: same seed + same fleets = same result", () => {
    const shipsA = [makeShip({ id: "da1", firepower: SafeInt(16), armor: SafeInt(12) })];
    const shipsD = [makeShip({ id: "dd1", firepower: SafeInt(8), armor: SafeInt(6) })];

    const fA = makeFleet({ id: "dfa", nationId: "ATK", ships: shipsA });
    const fD = makeFleet({ id: "dfd", nationId: "DEF", ships: shipsD });

    const makeState = () => ({
      attackerNation: makeNation("ATK", [fA], { tag: "ATK" }),
      defenderNation: makeNation("DEF", [fD], { tag: "DEF" }),
      battle: {
        id: "battle-5",
        phase: "pending" as const,
        attackerId: "ATK",
        defenderId: "DEF",
        areaId: "area-1",
        attackerFleetIds: ["dfa"],
        defenderFleetIds: ["dfd"],
      } as BattleInstance,
    });

    const s1 = makeState();
    const s2 = makeState();

    const engine1 = new RandomEngine("deterministic-test-seed");
    const engine2 = new RandomEngine("deterministic-test-seed");

    const r1 = resolver.resolve(s1.battle, s1.attackerNation, s1.defenderNation, engine1);
    const r2 = resolver.resolve(s2.battle, s2.attackerNation, s2.defenderNation, engine2);

    expect(r1.winnerId).toBe(r2.winnerId);
    expect(r1.loserId).toBe(r2.loserId);
    expect(r1.attackerLosses).toEqual(r2.attackerLosses);
    expect(r1.defenderLosses).toEqual(r2.defenderLosses);
    expect(r1.damageReport).toEqual(r2.damageReport);
  });

  it("different seeds can produce different outcomes", () => {
    const shipsA = [makeShip({ id: "rsa1", firepower: SafeInt(20), armor: SafeInt(10) })];
    const shipsD = [makeShip({ id: "rsd1", firepower: SafeInt(19), armor: SafeInt(10) })];

    const fA = makeFleet({ id: "rsfa", nationId: "ATK", ships: shipsA });
    const fD = makeFleet({ id: "rsfd", nationId: "DEF", ships: shipsD });

    const makeState = () => ({
      attackerNation: makeNation("ATK", [fA], { tag: "ATK" }),
      defenderNation: makeNation("DEF", [fD], { tag: "DEF" }),
      battle: {
        id: "battle-6",
        phase: "pending" as const,
        attackerId: "ATK",
        defenderId: "DEF",
        areaId: "area-1",
        attackerFleetIds: ["rsfa"],
        defenderFleetIds: ["rsfd"],
      } as BattleInstance,
    });

    const results = new Set<string>();
    for (let i = 0; i < 10; i++) {
      const s = makeState();
      const engine = new RandomEngine(`diff-seed-${i}`);
      const r = resolver.resolve(s.battle, s.attackerNation, s.defenderNation, engine);
      results.add(r.winnerId);
    }

    expect(results.size).toBeGreaterThan(1);
  });
});

describe("StrengthCalculator", () => {
  it("totalFirepower sums ship firepower", () => {
    const ships = [
      makeShip({ id: "s1", firepower: SafeInt(10) }),
      makeShip({ id: "s2", firepower: SafeInt(20) }),
      makeShip({ id: "s3", firepower: SafeInt(30) }),
    ];
    const fleet = makeFleet({ id: "f", ships });
    expect(StrengthCalculator.totalFirepower(fleet)).toBe(60 as SafeInt);
  });

  it("averageArmor computes correctly", () => {
    const ships = [
      makeShip({ id: "s1", armor: SafeInt(10) }),
      makeShip({ id: "s2", armor: SafeInt(20) }),
    ];
    const fleet = makeFleet({ id: "f", ships });
    expect(StrengthCalculator.averageArmor(fleet)).toBe(15 as SafeInt);
  });

  it("damagePotential uses firepower and armor", () => {
    const ships = [makeShip({ id: "s1", firepower: SafeInt(10), armor: SafeInt(20) })];
    const fleet = makeFleet({ id: "f", ships });
    const dp = StrengthCalculator.damagePotential(fleet);
    expect(dp).toBe(20); // 10 * (20/10) = 20
  });

  it("survivability returns ratio of current to max HP", () => {
    const ships = [makeShip({ id: "s1", hitPoints: SafeInt(50), maxHitPoints: SafeInt(100) })];
    const fleet = makeFleet({ id: "f", ships });
    expect(StrengthCalculator.survivability(fleet)).toBe(0.5);
  });
});
