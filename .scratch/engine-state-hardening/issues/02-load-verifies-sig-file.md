# 02 — Load verifies campaign.sig.json (independent tamper check)

**What to build:** loading a save rejects any on-disk save whose body no longer
matches its signature. Today the persistence layer recomputes `rawHash` and the
envelope from the same `campaign.json` file that stores them, so a modified file
passes verification as long as the attacker recomputes both — the separately
written signature file is never read, making on-disk tamper detection decorative.
This ticket makes `SaveStore`/`loadById` read the signature and refuse a save
whose body hash disagrees with it, so external modification is caught even if the
in-file hashes were recomputed. Legacy saves written without a signature still
load (with a validation diagnostic), so existing saves and turn-zero campaigns are
not broken.

**Blocked by:** None — can start immediately.

**Type:** implementation
**Status:** resolved
**Frontier:** yes

- [x] Load path reads the signature file and rejects a save whose body hash does not match it.
- [x] Tamper test: modify `campaign.json`, recompute its stored `rawHash`/envelope only, and confirm load is refused on signature mismatch.
- [x] Legacy-compat test: a save without a signature file still loads, carrying a validation diagnostic.
- [x] Round-trip test: a normally saved campaign loads under the new check (no false rejections).
- [ ] Full repo gate green: uncached build, `tsc -b`, lint, all per-package tests, goldens unchanged, two-process determinism byte-identical. — **Blocked at baseline by unrelated uncommitted WIP** (desktop `campaign-screen-registry` typecheck; `events`-ledger `Invalid datetime` breaking the two-process gate; combat/content-schema/campaign/commands/ai test failures). Re-run once that WIP lands; see Resolution.

## Resolution

Implemented on `dev` (this issue), released via `dev → main` at a release
boundary. `packages/persistence/src/store.ts` `loadById` already verified the
signature file (gate B, from ADR-0032); this ticket closed the remaining gap: a
save whose `campaign.sig.json` is **absent** is now a legacy save that still
loads, but emits a `PERSISTENCE_UNSIGNED_SAVE` warning instead of being hard
rejected (a present-but-invalid/mismatching signature is still a
`PERSISTENCE_CORRUPT_SAVE` error). Gate B is extracted into a
`SaveStore.validateSignature` helper. The independent-tamper guarantee is scoped
to saves that still *carry* a signature (signature deletion degrades to the
legacy warn path — documented in ADR-0032). New tests in
`packages/persistence/test/remediation.test.ts`: (a) the independent-tamper case
— the attacker edits `campaign.json` and recomputes the in-file `rawHash` +
envelope so the in-file gates would pass, and load is still refused because the
untouched signature disagrees; (b) legacy-compat — deleting the signature file
loads the save and carries the warning; (c) round-trip — a normally signed save
loads with no error or warning.

Validation (`packages/persistence` package only; the full-repo `check` is blocked
at baseline by unrelated uncommitted combat/torpedo, content-schema, campaign,
commands, ai, and events WIP — the desktop `campaign-screen-registry` typecheck
break and the events-ledger `Invalid datetime` that break the two-process gate are
in WIP files this ticket never touches): `tsc --noEmit` 0, `vp lint .` 0 errors,
all 41 `@bluewave/persistence` tests green, and every persistence consumer
(`desktop`, `compiler-cli`, `phase-engine`, `cross-process-test`) passes. The
two-process/golden gates re-run once the baseline WIP lands.