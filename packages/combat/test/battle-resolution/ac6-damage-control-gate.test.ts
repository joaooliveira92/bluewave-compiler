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
//
// Re-pinned for ADR-0053 (P-1 lethality tuning: FLOAT_UNIT 50_000 -> 400_000 and
// magazine-weighted hit zones): RESULT c6b73c6f... -> f762c5855afe...; the fixture now ends
// no_viable_combatants at minute 70 (was 18); minutes 0-1 byte-identical
// (2e2de88b... at minute 1), later minutes changed. A forced-old-constant run
// (FLOAT_UNIT 50_000, equal zone weights) reproduces c6b73c6f... exactly, so the
// move is due to the tuning alone.
// Re-pinned for ADR-0073 (P-1 ticket 12, withdrawal predicate: a side below 20%
// fleet strength breaks off): RESULT f762c585... -> 24dd6c78...; minutes 0-51
// byte-identical to the previous pin (the 52-entry list is a strict prefix of the
// old 70), the fixture now ends withdrawal_complete at minute 52 (was
// no_viable_combatants at 70) with no ship sunk. The cause is the new battle-end
// predicate alone.
const FIRE_BASELINE_RESULT_HASH =
  "24dd6c7876d435229e724efadee395462de1e50471030ee76675db254abf9057";
const FIRE_BASELINE_MINUTE_HASHES = [
  "704d9118704bb7ff99215a06c9eabcbda043c21f897e87accd311494f0c8f218",
  "2e2de88b6ed11699c2fdd380ff71340886c2f3fd2d3dd78bb1f2cd6d7665a275",
  "a48b85fb060d64ed510650c47bc881f06d62e7f5320d0c8549eb5193640e1a81",
  "b0cac36501a2325e60ef7aa45c39aa2d4ed4291e09d814617f5806c76678366e",
  "7cd8b37d435faa3bad44b486f03b4fea66b44a51e0d18ee3edf73b8af920024b",
  "a2f8ee93388fb7b8ad343855831e370972f42677bab41825114314109967f57a",
  "0ee687d2335db266eef5a21e35593513cdb4a9ad4a82acbbb9c5f59d5b4a9568",
  "345bdd7b474ef7a948993b261573a7b033c191596ebd231b9f6e1303768a998a",
  "7e52fbfd6bc2824190a09a568da985847dcb5d03d9fbe45ab6d663ea0f6d0efc",
  "54626d99b54154d0763a9cc71b67f9def0fec1fccf55b48e10d757e117f15a40",
  "fd924be48afac461dd49dc492282e0777e79e1d0b5e996d23559ac2deb40105e",
  "30e9e6b73f7008180fc075671943cb320edf04ee91f4de76acb7feba25eed7c3",
  "e589875a4060b685e796db5a52ffc3969aef60c63b697e0e0fac2698ce262c59",
  "f1d894838296574448213ea23b27c11f2cfbb060bd8c156b51dc7c909a1a0fdd",
  "a0c538899d8ad98488398d372d2ed3b67d977c23210b225a3d05d672b6ebe247",
  "a0d6fb651d541d5806ead9e6f3066947ec96d2d75067a3cfe1661925808bd8be",
  "b773bf600f7b36ad6ffb7601845d74a2ed2a8413e3311b79dc6de6036a01c9d3",
  "37d21268c2b59405087148957e1a5ee84861399786b5e66b7381f47334eea362",
  "84f8deb495ce4b8f2b6eb0ccbcd0ff0fd60e89e3e46271be3a635804e8510627",
  "8f7be0cb0947bbbbb96c64291fda3433ca23df2bee67dfc215eae330da9393a6",
  "dd086b89dc07389221dd811cf9e3f71ff558c76f4e2fd5562d6ec27f040caf16",
  "d6c45eac472d73185046a94e026317e65ad969a12992c5849846a1b9cc264d53",
  "bd0cdc20735707ab852047ae3a0abf473093a09439de3bdd32309c766578106a",
  "0742e0fe38d7af798b62785f10fb7ec8c48e643e6c38f5528c23752e0d101e70",
  "9f48c5f1ea8a27a7f8e2ae24337eb1c7200260791863690ff9851c702f9e8b56",
  "99da8c7868fb29d8afee8d742460f9d1df05a684e97cc187627e508307826de6",
  "72d49f28398985e1e59315754ee08b4f8dcff771b2b9ba6b71c86b66fe300cc3",
  "0a6e980a61cbd0a99acbf73a8c3634347bdcc1fd94118c3ad6c8091c0d902e87",
  "be2615adf3db1b6b7088a68487580fc710f5373b3770f9a60f4180c9e8b07ca6",
  "457cdc9ffb7220f0c0616c53b1114a718730b69d38a29a943fed0d2081b020b0",
  "019cb33a512f91bb639955fc28edbe9e4eb91344d679d8ba403e59b03dbcc225",
  "b4b9123c843b2ab0addf4e27f1abab892100cfc89931d74487e1c3390d36588b",
  "188e21184e23ae9ac99775c0b94864ea81ea9c616c616bfeda328d774cc3c266",
  "1e9c8b1b0ec03cbd9ceafee331dc40c1a31ba2f38561ee5d3d9b2d40f5ec836a",
  "d657e7392d6ff9c230dbc8f903e740abfb4a992cc785dfb10579eb3afe535099",
  "a0e1db4a26587449217df2ae8b05e183a8b5fc7de88ac1c38a1e610b1f473cb4",
  "580613b18266fceb284f99de8507ae541553891e9a426d0bf754259f5a3f91a1",
  "6ed70a3720412377f441b5b4fcabc04f412ea365665254a009b8b8d3a50b9cf2",
  "d005f998636888d80816da588d22aa68314efc119062325c793fa55310bbd56e",
  "abce51878872cb392bbbc029da9833dd7a57cac9b2f8cce0ff283a2e1a82015a",
  "a11658b66cda4c020dfd09e5c3b66dd6cbb8229406aee9105d80ac1923238134",
  "d64961830b040e453c29dbe771e3465c823fd3d62120663896333d2962a8d096",
  "560f081234feec750d9718205a7182b8f89d8a9702ac92b4d346399b6c93f651",
  "9a114dea34c6fc7e301b046ab46917e5aae0ab32b3521f64144f6f4e6fc6620a",
  "b1a294407919c5f2871a790b0ba96b1f7558b2db50e4feefe40b48a26480c066",
  "9b48e9ad5460cba090840f158a24956b9c5a38e34b23264ede913e2de7a182ac",
  "427e94c468151daa25696bef271fdcbbe263b526b1bffd43d03e98cb0ab3ae00",
  "b80b99d208c735828fa7b981fd17a00d4b0ecca37d324c66877c2eb72bebce1c",
  "27c13e9d17a322e28f452fd4066b4a1bb8a7d3c12fdb53f2cfc3e6edb0409fc6",
  "5aac20e60813c86701a3aff7b22aa87f91da30f123c761138f1bd65652509324",
  "3441427c68a4c0da5b668a5e6bc9ed094ff51620539164cadc526e7d714fce08",
  "ccc3483a8d9f3ba146e8b83ba87a5b44d06a09ffad86ece071613b8b00e5a8f1",
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
    expect(result.battleEndReason).toBe("withdrawal_complete");
    expect(result.elapsedMinutes).toBe(52);
    expect(result.resultHash).toBe(FIRE_BASELINE_RESULT_HASH);
    expect(result.minuteHashes).toEqual([...FIRE_BASELINE_MINUTE_HASHES]);
    expect(result.minuteHashes).toHaveLength(FIRE_BASELINE_MINUTE_HASHES.length);
  });
});
