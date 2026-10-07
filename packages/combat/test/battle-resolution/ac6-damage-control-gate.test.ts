// P-1 ticket 09 (ADR-0049): damage control now runs in EVERY auto-resolved
// battle (the ADR-0047 torpedo-armament gate is gone). This file pins an unarmed
// baseline whose random ledger proves the fixture contains shell-started fires
// (§9 FIRE_SOURCE_CREATED draws). Ticket 09 was observably quiet here because
// shell-created sources were not persisted; ticket 10 (ADR-0050) persists them
// into ShipDamageState.fireRecords/floodingRecords, so step 8.6 now progresses
// them and the baseline was re-pinned through the ADR-0007 process.
//
// Pure/deterministic: fixed fixture, fixed campaign seed, no ambient random.
import { describe, expect, it } from "vite-plus/test";
import { RandomLedger } from "@bluewave/random";
import { projectBattle } from "../../src/battleResolution/project.js";
import { resolveBattleAuto } from "../../src/battleResolution/resolve.js";
import { getFireRiskBp } from "../../src/damage/immediateFireFlooding.js";
import { makeAutoInput, makeNations } from "./fixtures.js";

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
//
// Re-pinned for ticket 10 / ADR-0050 (shell-created fire/flooding persisted):
// RESULT 9c88d23f39316ad8... -> c6b73c6f73d16d4a...; minutes 0-2 byte-identical,
// minutes 3-17 changed (first persisted source progresses from minute 3); the
// fixture still ends no_viable_combatants at minute 18.
const FIRE_BASELINE_RESULT_HASH =
  "c6b73c6f73d16d4ab9a5d9ce1ffe1878d1474386f924abfd38cf08d4d7a285d4";
const FIRE_BASELINE_MINUTE_HASHES = [
  "704d9118704bb7ff99215a06c9eabcbda043c21f897e87accd311494f0c8f218",
  "2e2de88b6ed11699c2fdd380ff71340886c2f3fd2d3dd78bb1f2cd6d7665a275",
  "a48b85fb060d64ed510650c47bc881f06d62e7f5320d0c8549eb5193640e1a81",
  "393c5b4d9e9d7ad48281be6b47d59bd3da6c88eaabc4e1b164cad3a4b41d4abb",
  "0a4dbd6463f77acea380e0b1a50543f14efe0add9de7fa7db012b1e3cde95427",
  "68ff962be6c506c3e6aa0d78866a72dad0ae40857766ce10d3518a34f2244c64",
  "0d787bb23cf04557fedfe2b2f110e32ff6a897c22fc1ed24f76d86be5386e28a",
  "21b9742461fc83079792a6e23f1a9cfccf851a52de4b5990385ff429863c19d6",
  "20acedec8054b1f9e2be99b3b082b2658ea33c67ac5dc4fddcda19a40ae0691c",
  "3f626dea48903fc7fb1637a1df6edac7c9dac16da368537b06502e92d8c1431c",
  "1c89c15dafa3827b61e1a9096e567163c5b401aeb7c3bd2beae84c017e02397a",
  "86e78535441184508cb523f013770fa02908c55703a04df2709d2db8dde1f7af",
  "066394158c2275996a4bbae838c9c080f7efabd6c4105cac0608bb3eb4360914",
  "85fcaf6eeab83b838cb946de5894e018c5407f69e689b70beba79c88b616ce7d",
  "f8386e7e033f371befcaa55eddfe1f72e3fe21d99d4a3f076f7c5f0569f1e48b",
  "b5e86205c2a1958504257ab85f5e015a25693805c144e692395fee2df532c032",
  "9a34adb83ab39250286f2d117e89427ef97b81ce044e93d2d92d8381764bd375",
  "97a7125156533c7c98bc85adbfbc1029626b4dcc4d9c68866483488d9f1c7888",
] as const;

describe("unarmed damage control (P-1 ticket 09)", () => {
  it("unarmed baseline #2: damage control wired in an unarmed battle with persisted shell-started fires (ticket 10)", () => {
    // Unarmed in the torpedo sense, yet the damage-control stage is wired.
    const unarmedProjection = projectBattle({
      ...FIRE_BASELINE_INPUT,
      rulesetVersion: FIRE_BASELINE_INPUT.rulesetVersion,
    });
    expect(unarmedProjection.torpedoes).toBeUndefined();

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
