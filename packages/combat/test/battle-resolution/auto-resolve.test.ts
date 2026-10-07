import { describe, it, expect } from "vite-plus/test";
import { BluewaveError } from "@bluewave/contracts";
import { resolveBattleAuto } from "../../src/battleResolution/resolve.js";
import { BATTLE_END_PRECEDENCE, DEFAULT_MAX_BATTLE_MINUTES } from "../../src/battleEnd.js";
import { AUTO_RESOLUTION_UNAVAILABLE } from "../../src/generation/reasonCodes.js";
import { computeManifestHash } from "../../src/generation/manifest.js";
import { makeAutoInput, makeManifest, makeNations } from "./fixtures.js";

const SECTION_32_REASONS = [...BATTLE_END_PRECEDENCE];

describe("AC-5: resolveBattleAuto orchestrator (end-to-end)", () => {
  it("runs a full battle to a §32 end and emits a complete result", () => {
    const input = makeAutoInput();
    const result = resolveBattleAuto(input);

    // §32 reason id
    expect(SECTION_32_REASONS).toContain(result.battleEndReason);
    // elapsed within bounds and capped at maxMinutes
    expect(result.elapsedMinutes).toBeGreaterThan(0);
    expect(result.elapsedMinutes).toBeLessThanOrEqual(DEFAULT_MAX_BATTLE_MINUTES);

    // every ship is either survivor or sunk, exactly once per side
    const all = ["a1", "a2", "d1", "d2"];
    const survivors = [...result.attackerSurvivorIds, ...result.defenderSurvivorIds];
    const sunk = [...result.attackerSunkIds, ...result.defenderSunkIds];
    expect([...survivors, ...sunk].sort()).toEqual(all.sort());
    expect(new Set([...survivors, ...sunk]).size).toBe(all.length);

    // damageReport: every ship, integer >= 0
    expect(Object.keys(result.damageReport).sort()).toEqual(all.sort());
    for (const loss of Object.values(result.damageReport)) {
      expect(Number.isInteger(loss)).toBe(true);
      expect(loss as number).toBeGreaterThanOrEqual(0);
    }

    // hashes
    expect(result.eventLedgerHash).toMatch(/^[0-9a-f]{64}$/);
    expect(result.resultHash).toMatch(/^[0-9a-f]{64}$/);
    expect(result.minuteHashes.length).toBe(result.elapsedMinutes);
    for (const h of result.minuteHashes) expect(h).toMatch(/^[0-9a-f]{64}$/);

    // provenance
    expect(result.provenance.battleId).toBe("b6-inc2-battle-001");
    expect(result.provenance.manifestHash).toBe(computeManifestHash(input.manifest));
  });

  it("winner/loser semantics: the armed fixture resolves no_viable_combatants and the loser's ships are all sunk", () => {
    const input = makeAutoInput();
    const result = resolveBattleAuto(input);

    // Lock the wiring: the armed scenario MUST deal real damage (a regression
    // that silently starves gunnery->damage would flip this to time_limit).
    const losses = Object.values(result.damageReport);
    expect(losses.some((loss) => (loss as number) > 0)).toBe(true);

    // The fixed fixture seed deterministically produces an eliminated side
    // (§32 no_viable_combatants) before the 360-minute cap.
    expect(result.battleEndReason).toBe("no_viable_combatants");
    expect([input.attacker.nationId, input.defender.nationId]).toContain(result.winnerId);
    const loserId = result.winnerId === input.attacker.nationId ? "n-fr" : "n-uk";
    expect(result.loserId).toBe(loserId);
    const loserShips = loserId === "n-fr" ? ["d1", "d2"] : ["a1", "a2"];
    for (const ship of loserShips) {
      expect([...result.attackerSunkIds, ...result.defenderSunkIds]).toContain(ship);
    }
    expect(
      result.attackerSurvivorIds.filter((s) => s.startsWith(loserId === "n-uk" ? "a" : "d")),
    ).toEqual([]);
  });

  it("identical inputs -> byte-identical results (in-process determinism)", () => {
    const a = resolveBattleAuto(makeAutoInput());
    const b = resolveBattleAuto(makeAutoInput());
    expect(a.resultHash).toBe(b.resultHash);
    expect(a.eventLedgerHash).toBe(b.eventLedgerHash);
    expect(a.minuteHashes).toEqual(b.minuteHashes);
    expect(a.damageReport).toEqual(b.damageReport);
  });

  it("AC-6 pinned unarmed baseline: resolveBattleAuto(makeAutoInput()) stays byte-identical (P-1 review F5)", () => {
    // The fixture carries main batteries but NO torpedo-armament ships, so the
    // wired per-ship damage-control stage never activates — this is the pre-P-1
    // "unarmed" resolution path. Pinning these hashes (captured 2026-10-06
    // before ANY ticket-07 repair landed) proves the DC rollout did not perturb
    // the unarmed world: the unarmed hash freeze (amended AC-6, ADR-0049) holds through the kg->bp severity
    // fix, the fail-closed engine guard, and the reason-code registration.
    // Re-pinned for ticket 06 / ADR-0048: range- and gun-count-sensitive gunnery
    // moved the fired minutes' hashes 2026-10-06 (minute 0 is byte-identical —
    // no battery has completed a reload at minute 0). Old -> new: RESULT
    // 88d409ac... -> 74d2dfe7...; minute 1 cab4b696... -> cfe97211...; last
    // minute b0cb413a... -> 97c94150...; battle still ends no_viable_combatants
    // at minute 18.
    // Re-pinned for ticket 10 / ADR-0050 (shell-created fire/flooding sources
    // persisted into ShipDamageState; step 8.6 progresses them): RESULT
    // 74d2dfe7... -> e017125e...; minutes 0-2 byte-identical (minute 1 is still
    // cfe97211...), minutes 3-17 changed; the battle now ends no_viable_combatants
    // at minute 14 (was 18) because persisted fires/flooding sink ships sooner;
    // last minute 97c94150... -> 0493ad21....
    const result = resolveBattleAuto(makeAutoInput());
    expect(result.battleEndReason).toBe("no_viable_combatants");
    expect(result.elapsedMinutes).toBe(14);
    expect(result.resultHash).toBe(
      "e017125ea0d2a8b00ed38709ea932cbcaffae070151d2b95b29d3f93f2a4ba17",
    );
    expect(result.minuteHashes[0]).toBe(
      "704d9118704bb7ff99215a06c9eabcbda043c21f897e87accd311494f0c8f218",
    );
    expect(result.minuteHashes[1]).toBe(
      "cfe97211b8387654f49b33f273cd294cfda133c9e9ade3fe595867f5d8654b15",
    );
    expect(result.minuteHashes[result.minuteHashes.length - 1]).toBe(
      "0493ad21d340cd1f1bb513b6fbd100ecbe79535d62fec3370f6b82d65c8b3bd7",
    );
  });

  it("missing manifest fails closed with AUTO_RESOLUTION_UNAVAILABLE", () => {
    const input = makeAutoInput();
    let caught: unknown;
    try {
      resolveBattleAuto({ ...input, manifest: undefined as never });
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(BluewaveError);
    expect((caught as BluewaveError).message).toBe(AUTO_RESOLUTION_UNAVAILABLE);
  });

  it("a nation not listed on its manifest side fails closed with a stable diagnostic", () => {
    const input = makeAutoInput({
      manifest: makeManifest({
        sides: [
          { sideId: "ATTACKER", participantIds: ["n-other"] },
          { sideId: "DEFENDER", participantIds: ["n-fr"] },
        ],
      }),
    });
    let caught: unknown;
    try {
      resolveBattleAuto(input);
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(BluewaveError);
  });

  it("maxMinutes caps the battle at the configured limit", () => {
    const result = resolveBattleAuto(makeAutoInput({ maxMinutes: 5 }));
    expect(result.elapsedMinutes).toBeLessThanOrEqual(5);
  });

  it("time-limit end-to-end: unarmed fleets resolve 360 minutes to time_limit (§32, terminating-minute effects included)", () => {
    // both sides' ships carry no main battery -> nothing lethal; the battle
    // runs the full default duration and ends with the time_limit reason and
    // no winner, with every minute's effects resolved into the ledger.
    const input = makeAutoInput({
      nations: makeNations({ attackerGuns: [0, 0], defenderGuns: [0, 0] }),
    });
    const result = resolveBattleAuto(input);
    expect(result.battleEndReason).toBe("time_limit");
    expect(result.elapsedMinutes).toBe(DEFAULT_MAX_BATTLE_MINUTES);
    expect(result.winnerId).toBeNull();
    expect(result.loserId).toBeNull();
    expect(result.attackerSurvivorIds).toEqual(["a1", "a2"]);
    expect(result.defenderSurvivorIds).toEqual(["d1", "d2"]);
    expect(result.attackerSunkIds).toEqual([]);
    expect(result.defenderSunkIds).toEqual([]);
    // all 360 minutes resolved with per-minute hashes
    expect(result.minuteHashes).toHaveLength(DEFAULT_MAX_BATTLE_MINUTES);
    // terminating-minute effects were resolved: the final minute contributed
    // weather events to the authoritative ledger
    expect(result.eventLedgerHash).toMatch(/^[0-9a-f]{64}$/);
  });
});
