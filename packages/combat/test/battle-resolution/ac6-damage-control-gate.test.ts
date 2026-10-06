// P-1 ticket 07 (second-review fix): the AC-6 damage-control gate as a testable
// seam.
//
//   1. `shouldWireDamageControl` — the exported pure predicate that decides
//      whether `resolveBattleAuto` sends a per-ship `damageControl` map to the
//      engine (ADR-0047 decision 1): false for a projected battle with no
//      torpedo context, true when the projection carries one.
//   2. A SECOND pinned unarmed baseline (baseline #1 lives in
//      auto-resolve.test.ts) whose random ledger proves the fixture contains
//      shell-started fires (§9 FIRE_SOURCE_CREATED records). A gate regression
//      is only detectable in a battle that HAS fires/flooding: a wired stage
//      would decay them and emit `smoke_fire` events, changing the per-minute
//      hashes (and therefore the result hash). Baseline #1 pins three of the
//      default fixture's minute hashes; this baseline pins a different
//      deterministic fixture's FULL minuteHashes.
//
// Pure/deterministic: fixed fixture, fixed campaign seed, no ambient random.
import { describe, expect, it } from "vite-plus/test";
import { SafeInt } from "@bluewave/contracts";
import type { CompiledDesignVersion } from "@bluewave/campaign";
import { RandomLedger } from "@bluewave/random";
import { projectBattle } from "../../src/battleResolution/project.js";
import { resolveBattleAuto, shouldWireDamageControl } from "../../src/battleResolution/resolve.js";
import { getFireRiskBp } from "../../src/damage/immediateFireFlooding.js";
import { makeAutoInput, makeNations, type FixtureNationSet } from "./fixtures.js";

const WHITEHEAD = "whitehead_14in_1886";

/** Give EVERY design in both nations torpedo armament (see torpedo-auto.test.ts). */
function armAll(nations: FixtureNationSet): FixtureNationSet {
  const arm = (designs: Map<string, CompiledDesignVersion>) =>
    new Map(
      [...designs].map(([id, d]) => [
        id,
        {
          ...d,
          torpedoArmament: [
            { mountType: "UNDERWATER_FIXED", tubeCount: SafeInt(2), torpedoModelId: WHITEHEAD },
            {
              mountType: "ABOVE_WATER_TRAINABLE",
              tubeCount: SafeInt(2),
              torpedoModelId: WHITEHEAD,
            },
          ],
        },
      ]),
    );
  return {
    ...nations,
    attacker: { ...nations.attacker, designs: arm(nations.attacker.designs) },
    defender: { ...nations.defender, designs: arm(nations.defender.designs) },
  };
}

// Second unarmed fixture: 4-gun batteries instead of the default 10, so the
// pinned hashes are independent of baseline #1 (auto-resolve.test.ts).
const FIRE_BASELINE_INPUT = makeAutoInput({
  nations: makeNations({ attackerGuns: [4, 4], defenderGuns: [4, 4] }),
});

const FIRE_BASELINE_RESULT_HASH =
  "1c47f90b0a36f52bf2b3ce6dad3cf8a126d6e07a35768812c29b3a6c7373933c";
const FIRE_BASELINE_MINUTE_HASHES = [
  "704d9118704bb7ff99215a06c9eabcbda043c21f897e87accd311494f0c8f218",
  "cab4b696447f7c100d8df91532440f45f5003f3372094cb3aa7fd19d8bda3924",
  "25241f885651c6bc0a53c0fc5d5179aa9399c1bd8829209d1d8aae5ae58d4395",
  "ca22ec0a66017a551cb1b93dfe888e79c458e96d7f9be9d1fbe7338011b1e7bf",
  "7d4a0bdd7aae1fac631432751f7bb04d3a9f9f11ed38edb85e7d4a3f43c86472",
  "823cc727373b89e3c37e55e4a5c1175d033bdbf39a1630c29102532a0436f838",
  "ef2d72da4cab002e7031881f9642e8deaf3cfd6013cb6ad8b9d57fe4f690d511",
  "ec41098e604b234580804d7deb9cf0ee87c9c6ea6f515fbbeb3670c3fc70aea3",
  "a5104d0b98d76aced703620c7faaae4d846d4097f839889a880b8bbaa1dc4d18",
  "32e7a20860d5fcb2dbbbe10388652c4b3436fc873916e8b324b4caa856417a03",
  "69d7f5179a797c0100468b622f633d4432059fde8b40c300cedb404ca76e1dd0",
  "d30c06a95efcd0b488fa06b09b3377bd640681e842496df7f21b2ab5812cf3d4",
  "5ff8e4393b9ecffd32419937c22a789911e40c4e8b0a49b8316c3fcabc402abe",
  "8f725505dfacd5e0f2f08fee6bc0bf6cdd235ba42e90ee58b3bd1d2cf452f26f",
  "316604fde3921ce6745329e8c38e91e67cc7fd1c181989f19aa321aa70971a3c",
  "9427e9809f5191c9d42bd1959ed793b7f9cf1d77cac3ea6519303fedbd07088a",
  "14d467e3aca949ff0f16e644595103fd7f59245e32cde42ebe6208616f97d894",
  "b0cb413ad74515a1b551d4946ebd31809adfcb9ebe76c6aafaa7552ac469e5cf",
] as const;

describe("AC-6 damage-control gate (P-1 ticket 07)", () => {
  it("shouldWireDamageControl: false without a projected torpedo context, true with one", () => {
    // Unarmed battle: no promoted unit carries torpedo armament, so the
    // projection has no TorpedoContext at all — the gate must stay shut.
    const unarmed = makeAutoInput();
    const unarmedProjection = projectBattle({
      ...unarmed,
      rulesetVersion: unarmed.rulesetVersion,
    });
    expect(unarmedProjection.torpedoes).toBeUndefined();
    expect(shouldWireDamageControl(unarmedProjection.torpedoes)).toBe(false);
    expect(shouldWireDamageControl(undefined)).toBe(false);

    // Armed battle: the projection carries launcher wirings + target contexts,
    // so the gate opens and the stage is wired for every minute.
    const armed = makeAutoInput({ nations: armAll(makeNations()) });
    const armedProjection = projectBattle({ ...armed, rulesetVersion: armed.rulesetVersion });
    expect(armedProjection.torpedoes).toBeDefined();
    expect(armedProjection.torpedoes!.launchers.length).toBeGreaterThan(0);
    expect(shouldWireDamageControl(armedProjection.torpedoes)).toBe(true);
  });

  it("AC-6 pinned unarmed baseline #2: a fixture whose ledger records shell-started fires stays byte-identical", () => {
    // Still unarmed in the torpedo sense — the gate must keep this battle's
    // pre-P-1 semantics even though it is full of gunnery damage.
    const unarmedProjection = projectBattle({
      ...FIRE_BASELINE_INPUT,
      rulesetVersion: FIRE_BASELINE_INPUT.rulesetVersion,
    });
    expect(unarmedProjection.torpedoes).toBeUndefined();
    expect(shouldWireDamageControl(unarmedProjection.torpedoes)).toBe(false);

    const ledger = new RandomLedger();
    const result = resolveBattleAuto({ ...FIRE_BASELINE_INPUT, randomLedger: ledger });
    expect(result.torpedoSummary).toBeUndefined();

    // ---- the ledger actually contains fire sources ------------------------
    // Every shell hit that clears the §9 ignition preconditions draws on
    // battle/ship/damage/fire_creation (immediateFireFlooding.ts). All four
    // fixture ships are battleship-hull designs -> canonical type BB, whose
    // §20 fire-risk multiplier is the 10_000 bp (100%) default, so EVERY
    // recorded draw passes §9's `drawBp < fireRiskBp` test and produced a
    // FireRecord with cause FIRE_SOURCE_CREATED. (The fixture's entityKeys
    // are exactly the four battleship-hull ships.)
    const fireCreationDraws = ledger.all.filter((d) =>
      d.streamId.startsWith("battle/ship/damage/fire_creation:"),
    );
    expect(fireCreationDraws.length).toBeGreaterThan(0);
    expect(getFireRiskBp("BB")).toBe(10_000);
    expect(new Set(fireCreationDraws.map((d) => d.entityKey))).toEqual(
      new Set(["a1", "a2", "d1", "d2"]),
    );
    const fireSourcesCreated = fireCreationDraws.filter(
      (d) => Math.floor(d.draw * 10_000) < getFireRiskBp("BB"),
    );
    expect(fireSourcesCreated.length).toBe(fireCreationDraws.length);

    // The ledger is observational: recording keyed draws must not perturb the
    // authoritative hashes (otherwise this baseline would pin ledger-on hashes).
    const withoutLedger = resolveBattleAuto(FIRE_BASELINE_INPUT);
    expect(withoutLedger.resultHash).toBe(result.resultHash);
    expect(withoutLedger.minuteHashes).toEqual(result.minuteHashes);

    // ---- pinned baseline (captured 2026-10-06 on the reviewed implementation)
    expect(result.battleEndReason).toBe("no_viable_combatants");
    expect(result.elapsedMinutes).toBe(18);
    expect(result.resultHash).toBe(FIRE_BASELINE_RESULT_HASH);
    expect(result.minuteHashes).toEqual([...FIRE_BASELINE_MINUTE_HASHES]);
    expect(result.minuteHashes).toHaveLength(FIRE_BASELINE_MINUTE_HASHES.length);
  });
});
