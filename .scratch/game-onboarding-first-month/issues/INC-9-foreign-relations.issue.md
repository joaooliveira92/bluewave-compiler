# INC-9 — Foreign Relations polish

**What to build:** The read-only Foreign Relations page refinements, per [the
assembled spec](../spec.md) §13 — over the already-shipped Diplomacy & War
surface.

- **Likely-rival marker:** mark each Relations row whose `partnerName`
  matches the player nation's `NATION_DOSSIER_FIELDS.likelyRivals` list
  (presentation-only flavor data, never alters simulation; non-playable
  nations get no marker).
- **High-tension warning:** for any relation with `isHighTension(tension)`
  (≥ 8 → `hostile`/`war_imminent`), show **current-state copy** ("Relations
  with X are hostile; war is possible") — NOT the doc's "may lead to war in a
  future milestone" framing (war already exists and is displayed).
- Tension labels via `tensionLabel` (imported from `diplomacy.ts`, never
  renderer-re-derived).
- **No "change since previous month"** (no previous-turn tension stored, no
  monthly tension processing) and **no Declare War / peace negotiation
  actions** — read-only.
- Wars/Blockades sections unchanged (already shipped).

**Blocked by:** INC-14 (nav shell)

**Status:** ready-for-agent

- [ ] Likely-rival markers come from `NATION_DOSSIER_FIELDS.likelyRivals`
      (presentation-only), matching by `partnerName`
- [ ] High-tension warning uses `isHighTension`/`tensionLabel` with
      current-state copy — no "future milestone" phrasing anywhere
- [ ] No monthly-change display, no diplomatic-action controls
- [ ] Component tests cover the marker + warning logic
- [ ] Goldens 10/10 unchanged
