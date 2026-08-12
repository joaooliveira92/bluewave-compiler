# B-1 Research Note: Battle Generation & Tactical-Setup Scaffolding

> **Scope:** M2 sprint B-1 — battle generation + taking committed ship data into a
> reachable tactical format + divisions/formations (ships grouped into divisions,
> formation geometry/order, flagships).
> **Status:** Research (read-only subagent). Grounded in repo canon: `DESIGN-26`,
> `DESIGN-37`, `DESIGN-55`, `DESIGN-07` units, `SOURCE-DESIGN-v1.0.md`, and current
> schema/state/content packages.
> **Not normative.** Findings are grounding for the spec-creator; BALANCE TARGET
> items are non-normative.
> **Supersession note:** the fully exploratory "stub the 15-stage generator" stance
> in this note's §5/§8 is superseded by the normative scope in
> `.ai/specs/b1-battle-scaffolding.md`, which implements all 15 stages (per B-1's
> "battle generation" charter). Treat the spec as authoritative for scope; this note
> remains the grounding for the fields/types it names.

---

## 1. Question

When M2 battle generation carries a strategic (campaign) ship into a tactical
battle, which physical/mechanical facts are already canonical and reachable, and
which must be promoted or derived? What must divisions/formations hold per
`DESIGN-26`, and what historical formation/tactics concepts belong in `B-1` vs
later sprints (`B-2..B-5`) or `M3+`?

---

## 2. Sources read (grounding)

| Source | Role |
| --- | --- |
| `docs/domain/divisions-and-formations.md` (`DESIGN-26`) | Normative: permanent/tactical divisions, roles, formations, flagships, sizes, provenance, projection. |
| `docs/rules/battle-generation.md` (`DESIGN-37`) | Normative: 15-stage pipeline, manifest contract, roles, seeds, reservations, acceptance metalear. |
| `docs/delivery/release-scope-and-implementation-order.md` (`DESIGN-55`) | Milestone M2 = surface tactical core; §12-§14 content isolation; `CONTENT_ONLY_LOCKED` reachability gate. |
| `.ai/ENGINEERING-CONTRACT.md` | Determinism, canonical-immutable state, safe-int arithmetic, versioned formulas, ADR threshold. |
| `docs/rules/ship-design.md` (`DESIGN-07` units) | Canonical units: mass kg, speed µm/s, armor µm, 1 knot = 514,444 µm/s, 1 inch = 25,400 µm. |
| `docs/rules/ship-classification.md` | Armor-index inputs (belt/deck/turret/barbette/protected-length); hull-type taxonomy. |
| `packages/content-schema/src/design.ts` | `DesignTemplate` schema — the authored design shape actually reachable today. |
| `packages/campaign/src/state.ts` | `Ship`, `FleetState`, `CompiledDesignVersion`, `BattleInstance`/`BattleResult` — current reachable state. |
| `content/production/1880/designs.yaml` | Actual 1880 designs (armor/guns/crew/displacement/speed). |
| `content/production/1880/fleets.yaml` | Current shipped ship rows and their legacy flattened stats. |
| `packages/combat/src/resolver.ts` | Current battle auto-resolution (flat strength model) that B-1 scaffolds into. |
| `packages/nation.ts` / `manifest.ts` / `index.ts` | Reachable content-schema surface. |
| `SOURCE-DESIGN-v1.0.md` | Authority model, units, stream families, stable-state invariants, tactical position/time. |

Note: `.ai/specs/b1-battle-scaffolding.md` does **not** yet exist (spec-creator has
not run). This note intentionally grounds the facts the spec will need rather than
inventing the spec.

---

## 3. Find: what a tactical setup from a strategic ship already has

The reachable, canonical per-ship tactical input surface today (via `Ship.designVersionId`
→ `CompiledDesignVersion`) is:

| Tactical need | Reachable today? | Canonical field |
| --- | --- | --- |
| **Armor** | Yes (belt only) | `CompiledDesignVersion.normalizedArmorUm` (`armorBeltUm` in `DesignTemplate`); legacy `Ship.armor` is a flattened index. |
| **Guns (main battery)** | Yes | `mainGunsCaliber`, `mainGunsCount` (`MainGunsSchema.{caliber,count,mounts}`). `mounts` is authored but **not** carried into `CompiledDesignVersion`. |
| **Crew** | Yes | `crewComplement`. |
| **Speed** | Yes | `normalizedSpeedUms`; legacy `Ship.speed` (presented in knots). |
| **Mass / displacement** | Yes | `normalizedDisplacementKg`. Required directly by `DESIGN-26` DD-scout threshold (strictly > 1,500,000 kg). |
| **Hull type** | Yes | `hullType` (see §3.1). |
| **Hit points / survivability** | Yes | `hitPoints` (`maxHitPoints`/`hitPoints` on `Ship`). |
| **Machinery** | Yes | `machineryType`. |

**Not reachable (and not required by any B-1 normative contract):**

- **Physical dimensions** (length / beam / draft / LOA) — no field exists in
  `DesignTemplate` or `CompiledDesignVersion`. No `DESIGN-26`/`DESIGN-37` predicate
  requires them. See §6 decision note.
- **Deck / turret / barbette armor, protected length** — `ship-classification.md`
  names these inputs, but `DesignTemplate` stores only belt; the classification
  armor-index inputs are not all persisted on the compiled version. Relevant to
  `B-3` (armor/damage), deferred.
- **Secondary/tertiary armament, torpedo tubes, ammunition inventory** — not
  authored in `design.ts`. Gunnery is `B-2+`, torpedoes are `M3`.

### 3.1 Hull-type taxonomy caution
`designs.yaml` today mixes historical hull labels used across all eras in one
field: `ironclad_turret_ship`, `central_battery_ship`, `monitor`,
`coast_defense_ship` … and also later labels `battleship`, `battlecruiser`,
`dreadnought`, `heavy_cruiser`, `super_dreadnought`. `hullType` is authored
free-string in `design.ts` (not a schema `enum`). For B-1 the scaffolding should
treat `hullType` as an opaque identity token and must **not** derive division-type
compatibility from it — `DESIGN-26 §4` keys compatibility off **ship type**
(`BB`/`B`/`BC`/`CA`/`CL`/`DD`/`KE`/`AMC`/`AV`/`CV`/`CVL`), which is not currently a
reachable typed field. This is a real reachability gap (see §6 decision request).

---

## 4. Find: divisions & formations (`DESIGN-26`) — what B-1 must carry

`DESIGN-26` is already fully normative and defines exactly what the tactical layer
needs. There is **no research gap** for divisions/formations — the task is to
*implement* the already-specified records:

- **Permanent division** (`DESIGN-26 §2`): ordered ship ids, flagship, commander
  or `VACANT`, role, preferred formation, experience/cohesion, area/transit,
  training/activation, provenance. None of these fields exist in
  `packages/campaign/src/state.ts` today — B-1 must add a `PermanentDivision`
  aggregate. Ships currently live only in `FleetState.ships` with **no division
  membership** and no per-ship `commanderOfficerId`.
- **Tactical division** (`§19`): battle-local id, side, role, formation, ordered
  tactical-unit ids, tactical flagship, tactical commander, source permanent
  division ids, projection-adjustment records, campaign/temporary provenance,
  initial experience/cohesion. B-1 must add this battle-local record.
- **Formations** (`§17`): exactly `LINE_AHEAD`, `LINE_ABREAST`, `SEARCH_LINE`,
  `SCREEN`, with legality per role. "Line ahead" is *canonically a formation* here,
  not an un-grounded concept — no invention needed.
- **Flagship** (`§8`): first ship in canonical stored order; automatic replacement
  on loss.
- **Roles** (`§13`): `INDEPENDENT`, `CORE`, `SUPPORT`, `SCOUT`, `SCREEN`, `PATROL`.
- **Projection** (`§20-§22`): preserve complete eligible permanent divisions;
  permitted adjustments use exact reason codes; a tactical split never mutates
  permanent membership; splits preserve source order; deterministic `SHIP_UNAVAILABLE`
  etc.

Grounding verdict: divisions/formations MUST be represented **now** in B-1 (they are
an M2 capability and fully specified). "Squadron" is historical nomenclature — not a
canonical type in `DESIGN-26`; keep it as presentation text, not an entity.

### 4.1 Historical / doctrinal references (for formation grounding only)
- **Line ahead (column):** standard battle order for steam fleets from the
  1860s–1880s (e.g., RN actions and exercise doctrine); a fleet steams in a single
  file to maximize broadside concentration while preserving command order. Maps to
  `LINE_AHEAD` (universal legality).
- **Line abreast:** ships abeam, maximizing forward arc; used for smoke-free
  approach or crossing the T attempts; limited to ≤5 ships here — consistent with
  `DESIGN-26` six-ship-DD exclusion.
- **Divisions vs squadrons:** historically, a *division* was a tactical sub-group
  of a line (2–4 ships) and a *squadron* was a higher grouping. `DESIGN-26`
  collapses this into exactly two levels — permanent division (campaign) and
  tactical division (battle-local projection). This is a deliberate,
  already-decided simplification; do not add a squadron tier.
- **Flagship:** the senior ship carrying the commanding officer; orders are
  signal-led, directly reflected in `DESIGN-26 §16` signaling/cohesion modifiers.

These are the only historical concepts B-1 needs; everything else (T-crossing,
gunnery sectors, spotting arcs, damage control) is a later-sprint mechanic.

---

## 5. Find: battle generation (`DESIGN-37`) — scaffold scope

`DESIGN-37` already pins the full pipeline (15 stages), mission registry, manifest
contract, seeds, reservations, and acceptance classes. For a *scaffolding* B-1 the
reachable, demonstrable slice is:

- `BattleManifest` record shape matching `DESIGN-37 §30` (ids, sides, missions,
  ordered tactical-side records, permanent↔tactical division mapping, commanders,
  weather/sea-state/time placeholders, fuel/ammo/readiness/damage/crew/officer
  provenance hashes, seed, version pins, manifest hash). The current
  `packages/combat/src/resolver.ts` `BattleManifest` is only `{id, attackerId,
  defenderId, areaId, attackerFleetIds, defenderFleetIds, timestamp}` — a flat
  strength model with **no** divisions, formations, or per-ship tactical data. B-1
  must supersede/extend this into the manifest-driven model.
- Canonicalization/ordering (`§31`) and battle-seed derivation (`§32`) — pure,
  ready to scaffold.
- Tactical division projection (`DESIGN-26 §19-§22`) as the data-carrying step from
  ship → battle-local unit.
- Provenance mapping (`DESIGN-26 §23`) — the authoritative bridge ensuring battle
  results return to campaign assets. This is exactly the "reachable tactical format"
  the sprint is about.

**Do not scaffold for real resolution:** the 15-stage *generator* that decides which
battles fire, the mission predicates, optional-asset weighting, allied support,
intelligence projections, and acceptance-class consequence math are heavy machinery
that can be stubbed behind the manifest/seed contract in B-1 and filled in later M2
sprints — but note the current auto-resolution path must remain the operational
fallback per `DESIGN-55 §17` ("every reachable mission/battle type is deterministically
auto-resolvable") until tactical play is accepted. `ENGINEERING-CONTRACT` requires
determinism and provenance regardless.

---

## 6. Decision requests / unresolvable gaps (bounded)

Only one is genuinely blocking for a *typed* division projection:

1. **No typed ship `type` field reachable for division compatibility.**
   `DESIGN-26 §4` keys `division_type_compatibility_v1` off ship type
   (`BB/B/BC/CA/CL/DD/KE/AMC/AV/CV/CVL`), but `design.ts` `DesignTemplate`/`Ship`
   exposes only free-string `hullType`. B-1 needs a canonical typed `shipType`
   (schema `enum`) derived during compilation (or mapped from `hullType` by a
   versioned, reviewable table). **Recommendation:** add a typed `shipType` field to
   the compiled design/`Ship` and populate it for the 1880 pack. This is a
   research-confirmed requirement of `DESIGN-26`, not an invention.

Non-blocking recommendations / observations (flag to orchestrator, no decision
request needed):

2. **Physical dimensions** — absent and unrequired for B-1. Do **not** add
   length/beam/draft now; revisit only if a `DESIGN-26`-`DESIGN-37` predicate
   demands them (none does). Defer.
3. **`speedUms` values in current 1880 `designs.yaml`** look like legacy/placeholder
   scale (e.g. `speedUms: 8`), not the `DESIGN-07` µm/s convention (15 kn =
   7,716,660 µm/s; 30 kn = 15,433,320 µm/s for the DD-scout threshold). The DD-scout
   predicate in `DESIGN-26 §15` will mis-fire on such values. Data-quality flag for
   the implementator, not a design decision.
4. **`mounts` not carried into `CompiledDesignVersion`** — harmless for B-1 (gunnery
   is later) but should ride along when the compiled record is extended for `B-2`.
5. **Sprint boundary** — no M2 roadmap/spec exists in-repo (`B-1..B-5` split is from
   the orchestrator prompt). This note assumes gunnery=`B-2/3`, armor/damage=`B-3`,
   movement/spotting=`B-2/4`, weather=M2 but not B-1. Confirm boundaries when the
   spec is written.

---

## 7. Recommendations (what B-1 should ground)

1. Carry ships into battle exclusively through the **compiled design version**
   (`Ship.designVersionId` → `CompiledDesignVersion`), not the legacy flattened
   `Ship.firepower/armor`. Extend `CompiledDesignVersion` (add `shipType`; carry
   `mounts` when convenient) under a versioned compile — do **not** read them from
   renderer/UI.
2. Add **`PermanentDivision`** to campaign state per `DESIGN-26 §2`, plus a typed
   `shipType` per ship (§6), so division compatibility, roles, sizes, flagships, and
   DD-scout predicates are computable.
3. Add **`TacticalDivision`** as an immutable battle-local record per `DESIGN-26
   §19`, with `CampaignAssetProvenance` (and `TemporaryAssetProvenance`) per `§23`
   as the reachability/return bridge.
4. Extend `BattleManifest` (combat package) from the flat strength model toward the
   `DESIGN-37 §30` shape — sides, ordered tactical divisions, provenance, seed,
   version pins, manifest hash — **without** implementing the 15-stage generator or
   gunnery. Keep the existing strength auto-resolver as the operational fallback
   until tactical play is accepted (`DESIGN-55 §17`).
5. Keep divisions/formations/flagship exactly as `DESIGN-26` specifies (line ahead,
   line abreast, search line, screen; six roles; ≤5 ships, ≤6 for DD). No squadron
   tier.

---

## 8. Deferred (out of B-1)

- **Movement, spotting/contact, gunnery** → B-2/B-3 surface-tactical sprints.
- **Basic armor & damage resolution** → B-3 (`armorBeltUm`/`hitPoints` stay
  reachable but unevaluated in B-1).
- **Tactical weather** → M2 capability but not a B-1 data need beyond placeholder
  in the manifest.
- **Full 15-stage battle *generator*** (mission predicates, optional-asset
  weighting, allied support, intelligence projections, acceptance-class declines)
  → later M2 work; keep behind the manifest/seed contract.
- **Torpedoes, mines, submarines, coastal defenses, smoke, detailed damage
  control** → M3 (`DESIGN-55 §4`).
- **Aviation / carriers / squadrons / AA** → M4.
- **Radar, EW, data links, guided weapons, SAM, missiles, jets** → M5 (`DESIGN-55
  §6`).
- Any content item a later ability would need remains `CONTENT_ONLY_LOCKED` and
  unreachable per `DESIGN-55 §12-§14`; nothing in B-1 may unlock it.

---

## 9. One-line summary

Battle scaffolding needs: a typed per-ship `shipType` to satisfy `DESIGN-26`
division compatibility (only genuine gap); armor/guns/crew/speed/mass/hull already
canonical via `CompiledDesignVersion`; divisions-formations-flagship already fully
specified by `DESIGN-26` and belong in B-1; dimensions and all resolution mechanics
(gunnery, armor/damage, movement, spotting, weather) are deferred. Keep the existing
auto-resolution path as the `DESIGN-55 §17` fallback until tactical play is accepted.
