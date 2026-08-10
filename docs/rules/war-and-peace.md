# DESIGN-31: War And Peace

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-31`

War:

- Stable identity.
- Belligerent sides.
- Participants.
- Entry and exit dates.
- War goals.
- Side war score.
- National contribution.
- Blockade relationships.
- Peace tracks.
- War duration.
- Exhaustion effects.

Multiple Wars:

- A nation may participate in multiple wars if rules permit.
- War identities do not automatically merge.
- Participant membership records alliance and side context.

War Score:

- Derived from:
  - battle outcomes;
  - objectives;
  - blockade;
  - merchant warfare;
  - occupation;
  - strategic events.
- National contribution is tracked separately from side score.

Peace:

- Large score advantage increases peace eligibility.
- Peace offers are explicit negotiation objects.
- Player choices influence acceptable terms and political consequences.

Settlement:

- May contain:
  - resource adjustment;
  - possession transfer;
  - occupation recognition;
  - ship transfer;
  - reparations;
  - shipbuilding restrictions;
  - treaty obligations.
- Terms are validated and applied atomically.
- Allies receive claims according to contribution, objectives, and negotiated
  priority.
- Unused claim value may become a smaller base-resource gain.

Separate Peace:

- Removes one participant without necessarily ending the war.
- Recalculates sides, access, blockade, and occupation.
- Cannot leave invalid alliance-war states.

Revolutionary Defeat:

- May force harsh terms.
- Uses explicit revolution and peace logic.
- Is not an arbitrary direct mutation.
