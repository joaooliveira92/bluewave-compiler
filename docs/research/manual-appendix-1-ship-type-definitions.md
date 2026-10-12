# Research: Manual Appendix 1 — Ship Type Definitions Used by the Game

Research-only note. No code, content, spec or brief edited. This note is a
**verbatim, page-cited transcript and machine-checkable bound table** for
`docs/manual.pdf` **APPENDIX 1** ("SHIP TYPE DEFINITIONS USED BY THE GAME"),
so a later "Classification fidelity to Appendix 1" decision can be checked
against the manual's own rules in one place.

Ticket: `.scratch/shipbuilding-process/issues/01-manual-ship-type-definitions-reference.md`.

## 0. Source, method, and page numbering

| Tag | Source | Grade |
| --- | ------ | ----- |
| [M] | `docs/manual.pdf` (local file; 148 pages; PDF producer "Adobe InDesign 18.2", creation date 2023-04-18). Identified by the earlier repo note `docs/research/rtw3-official-manual-ship-rules-and-1890s-history.md` as the *Rule the Waves 3* manual. | **Primary (official manual)** |
| [TOC] | The PDF's own bookmark tree: `Appendix 1` → page 131, `Appendix 2:` → page 134. | Primary |
| [P23] | `docs/manual.pdf` p. 23, "DESIGNING SHIPS" (corroborates the illegal-type / AI statements outside Appendix 1). | Primary |

**Page-numbering convention (per the ticket and confirmed here):** the printed
page number equals the 1-based PDF page index. Verified against the printed
folios on the rendered pages: page 131 folio reads `131`, page 132 reads `132`,
page 133 reads `133`, page 134 reads `134`. The PDF bookmark tree agrees
([TOC]). Appendix 1 spans **printed/PDF pages 131–134**; Appendix 2 begins on
p. 134.

Extraction: `python3 -c "import pymupdf; ..."` (`pymupdf 1.28.2`) for text, plus
rendered PNGs at 170 dpi to confirm wording and column order visually. All
quotes below are verbatim from the extracted text; where the renderer produced
letter-spaced words (e.g. "a i r c r a f t") they are normalised back to normal
spacing, and that is noted.

> **Scope:** Appendix 1 defines the player-buildable combat types. Appendix 2
> (p. 134+) defines the *designer data fields* and is out of scope except where
> it fixes a term used by Appendix 1 (see §4, "Displacement", "Main gun
> calibre").

## 1. Verbatim transcript (Appendix 1, pp. 131–134)

### 1.1 Preamble + DD + CL (p. 131)

> **APPENDIX 1 — SHIP TYPE DEFINITIONS USED BY THE GAME**
>
> These are the definitions used by the game for defining ship types. Anything
> falling outside these parameters is considered an illegal ship type. The
> reason these type definitions must be enforced by the program is that the AI
> relies heavily on ship type for decision making. It also prevents players from
> building unrealistic ship designs.
>
> These ship type classifications in the game tend to be somewhat undercut by
> historical developments in the post WW2 era. In the real world, destroyers
> become very large after the 1950s. Ships are sometimes classed as light
> cruisers and sometimes as destroyers, even though they are of similar size.
> And today we have navies that designate ships that are larger than a
> predreadnought battleship as destroyers (no names mentioned). Thus, some ships
> that are classed as destroyers in the real world will be light cruisers in the
> game.
>
> **DESTROYER (DD)**
> Displacement less than 2000 and speed more than 19 knots. A destroyer must
> have torpedoes and cannot be armoured. Destroyer maximum displacement will
> change in game depending on your technological progress. In the late game
> destroyers can be up to 3800 tons.
>
> **LIGHT CRUISER (CL)**
> Displacement larger than 2000 and less than 8000. Speed must be more than 16
> knots and main gun calibre cannot be larger than 6 inches. (Exception:
> Protected cruisers can have guns in single mountings up to 8 inches). The
> maximum displacement of a light cruiser will increase later in the game.
>
> In most of the game light cruisers must have armour, but in the late game with
> research of the missile cruiser technology, you can build light cruisers
> without armour.

### 1.2 B + CA + BC + BB heading (p. 132)

> **PREDREADNOUGHT BATTLESHIP (B)**
> Displacement must be at least 5000 and it must have belt armour at least 6
> inches. Main gun calibre must be larger than 6 inches and speed less than 20
> knots. It cannot have more than 2 main turrets.
>
> **ARMOURED CRUISER (CA)**
> Displacement must be more than 4000 and speed greater than 19 knots. It must
> have more than 2 inches of belt armour but no more than 12 inches. Main guns
> must be at least 6 inches calibre and cannot be more than 11 inches.
>
> In the 1920s, the Armoured Cruiser will morph into the Heavy Cruiser, using
> the same CA designation.
>
> **BATTLECRUISER (BC)**
> Must have main gun calibre larger than 10 inches and speed more than 23 knots,
> or three main gun turrets and speed more than 21 knots. In some borderline
> cases armour thickness can be the difference between a BC and a BB. Note: The
> speed requirement for a ship to be defined as a battlecruiser rises with time,
> as fast battleships develop.
>
> **DREADNOUGHT BATTLESHIP (BB)** *(heading; body continues on p. 133)*

### 1.3 BB text + KE + AMC + CV (p. 133)

> **DREADNOUGHT BATTLESHIP (BB)** *(continued)*
> Must have at least 3 main gun turrets, displacement over 8000 and belt armour
> of more than 6 inches. Main guns must be more than 10 inches.
>
> **CORVETTE (KE)**
> This definition includes all kinds of minor combatants without torpedoes.
> Displacement less than 2500 and belt armour 2 inches or less. Gun calibre can
> be maximum of 6 inches. Cannot have torpedoes.
>
> Corvettes of 500 tons displacement or smaller are assumed to be civilian
> trawlers and similar craft impressed for wartime duties, and can only be built
> during wartime. They can be built quickly if you find that you rapidly need
> ASW or minesweeping craft. They will be automatically sold off after a war,
> like AMCs.
>
> **ARMED MERCHANT CRUISER (AMC)**
> Displacement more than 1700, no armour and gun calibre no more than 6 inches.
> You may build up to two armed merchant cruisers in peacetime. This is to
> simulate auxiliaries, minelayers or civilian ships prepared for rebuilding to
> warships (carriers or seaplane carriers for example). After a war, all AMCs
> will be automatically sold off to civilian shipping companies.
>
> In the game, each nation can build up to two fast AMC with speed up to 25
> knots. These can be used as fast raiders or as candidates for carrier
> conversion. The limit of two is set as the number of suitable liners for
> conversion is assumed to be limited.
>
> **AIRCRAFT CARRIER (CV)**
> A full size aircraft carrier must have an aircraft capacity of more than 34
> aircraft. The maximum displacement of an aircraft carrier will increase over
> the game and depends mainly on your technology in shipboard *(continues on
> p. 134)*

### 1.4 CV text + CVL + AV (p. 134)

> *(CV, continued)* ... aircraft operation. The invention of super-carriers
> (ship design) will substantially increase the maximum size of carriers.
>
> **AIRCRAFT CARRIER, LIGHT (CVL)**
> A light aircraft carrier must *[sic — "must" is followed directly by "an"; the
> word "have" is missing]* an aircraft capacity of at least 4 aircraft and can
> carry no more than 34 aircraft. It can have a maximum displacement of 16 000
> tons (this does not apply to conversions of other ships to CVL).
>
> **SEAPLANE CARRIER (AV)**
> Initially, small seaplane carriers are developed. They can carry three or four
> aircraft and must be less than 5000 tons displacement. When large seaplane
> carriers are developed, a seaplane carrier can be can be *[sic — "can be"
> duplicated]* up to 14 000 tons.
>
> With the development of helicopters, AV type ships can also be built as
> helicopter carriers. An AV equipped with a helipad will carry helicopters
> instead of floatplanes.

*(End of Appendix 1. Appendix 2 begins on the same page, p. 134.)*

## 2. Machine-checkable bound table

Notation: `t` = manual "tons"; `in` = inches; `kn` = knots. `≤ / ≥ / < / >`
are interpreted from the manual's own words: "less/more/greater/larger than"
= strict; "at least" / "cannot be more than" / "…or less" / "maximum of" =
inclusive; "no more than" / "up to" = inclusive. Values not stated = "—".

| Type | Full name | Page | Displacement (t) | Speed (kn) | Belt armour (in) | Other armour | Main gun (in) | Main turrets | Torpedoes | Aircraft | Build / peacetime limits |
| ---- | --------- | ---- | ---------------- | ---------- | ---------------- | ------------ | ------------- | ------------ | --------- | -------- | ------------------------ |
| **DD** | Destroyer | 131 | `< 2000` (tech-scaled max; "late game … up to 3800") | `> 19` | "cannot be armoured" (no numeric threshold) | "cannot be armoured" | — | — | **required** | — | — |
| **CL** | Light Cruiser | 131 | `> 2000` and `< 8000` (max rises later) | `> 16` | must have armour for most of game | must have armour; unarmoured only with late missile-cruiser tech | `≤ 6`; **exception: protected cruisers, single mountings `≤ 8`** | — | — | — | — |
| **B** | Pre-dreadnought Battleship | 132 | `≥ 5000` | `< 20` | `≥ 6` | — | `> 6` | `≤ 2` | — | — | — |
| **CA** | Armoured Cruiser (→ Heavy Cruiser, 1920s, same CA tag) | 132 | `> 4000` | `> 19` | `> 2` and `≤ 12` | — | `≥ 6` and `≤ 11` | — | — | — | — |
| **BC** | Battlecruiser | 132 | — | branch A `> 23`; branch B `> 21` (rises with time) | borderline cases: armour thickness can separate BC vs BB | — | branch A `> 10` | branch B: "three main gun turrets" | — | — | — |
| **BB** | Dreadnought Battleship | 132–133 | `> 8000` | — | `> 6` | — | `> 10` | `≥ 3` | — | — | — |
| **KE** | Corvette | 133 | `< 2500` (`≤ 500` = impressed civilian trawler, wartime-only) | — | `≤ 2` | — | `≤ 6` | — | **forbidden** | — | `≤ 500 t`: wartime-only, can be built quickly; auto-sold after war |
| **AMC** | Armed Merchant Cruiser | 133 | `> 1700` | fast AMC: `≤ 25` | none ("no armour") | none | `≤ 6` | — | — | — | up to **2** in peacetime; up to 2 fast AMC; auto-sold after war |
| **CV** | Aircraft Carrier | 133–134 | not stated; max rises over game (super-carriers raise it further) | — | — | — | — | — | — | **`> 34`** | — |
| **CVL** | Aircraft Carrier, Light | 134 | `≤ 16 000` (does **not** apply to conversions of other ships to CVL) | — | — | — | — | — | — | `≥ 4` and `≤ 34` | — |
| **AV** | Seaplane Carrier | 134 | small: `< 5000`; large: `≤ 14 000` | — | — | — | — | — | — | small: three or four; large: not stated | — |

Boundary consequences worth noting (derived, not manual statements):

- 2000 t exactly is in **neither** DD (`< 2000`) nor CL (`> 2000`).
- 34 aircraft exactly is CVL (`≤ 34`); CV needs `> 34`.
- CA and CL predicates **overlap** in 4000–8000 t at >19 kn: the manual gives no
  priority rule. (The repo resolves 6-in guns as CL; see §5.)
- `B` (`≤ 2` turrets, `< 20` kn, `≥ 5000` t) and `BB` (`≥ 3` turrets, `> 8000` t)
  are disjoint on turret count, so turret count is the hard discriminator.

## 3. Cross-cutting manual statements

1. **Illegal types (p. 131):** "Anything falling outside these parameters is
   considered an illegal ship type." Corroborated at **[P23]** (p. 23): ships
   "have to keep within the parameters of the ship type or be reclassified as
   another type… Very unusual designs will be disallowed by the program as
   illegal ship types."
2. **AI relies on ship type (p. 131):** "The reason these type definitions must
   be enforced by the program is that the AI relies heavily on ship type for
   decision making." Corroborated at **[P23]**: "the ship types are used as the
   basis for decisions by the tactical AI. A 30 000 ton destroyer with 15 in
   guns would not only be unrealistic, it would confuse the AI."
3. **Purpose (p. 131):** "It also prevents players from building unrealistic
   ship designs."
4. **Reclassification / morph notes:**
   - **CA → Heavy Cruiser (p. 132):** "In the 1920s, the Armoured Cruiser will
     morph into the Heavy Cruiser, using the same CA designation."
   - **BC speed requirement rises (p. 132):** "Note: The speed requirement for a
     ship to be defined as a battlecruiser rises with time, as fast battleships
     develop."
   - **BC vs BB borderline (p. 132):** "In some borderline cases armour thickness
     can be the difference between a BC and a BB."
5. **Protected-cruiser single-mounting exception (p. 131):** "(Exception:
   Protected cruisers can have guns in single mountings up to 8 inches)."
6. **Maxima that change with technological / era progress** (exact manual
   phrases):
   - DD max displacement — "will change in game depending on your technological
     progress. In the late game destroyers can be up to 3800 tons." (p. 131)
   - CL max displacement — "The maximum displacement of a light cruiser will
     increase later in the game." (p. 131)
   - CL armour exemption — "in the late game with research of the missile
     cruiser technology, you can build light cruisers without armour." (p. 131)
   - BC speed requirement — "rises with time" (p. 132)
   - CV max displacement — "will increase over the game and depends mainly on
     your technology in shipboard aircraft operation. The invention of
     super-carriers (ship design) will substantially increase the maximum size
     of carriers." (pp. 133–134)
   - AV large seaplane carrier — up to 14 000 t "When large seaplane carriers are
     developed" (p. 134)
7. **Post-WW2 caveat (p. 131):** classification is "somewhat undercut by
   historical developments in the post WW2 era"; real-world destroyers/light
   cruisers diverge from the game's classes.
8. **Build/peacetime limits:** no months-per-ton or build-time figure appears in
   Appendix 1. The only limits stated are KE ≤ 500 t (wartime-only, "built
   quickly") and AMC (≤ 2 peacetime; ≤ 2 fast AMC; auto-sold after war).
   Build-time rules live elsewhere in the manual (p. 31, not in scope here).

## 4. Term definitions used by the bounds (Appendix 2, p. 135)

These fix what the Appendix 1 fields mean and are needed to make the bounds
machine-checkable:

- **Displacement:** "Standard displacement of the ship in tons." (p. 135)
- **Main gun calibre:** "Rounded to inches." (p. 135)
- **Belt:** "Belt armor in inches." (p. 135)

So every "tons" bound in Appendix 1 is **standard displacement**, and gun
calibre bounds compare **integer (rounded) inches**.

## 5. Ambiguities — wording that can be read more than one way

1. **CVL typo (p. 134):** "A light aircraft carrier must [have] an aircraft
   capacity of at least 4 aircraft…" — the verb is missing; the predicate is
   clear (`≥ 4`) but the sentence is literally ungrammatical.
2. **AV typo (p. 134):** "a seaplane carrier can be can be up to 14 000 tons" —
   duplicated "can be"; semantics unaffected.
3. **BC "three main gun turrets" (p. 132):** literally *exactly* three, whereas
   BB uses "at least 3 main gun turrets" (p. 133). A 4-turret, 22-kn ship would
   satisfy the BB turret count but not literally BC's "three"; the manual gives
   no explicit rule. **Read as `≥ 3` unless the orchestrator rules otherwise.**
4. **DD "cannot be armoured" (p. 131):** no numeric armour threshold is given in
   Appendix 1. Any threshold (the repo's 2 in) is an inference, not a manual
   bound.
5. **CA lower gun bound (p. 132):** "Main guns must be at least 6 inches"
   (inclusive) overlaps CL's "cannot be larger than 6 inches" (`≤ 6`). A 6-in
   ship is permitted by both type texts; the manual gives no tie-break.
6. **CL "Displacement larger than 2000" vs DD "less than 2000" (p. 131):** a
   2000-t ship satisfies neither; and CL/CA overlap in 4000–8000 t. No priority
   rule in Appendix 1.
7. **"Technological progress" / "rises with time"** quantities are all
   **unscheduled** — the manual names *that* DD/CL/CV maxima and the BC speed
   bar change, but gives **no** numeric schedule or per-year table. Any numeric
   progression is a BALANCE TARGET for Bluewave, not a manual value.
8. **CV has no displacement bound** (p. 133–134): CV is defined only by
   `aircraft > 34`; CVL is capped at 16 000 t except conversions. CVL's cap
   creates a possible size overlap with CA/BB, unaddressed by the manual.
9. **Thousands-separator typography:** "16 000" and "14 000" are written with a
   space; "3800", "2000", "8000" without. This is typographic only; values are
   16000 and 14000 t.
10. **"Main turrets" vs "main gun turrets"** are used interchangeably (B/BB vs
    BC); treat as the same field.
11. **Which speed** (design/maximum) is unstated in Appendix 1; Appendix 2
    (p. 135) says the designer's **Speed** field is "the maximum designed speed
    of the ship", so bounds apply to max designed speed.

## 6. Cross-reference and discrepancy with the earlier repo note

`docs/research/rtw3-official-manual-ship-rules-and-1890s-history.md` states
Appendix 1 is "p. 133-135" and places CA on p. 134, DD/CL on p. 133, etc. In the
**current `docs/manual.pdf`** those citations are consistently **+2** relative to
this file: Appendix 1 starts at printed/PDF **131** (confirmed by the printed
folio and the PDF bookmark tree), and its items are DD/CL p. 131, B/CA/BC p. 132,
BB/KE/AMC/CV p. 133, CVL/AV p. 134. That earlier note also says all its content
is **paraphrased**; this note is **verbatim**. Implementations must not mix the
two citation sets. (The +2 offset likely reflects a different PDF render/edition;
the descriptor "RTW3 manual" is inferred from the earlier note, not proven from
this PDF's metadata.)

## 7. Recommendations to the implementator

- Use §2 as the single source for **strict vs inclusive** classification
  predicates; the strict/inclusive distinction is load-bearing at 2000 t
  (DD/CL), 6 in (CL/CA), and 34 aircraft (CVL/CV).
- Use **standard displacement in tons** and **integer (rounded) inches** (§4).
- Treat every "changes with tech / rises with time" quantity (DD max, CL max,
  CL-unarmoured, BC speed bar, CV max, AV large) as a **BALANCE TARGET**
  (non-normative) unless the spec supplies a ruleset constant; the manual gives
  no schedule.
- The **DD armour threshold** and **BC "three turrets" exact/at-least** reading
  are the two predicates the manual does not fully specify; see §5.3–5.4.

## 8. Deferred / open

- Numeric progressions for the tech-scaled maxima (§3.6, §5.7) need an owner
  (spec/ruleset constant) — not derivable from Appendix 1.
- The earlier note's page offsets (§6) may indicate a second manual edition;
  out of scope here.
- Appendix 2+ fields (full armour layout, fire control, machinery) are outside
  this ticket.
