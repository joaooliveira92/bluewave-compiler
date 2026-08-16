# Research — C-2 M3 Mine Warfare (scope note: research not required for shipped constants)

> Sprint: C-2 / M3 (`@bluewave/combat`, DESIGN-35 mine-warfare rules,
> `.scratch/c2-m3-mine-warfare`).
> Purpose: this note explains **why** a full primary-source grounding pass (of the
> kind `docs/research/c1-m3-torpedoes.md` ran for the open torpedo-model catalog)
> was not run for C-2, and records the light historical context that informed the
> scope decisions in `.scratch/c2-m3-mine-warfare/issues/04-sweeping-dual-equipment.md`
> and `06-content-constant-policy.md`. It is **not** a source-verified constant
> grounding document — no number below is claimed as independently verified
> against a primary source, and none of the shipped `*_v1` constants in this
> sprint's spec depend on anything in this file.

## 1. Why no grounding pass was run

DESIGN-35 (`docs/rules/mine-warfare.md`) is unlike DESIGN-40 (torpedoes) in one
structurally important way: it does not leave an open content catalog for the
implementer to author and ground. Every numeric constant this sprint ships is
already an exact, `MUST`-level value inside the design document itself:

- sweeping base values (§7): `150/100/80/100/60/50/120` — literal.
- dual-equipment mode multipliers (§8): five exact basis-point pairs — literal.
- mine-type sweep-resistance multipliers (§9): six exact values — literal.
- severity weights (§15, referenced for the deferred strike slice): six exact
  values totaling `10_000` — literal.
- defensive-standoff thresholds and effects (§16): four exact pressure bands and
  four exact utility multipliers — literal.
- decay retention multipliers (§21): seven exact values by mine type — literal.

DESIGN-35 §31 (Validation and Acceptance) item 5 even states the acceptance test
must prove "shipped base sweeping values are exactly 150, 100, 80, 100, 60, 50,
and 120" — i.e., the design document treats these as fixed ruleset facts, not
tunable balance targets a research pass would refine. There is nothing to ground.

The one place DESIGN-35 *could* have left an open catalog — historical mine
**models** (specific named mines, analogous to `torpedo_models_v1`'s Whitehead/
G7a/Type 93 entries) — it does not ask for. §2 (`MineTypeDefinition`) defines a
**schema** with six canonical *categories* (`CONTACT`, `MAGNETIC`, `ACOUSTIC`,
`CONTROLLED_DEFENSIVE`, `SUBMARINE_LAID`, `SCENARIO_SPECIAL`), not a catalog of
named historical mine designs. Authoring specific historical mine models (e.g. a
Vickers Elia mine, a German UMB contact mine, a US Mk 6 mine) is production
**content**, not engine mechanics, and belongs to the content-pack track
(`content/production/1880/`) — untouched by this engine-scoping sprint.

## 2. Light historical context (not load-bearing; flagged as unverified framing)

The following is offered only as background sanity-checking that the six
canonical `MineTypeDefinition` categories map onto real mine-warfare history —
it did **not** change any shipped constant and is not cited as a source for any
number in the spec.

- **Contact mines** — the oldest and most widespread type (from the American
  Civil War "torpedoes" through both World Wars); detonate on physical contact
  with a ship's hull, historically laid in the tens of thousands (e.g. the WWI
  North Sea Mine Barrage). Maps to DESIGN-35 `CONTACT`.
- **Magnetic mines** — introduced operationally in WWII (notably by Germany from
  1939), detonate on detecting a ship's magnetic signature; prompted degaussing
  countermeasures. Maps to `MAGNETIC`.
- **Acoustic mines** — detonate on detecting engine/propeller noise, also a WWII
  development, prompted acoustic-decoy countermeasures. Maps to `ACOUSTIC`.
- **Controlled (defensive) minefields** — electrically command-detonated from a
  shore station, used to protect harbors/anchorages while allowing friendly
  traffic through known safe channels; historically tied to coastal artillery
  fire-control networks. Maps to `CONTROLLED_DEFENSIVE`.
- **Submarine-laid mines** — purpose-built minelaying submarines (e.g. WWI/WWII
  German UC-boats, US/UK minelaying submarines) laid offensive minefields in
  waters surface minelayers couldn't reach safely. Maps to `SUBMARINE_LAID`
  (data-only this sprint; operational mechanics deferred to C-3).
- **Minesweeping** — historically performed by purpose-built sweepers (fleet and
  coastal classes) and converted trawlers/destroyers towing mechanical sweep
  gear (contact mines) or streaming magnetic/acoustic sweep equipment; dual-role
  ASW/minesweeping equipment on the same hull was a real wartime compromise
  (equipment and deck space competed). This broadly supports DESIGN-35's shipped
  base-value ordering (dedicated fleet sweeper > dedicated coastal sweeper >
  converted trawler > escort-type hulls with add-on gear) without requiring the
  exact numbers to be independently re-derived.

## 3. Deferred / not researched

- Specific historical mine-model content (named designs, production quantities,
  laying campaigns) — content track, out of scope this sprint.
- Historical minesweeping-technology-by-era detail (e.g. Oropesa sweeps,
  double-L sweeps, wartime degaussing programs) — would matter for content
  authoring or for a future tactical/route strike-resolution slice's flavor, not
  for this sprint's shipped mechanics.
- Any numeric grounding for the deferred strike-resolution surface (§11, §14–15,
  §17–18, §25–26) — deferred alongside that surface (see
  `.scratch/c2-m3-mine-warfare/issues/03-strike-resolution-deferral.md`); when
  that C-2 continuation sprint runs, it should re-evaluate whether a grounding
  pass is needed for anything not already exact in DESIGN-35 (e.g. any
  content-level per-mine-type strike severity variance beyond the shipped §15
  weights, if authored).
