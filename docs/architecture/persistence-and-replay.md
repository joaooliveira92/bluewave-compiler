# DESIGN-52: Save, Load, Replay, And Persistence

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-52`

Stable Save Boundaries:

- MonthOpeningSnapshot.
- MonthClosingSnapshot.
- Tactical minute boundary where battle saving is enabled.

Save Manifest:

- Save-format version.
- Ruleset version.
- Formula version.
- AI-policy version.
- RNG algorithm version.
- Content-pack identifier and hash.
- Scenario identifier and hash.
- Campaign identifier.
- Current phase cursor.
- Strategic snapshot hash.
- Active battle hash.
- RNG manifest hash.
- Design artifact hashes.
- Command/event ledger position.
- Migration history.

Persistence:

- Stores authoritative state.
- Derived projections may be rebuilt.
- RNG stream state or deterministic derivation position is persisted.
- Every individual compiled design is stored or content-addressed.
- Save files do not depend on untracked external design files.

Autosave:

- Occurs after every completed month.
- Battle autosave occurs at configured stable intervals.
- Writes are atomic:
  1. Write new save.
  2. Validate.
  3. Compute hash.
  4. Commit active pointer.
  5. Retain previous recovery save.

Load:

- Validates hashes and content compatibility.
- Applies supported migrations.
- Rebuilds derived projections.
- Runs invariant validation.
- Rejects unrecoverable canonical corruption.

Replay:

- Tactical replay uses:
  - initial battle snapshot;
  - battle seed;
  - command log;
  - ruleset.
- Strategic replay uses:
  - compiled initial snapshot;
  - monthly commands;
  - decisions;
  - content and ruleset hashes.

Ruleset Compatibility:

- Campaigns are pinned to their original ruleset by default.
- Migration to a changed ruleset requires an explicit supported migration.
- Silent formula changes to an existing campaign are prohibited.
