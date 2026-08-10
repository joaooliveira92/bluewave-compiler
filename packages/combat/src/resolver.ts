import { SafeInt } from "@bluewave/contracts";
import type { BattleInstance, BattleResult, FleetState, NationState, Ship } from "@bluewave/campaign";
import { RandomEngine, RandomStream, drawUniform } from "@bluewave/random";
import type { ExplanationTree } from "@bluewave/events";
import { ExplanationBuilder, formatExplanation } from "@bluewave/events";
import { StrengthCalculator } from "./strength.js";

export interface BattleManifest {
  id: string;
  attackerId: string;
  defenderId: string;
  areaId: string;
  attackerFleetIds: string[];
  defenderFleetIds: string[];
  timestamp: string;
}

export class BattleResolver {
  resolve(
    battle: BattleInstance,
    attackerNation: NationState,
    defenderNation: NationState,
    randomEngine: RandomEngine,
  ): BattleResult {
    const attackerFleets = this.resolveFleets(attackerNation, battle["attackerFleetIds"]);
    const defenderFleets = this.resolveFleets(defenderNation, battle["defenderFleetIds"]);

    const attackerStrength = attackerFleets.reduce(
      (sum: SafeInt, f) => SafeInt.add(sum, this.computeStrength(f, attackerNation)),
      SafeInt.ZERO,
    );
    const defenderStrength = defenderFleets.reduce(
      (sum: SafeInt, f) => SafeInt.add(sum, this.computeStrength(f, defenderNation)),
      SafeInt.ZERO,
    );

    const randomStream = randomEngine.stream("combat:resolve");

    const attackerRandom = drawUniform(randomStream, SafeInt(0), SafeInt(100));
    const defenderRandom = drawUniform(randomStream, SafeInt(0), SafeInt(100));

    const attackerFactor = 1 + ((attackerRandom as number) - 50) / 100;
    const defenderFactor = 1 + ((defenderRandom as number) - 50) / 100;

    const attackerEffective = this.computeEffectiveStrength(
      attackerStrength, defenderStrength, attackerFactor,
    );
    const defenderEffective = this.computeEffectiveStrength(
      defenderStrength, attackerStrength, defenderFactor,
    );

    const attackerWins = attackerEffective >= defenderEffective;
    const winnerId = attackerWins ? battle["attackerId"] : battle["defenderId"];
    const loserId = attackerWins ? battle["defenderId"] : battle["attackerId"];

    const loserFleets = attackerWins ? defenderFleets : attackerFleets;
    const allLoserShips = loserFleets.flatMap(f => f["ships"].filter(s => !s["isUnderConstruction"]));

    const winnerEff = Math.max(attackerEffective, defenderEffective);
    const loserEff = Math.min(attackerEffective, defenderEffective);
    const strengthRatio = winnerEff > 0 ? loserEff / winnerEff : 0;
    const damageRatio = (1 - strengthRatio) / 2;

    const { losses, damageReport } = this.applyDamage(allLoserShips, damageRatio, randomStream);

    const explanationTree = this.createExplanation(
      { attacker: attackerStrength as number, defender: defenderStrength as number },
      { attackerFactor, defenderFactor, attackerRandom: attackerRandom as number, defenderRandom: defenderRandom as number },
      { winnerId, loserId, losses, damageReport },
    );

    const explanation = [formatExplanation(explanationTree)];

    return {
      winnerId,
      loserId,
      attackerLosses: attackerWins ? [] : losses,
      defenderLosses: attackerWins ? losses : [],
      damageReport,
      explanation,
    };
  }

  private resolveFleets(nation: NationState, fleetIds: string[]): FleetState[] {
    return fleetIds
      .map(id => nation["fleets"].find(f => f["id"] === id))
      .filter((f): f is FleetState => f !== undefined);
  }

  computeStrength(fleet: FleetState, _nation: NationState): SafeInt {
    const dp = StrengthCalculator.damagePotential(fleet);
    const surv = StrengthCalculator.survivability(fleet);
    const raw = dp * surv;
    return SafeInt(Math.floor(raw));
  }

  computeEffectiveStrength(
    strength: SafeInt,
    _opponentStrength: SafeInt,
    randomFactor: number,
  ): number {
    return (strength as number) * randomFactor;
  }

  applyDamage(
    ships: Ship[],
    damageRatio: number,
    randomStream: RandomStream,
  ): { losses: string[]; damageReport: Record<string, SafeInt> } {
    const losses: string[] = [];
    const damageReport: Record<string, SafeInt> = {};

    for (const ship of ships) {
      const hp = ship["hitPoints"] as number;
      const damage = Math.max(1, Math.floor(hp * damageRatio));
      const newHp = Math.max(0, hp - damage);
      damageReport[ship["id"]] = SafeInt(damage);
      if (newHp <= 0) {
        losses.push(ship["id"]);
      }
    }

    return { losses, damageReport };
  }

  createExplanation(
    strengthComparison: { attacker: number; defender: number },
    randomFactors: { attackerFactor: number; defenderFactor: number; attackerRandom: number; defenderRandom: number },
    outcome: { winnerId: string; loserId: string; losses: string[]; damageReport: Record<string, SafeInt> },
  ): ExplanationTree {
    const builder = new ExplanationBuilder("battle:resolve", "1.0.0")
      .withInput("attackerStrength", strengthComparison["attacker"])
      .withInput("defenderStrength", strengthComparison["defender"])
      .withIntermediate("attackerRandomDraw", randomFactors["attackerRandom"])
      .withIntermediate("defenderRandomDraw", randomFactors["defenderRandom"])
      .withIntermediate("attackerRandomFactor", randomFactors["attackerFactor"])
      .withIntermediate("defenderRandomFactor", randomFactors["defenderFactor"])
      .withIntermediate("attackerEffectiveStrength", strengthComparison["attacker"] * randomFactors["attackerFactor"])
      .withIntermediate("defenderEffectiveStrength", strengthComparison["defender"] * randomFactors["defenderFactor"])
      .withResult(strengthComparison["attacker"] * randomFactors["attackerFactor"]);

    const lossChild = new ExplanationBuilder("battle:losses", "1.0.0")
      .withInput("winnerId", outcome["winnerId"])
      .withInput("loserId", outcome["loserId"])
      .withIntermediate("lossesCount", outcome["losses"].length)
      .withResult(outcome["losses"].length)
      .build();

    builder.addChild(lossChild);
    return builder.build();
  }
}