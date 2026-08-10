import { SafeInt } from "@bluewave/contracts";
import type { FleetState } from "@bluewave/campaign";

export class StrengthCalculator {
  static totalFirepower(fleet: FleetState): SafeInt {
    return fleet["ships"].reduce(
      (sum: SafeInt, ship) => SafeInt.add(sum, ship["firepower"]),
      SafeInt.ZERO,
    );
  }

  static averageArmor(fleet: FleetState): SafeInt {
    if (fleet["ships"].length === 0) return SafeInt.ZERO;
    const total = fleet["ships"].reduce(
      (sum: SafeInt, ship) => SafeInt.add(sum, ship["armor"]),
      SafeInt.ZERO,
    );
    return SafeInt.div(total, SafeInt(fleet["ships"].length));
  }

  static totalHitPoints(fleet: FleetState): SafeInt {
    return fleet["ships"].reduce(
      (sum: SafeInt, ship) => SafeInt.add(sum, ship["hitPoints"]),
      SafeInt.ZERO,
    );
  }

  static maxHitPoints(fleet: FleetState): SafeInt {
    return fleet["ships"].reduce(
      (sum: SafeInt, ship) => SafeInt.add(sum, ship["maxHitPoints"]),
      SafeInt.ZERO,
    );
  }

  static damagePotential(fleet: FleetState): number {
    const firepower = this.totalFirepower(fleet) as number;
    const armor = this.averageArmor(fleet) as number;
    return firepower * (armor / 10);
  }

  static survivability(fleet: FleetState): number {
    const hp = this.totalHitPoints(fleet) as number;
    const maxHp = this.maxHitPoints(fleet) as number;
    if (maxHp === 0) return 0;
    return hp / maxHp;
  }
}