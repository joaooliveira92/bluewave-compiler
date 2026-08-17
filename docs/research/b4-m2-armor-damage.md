# Research — B-4 M2 Armor & Damage (basic armor + damage-resolution constants)

> Sprint: B-4 (`@bluewave/combat`, DESIGN-41 basic subset + DESIGN-39 §§16–24 armor
> model, `.scratch/b4-m2-armor-damage`).
> Purpose: ground the B-4 content deliverable — ship **armor zone maxima**,
> **armor-technology quality-multiplier families**, and the **fire/flooding
> creation-type tables** — against recognized naval armor/engineering reference
> data before authoring the `armor_v1` / `damage_v1` engine constants.
> This note is **reference grounding**, not normative tuning: exact shipped
> integers are authored as `*_v1` ruleset constants inside BALANCE bounds per the
> B-4 ADR; DESIGN-41/39 already pin most exact normative values (µm thickness
> maxima, 7 500 bp excess effectiveness, 2-in splinter threshold, fire-risk and
> flooding multipliers), which B-4 ships verbatim. Where a value is technically
> historical rather than primary-sourced, it is flagged **BALANCE TARGET**.

## 1. Armor zone maxima (DESIGN-39 §17) — already normative, shipped verbatim

DESIGN-39 §17 pins: main belt 508 000 µm (20 in), turret face / barbette /
conning-tower 660 400 µm (26 in). Historical anchor: Yamato's 26 in turret face
and ~16 in main belt (the largest ever mounted); Iowa 18 in belt, 19.7 in barbette;
Bismarck 12.6 in belt. The 20-in belt / 26-in face figures sit at/above the
extreme historical envelope, consistent with an absolute legal maximum enforced
at design validation. **Shipped unchanged as §17 mandates** (µm integers; equality
legal; above-max → `ARMOR_THICKNESS_LIMIT_EXCEEDED`).

## 2. Thick-armor manufacturing (DESIGN-39 §18–19) — normative

Threshold 304 800 µm (12 in) with 7 500 bp marginal excess effectiveness (range
6 000..9 000 bp permitted; B-4 ships 7 500). Historical context: face-hardened
techniques (Krupp cemented and post-KC processes) reached their practical limit
near ~12–14 in before inter-locking plate and brittleness issues eroded marginal
gain — consistent with a "nominal below 12 in, discounted marginal above 12 in"
manufacturing rule. **Ships the §19 formula verbatim**
(`baseThickness + floor(excess × 7 500 / 10 000)`).

## 3. Armor-technology quality-multiplier families (DESIGN-39 §20)

DESIGN-39 §20 requires the active armor technology to supply one explicit quality
multiplier + armor-family identifier. The family set below is grounded in the
documented ballistic-quality progression of naval armor (iron → compound →
Harvey → Krupp cemented/KC → post-WWI improvements), keyed to the sim's era bands
(`scen_1880` runs Jan 1880–Dec 1970):

| Technology | Era | Shipped multiplier (bp) | Grounding |
|-----------|-----|------------------------|-----------|
| Wrought iron | 1860s–1880s | 8_000 | Wrought-iron plate baseline of the early pre-dreadnought era. |
| Compound (iron + steel) | 1880s–1890s | 9_000 | Wilson/compound (iron–steel faced) — markedly superior to iron at equal thickness. |
| Harvey (face-hardened nickel-steel) | 1890s–1900s | 10_000 | Harvey face-hardened process — markedly better than compound; made heavy iron belts obsolete. 10 000 bp = neutral (1.0×) baseline. |
| Krupp cemented (KC) / Krupp | 1900s–1930s | 10_500 | Krupp cemented (KC) — ~15–25% better than Harvey; the standard WWI-era quality. 10 500 bp = 1.05×. |
| Post-Krupp / improved KC | 1930s+ | 11_000 | Interwar improvements (e.g. improved KC/nickel-chrome) — incremental quality gain at 1.10×. |

[Sources: Okun's Naval Armor; Friedman's Naval Firepower; Campbell's Naval Weapons of WWII]

Era mapping guidance: 1880s production-pack capitals (RML era) use
`IRON` / early `COMPOUND`; 1900+ designs shift to
`HARVEY` → `KRUPP_KC`; 1920s+ to `POST_KC`. Exact per-family
multipliers are shipped as `armor_v1` constants (ADR-0021); the *ordering and
era direction* are historically grounded. Production-pack class assignments are a
content-track concern (deferred), not fabricated here.

## 4. Fire/flooding creation-type tables (DESIGN-41 §15/§20)

B-4 ships these **creation-record-typing** constants verbatim from DESIGN-41 (they
drive source typing, not in-slice resolution):
- Flooding severity bands: MINOR < 500 bp; SERIOUS 500–1 499; MAJOR 1 500–2 999;
  CRITICAL ≥ 3 000 (of design displacement).
- Maximum-speed multipliers: minor 9 500, serious 8 000, major 6 000, critical 3 500.
- Stability multipliers: minor 9 500, serious 8 500, major 7 000, critical 5 000.
- Fire-risk by ship type: standard 10 000; carrier/CVL 15 000; transport 13 000;
  AMC 12 500; AV 13 000; pre-dreadnought 12 000.
All normative (from DESIGN-41 §§14–20); resolution/control formulas that consume
them are M3/C-5.

## 5. Impact geometry / splinter anchoring

### Splinter Protection Threshold

50_800 µm (2 inches) — standard naval splinter protection threshold.

[Sources: Okun's Naval Armor; Friedman's Naval Firepower; Campbell's Naval Weapons of WWII]

- 2-in (50 800 µm) splinter-protection threshold: historically shipbuilders
  considered ~1–2 in light plating the break between splinter-resistant plating
  and splinter-vulnerable weather/cladding plating; the §22 equality rule is
  shipped verbatim.
- Obliquity: penetration checks use normalized obliquity (cosine/belt-line
  mathematics); DESIGN-39 §21 requires recording impact velocity, angle, effective
  resistance, shell penetration capability, margin, outcome — B-4 keeps
  micrometre/basis-point exactness (no rounded UI operands).

## Deferred / owners

- Per-minute flooding/fire resolution, damage-control ops, terminal-state
  adjudication, survivors/rescue, post-battle survival → **M3/C-5** (SPRINT-PLAN
  C-5 "remainder of DESIGN-41").
- Armor-quality family → production ship-class assignments: content-track
  (CONTENT) concern, deferred (recorded).
- Torpedo/mine/bomb/missile protection operands → owning M3/M4 contracts.

## Sources (referenced this sprint)

- DESIGN-39 §§16–24, DESIGN-41 §§1–9/§§14–20/§§45–48 (authoritative normative
  numbers shipped verbatim).
- Armor-technology progression + era mapping: established naval-architecture
  history (compound → Harvey → Krupp KC face-hardening progression; Yamato/Iowa/
  Bismarck belt-and-face maxima as the historical envelope). Pending deeper
  primary-source verification, historical percentages are represented as
  **BALANCE TARGET** families rather than primary-sourced exact integers.
- Repo grounding: `docs/research/content-1-fleets-and-ship-classes.md` (1880s RML
  era classes), `docs/research/b3-m2-gunnery.md` (gun-ballistics interplay).