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

// Auto-resolution gunnery fidelity (P-1 ticket 06 / ADR-0048) made the timeline
// range- and gun-count-sensitive, so this unarmed (torpedo-sense) baseline hash
// moved 2026-10-06. Re-pinned; the fixture still ends no_viable_combatants at
// minute 18. Old -> new: RESULT 1c47f90b0a36... -> 9c88d23f3931...; minutes 1-6
// and 14-17 changed (minutes 0, 7, 9-13 byte-identical — those minutes fired no
// gunnery salvo). Minute 0 (704d9118...) unchanged because no battery has
// completed a reload at minute 0.
const FIRE_BASELINE_RESULT_HASH =
  "9c88d23f39316ad89a37041703d71e20582ea44434ae22d41ecc4972c6faa1f2";
const FIRE_BASELINE_MINUTE_HASHES = [
  "704d9118704bb7ff99215a06c9eabcbda043c21f897e87accd311494f0c8f218",
  "2e2de88b6ed11699c2fdd380ff71340886c2f3fd2d3dd78bb1f2cd6d7665a275",
  "a48b85fb060d64ed510650c47bc881f06d62e7f5320d0c8549eb5193640e1a81",
  "b0cac36501a2325e60ef7aa45c39aa2d4ed4291e09d814617f5806c76678366e",
  "7cd8b37d435faa3bad44b486f03b4fea66b44a51e0d18ee3edf73b8af920024b",
  "3704f048bfd0dfa097102caf6cb4f9cbd47cadcc32c4d62265b9682f793327cd",
  "147f181b02a94e68628433c8ac198998094c5cd6f8c79d125f5e9b6a5519a7c9",
  "ec41098e604b234580804d7deb9cf0ee87c9c6ea6f515fbbeb3670c3fc70aea3",
  "8ffacbdb20adca6d3d044cb944743d8e9c4fc54a06b05c204f2e164df73b979b",
  "32e7a20860d5fcb2dbbbe10388652c4b3436fc873916e8b324b4caa856417a03",
  "69d7f5179a797c0100468b622f633d4432059fde8b40c300cedb404ca76e1dd0",
  "d30c06a95efcd0b488fa06b09b3377bd640681e842496df7f21b2ab5812cf3d4",
  "5ff8e4393b9ecffd32419937c22a789911e40c4e8b0a49b8316c3fcabc402abe",
  "8f725505dfacd5e0f2f08fee6bc0bf6cdd235ba42e90ee58b3bd1d2cf452f26f",
  "fedd8bb1b691025d1f2e038df3ac2451da0ece694eca1eb9cc40f339212cf807",
  "8fd5b879e7eba56ca3f6220d7e3946e383e04dad8596c34e2dcb53213c213b63",
  "44b43ca038a998389773d3dd0e9db73ef59a4a8cd5f2d27865457ea4d6c06228",
  "346ad2155adc26d1d3ede9cb4f6950e7a4fba46891074016d2e12a4e80d2ccb3",
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
