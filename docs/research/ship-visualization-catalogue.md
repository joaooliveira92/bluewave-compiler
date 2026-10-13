# Research: Ship Visualization Catalogue — Appendix 1 / 3 / 5 Grounding

Research-only note. No code, content, spec, brief, or other file edited. This note
is the sourced catalogue behind the "better ship visualization" milestone: it
transcribes the ship-type bounds, era/scenario model, and the manual's visual-part
model (side-view element sets and turret-file naming), maps them to the repo, and
lists what the app does not yet model.

**Primary source:** `docs/manual.pdf` (local file; 148 pages; PDF creator
`Adobe InDesign 18.2 (Macintosh)`, creation date `2023-04-18`). The earlier repo note
`docs/research/manual-appendix-1-ship-type-definitions.md` identifies it as the
*Rule the Waves 3* (RTW3) official manual; that identification is **inferred**, not
proven by this PDF's metadata (which carries no title/author). Everything below cites
that file by **printed page number** unless another source is named.

**Page-numbering convention.** For this file the printed folio equals the 1-based PDF
page index (confirmed here by extracting each page and reading its folio; also confirmed
for Appendix 1 by the companion note above and by the PDF bookmark tree). All "p."
citations below are printed/PDF pages.

**Method.** Text extracted with PyMuPDF (`pymupdf 1.28.2`,
`python3 -c "import pymupdf; ..."`). Quotes are verbatim; where the extractor
letter-spaced a word (e.g. "a i r c r a f t" on p. 133) spacing is normalised and noted.

---

## 1. Question

Ground, in the manual's own words, the data the "better ship visualization" milestone
needs:

1. every ship type's classification bounds and how each bound scales with era/tech;
2. the era/scenario model and the campaign-start options;
3. the manual's visual-part model (Appendix 3 side-view elements; Appendix 5 turret
   files);
4. a manual-nation → repo-nation mapping;
5. any manual statement of historical ship-type ownership per nation per era;
6. the visual parts the manual implies that the app does not yet model.

---

## 2. Sources

| Tag | Source | Verified? |
| --- | ------ | --------- |
| **[M]** | `docs/manual.pdf` — Appendix 1 pp. 131–134; Appendix 2 pp. 134–135; Appendix 3 pp. 136–137; Appendix 4 p. 138; Appendix 5 pp. 138–142; Introduction p. 7; Options p. 19; Starting fleet p. 21; tactical type-prefix list p. 78; carrier construction pp. 109–111; aircraft on ships pp. 108–109; national characteristics pp. 59–60 | **Directly extracted** |
| **[N]** | `packages/content-schema/src/nation.ts` — `NATION_IDS` (24 canonical ids), lines 8–33 | Read directly |
| **[B]** | `.scratch/shippbuilding-ui.md` — the milestone brief ("better ship visualization": views, selectable turrets/masts/torpedoes/aviation, overlays) | Read directly |
| **[S]** | `.scratch/shipbuilding-ui/issues/04-central-ship-workspace-views-overlays-selection.md` — the views/overlays/selection contract already implemented | Read directly |
| **[C]** | `docs/research/content-0-scenario-era-bands.md` — repo canonical scenarios (`scen_1880/1900/1920/1935/1960`) and era bands | Read directly |
| **[A]** | `docs/research/manual-appendix-1-ship-type-definitions.md` — companion verbatim transcript of Appendix 1 | Read directly |
| **App** | `apps/desktop/src/renderer/components/design-workspace/panels/hull-plan/*` and `packages/ship-design/src/*`, `packages/content-schema/src/ship-component.ts`, `packages/content-schema/src/design.ts` — the current app model (for §8 only) | Read directly |

The manual is the **primary** source for all bounds, quotes, and visual-part rules. The
repo files are primary sources for the repo's own model. Nothing here is a secondary
write-up.

> **Correction to the brief.** The task asked for the campaign-start options on "p614".
> **This PDF has only 148 pages**, so p. 614 does not exist. The campaign-start options
> are on **p. 21** ("Your starting fleet": "There are options to start the game in 1890,
> 1900, 1920, or 1935"). See §4.

---

## 3. Ship types by era/scenario (Appendix 1, pp. 131–134)

### 3.1 The manual's own framing

> "These are the definitions used by the game for defining ship types. Anything falling
> outside these parameters is considered an illegal ship type. The reason these type
> definitions must be enforced by the program is that the AI relies heavily on ship type
> for decision making. It also prevents players from building unrealistic ship designs."
> — **p. 131**

> "These ship type classifications in the game tend to be somewhat undercut by historical
> developments in the post WW2 era." — **p. 131** (with the caveat that some real-world
> "destroyers" are light cruisers in the game).

Notation for §3.2: `t` = standard displacement in tons (Appendix 2, p. 135: "Displacement:
Standard displacement of the ship in tons."); `in` = inches; `kn` = knots; `≤ / ≥ / < / >`
are read from the manual's own wording (strict for "less/more/larger/greater than";
inclusive for "at least", "no more than", "maximum of", "up to", "cannot be more than").
"—" = not stated. This table restates the machine-checkable table in **[A]** §2 for the
types the milestone needs, adding nothing not on pp. 131–134.

### 3.2 Bound table (all facts from pp. 131–134)

| Type | Full name | Page | Displacement (t) | Speed (kn) | Belt (in) | Main gun (in) | Main turrets | Torpedoes | Aircraft | Notes |
| ---- | --------- | ---- | ---------------- | ---------- | --------- | ------------- | ------------ | --------- | -------- | ----- |
| **DD** | Destroyer | 131 | `< 2000`; **tech-scaled max** ("late game … up to 3800") | `> 19` | "cannot be armoured" (no number) | — | — | **required** | — | "must have torpedoes and cannot be armoured" |
| **CL** | Light Cruiser | 131 | `> 2000` and `< 8000`; **max rises later** | `> 16` | must have armour (most of game) | `≤ 6`; exception: protected cruisers in **single mountings `≤ 8`** | — | — | — | may drop armour with late "missile cruiser" tech |
| **B** | Pre-dreadnought Battleship | 132 | `≥ 5000` | `< 20` | `≥ 6` | `> 6` | `≤ 2` | — | — | — |
| **CA** | Armoured Cruiser → **Heavy Cruiser in the 1920s, same CA tag** | 132 | `> 4000` | `> 19` | `> 2` and `≤ 12` | `≥ 6` and `≤ 11` | — | — | — | morph statement on p. 132 |
| **BC** | Battlecruiser | 132 | — | branch A `> 23`; branch B `> 21` (**rises with time**) | borderline cases: armour can separate BC/BB | branch A `> 10` | branch B: "three main gun turrets" | — | — | speed bar rises as fast battleships develop |
| **BB** | Dreadnought Battleship | 132–133 | `> 8000` | — | `> 6` | `> 10` | `≥ 3` | — | — | heading p. 132, body p. 133 |
| **KE** | Corvette | 133 | `< 2500` (`≤ 500` = impressed civilian trawler, wartime-only) | — | `≤ 2` | `≤ 6` | — | **forbidden** | — | `≤ 500 t`: wartime-only, "built quickly", auto-sold after war |
| **AMC** | Armed Merchant Cruiser | 133 | `> 1700` | fast AMC `≤ 25` | none ("no armour") | `≤ 6` | — | — | — | ≤ 2 peacetime, ≤ 2 fast AMC, auto-sold after war |
| **CV** | Aircraft Carrier | 133–134 | **no bound**; max rises over the game (super-carriers raise it further) | — | — | — | — | — | `> 34` | carrier max tied to "shipboard aircraft operation" tech |
| **CVL** | Aircraft Carrier, Light | 134 | `≤ 16 000` (does **not** apply to conversions to CVL) | — | — | — | — | — | `≥ 4` and `≤ 34` | CVL typo: "must [have] an aircraft capacity of at least 4" |
| **AV** | Seaplane Carrier | 134 | small `< 5000`; large `≤ 14 000` | — | — | — | — | — | small: three or four; large: not stated | helicopter carriers with a helipad use helicopters instead of floatplanes |

### 3.3 How the bounds scale with technology / era — verbatim (the maxima-rise quotes)

- **DD (p. 131):** "Destroyer maximum displacement will change in game depending on your
  technological progress. **In the late game destroyers can be up to 3800 tons.**"
- **CL (p. 131):** "The **maximum displacement of a light cruiser will increase later in
  the game.**" and "In most of the game light cruisers must have armour, but in the late
  game with research of the **missile cruiser technology**, you can build light cruisers
  without armour."
- **BC (p. 132):** "Note: The **speed requirement for a ship to be defined as a
  battlecruiser rises with time**, as fast battleships develop."
- **CA (p. 132):** "In the **1920s, the Armoured Cruiser will morph into the Heavy
  Cruiser**, using the same CA designation."
- **CV (pp. 133–134):** "The **maximum displacement of an aircraft carrier will increase
  over the game** and depends mainly on your technology in shipboard aircraft operation.
  The **invention of super-carriers (ship design) will substantially increase the maximum
  size of carriers.**"
- **CVL (p. 134):** cap "16 000 tons (this does not apply to conversions of other ships to
  CVL)."
- **AV (p. 134):** small seaplane carriers `< 5000 t`; "**When large seaplane carriers are
  developed**, a seaplane carrier can be … up to **14 000 tons**."

Additional carrier tech-scaling figures stated outside Appendix 1 (relevant to the same
milestone), all [M]:

| Figure | Value | Page |
| ------ | ----- | ---- |
| CVL aircraft cap | "CVLs are limited to no more than a capacity of **34** planes. There is no limit on CV capacity." | 110 |
| Very large carriers | "Carriers with aircraft capacity larger than **100** aircraft will have reduced aircraft operations efficiency as well as slightly increased cost." | 110 |
| Jet-capable carrier threshold | "A ship must have a displacement of **40,000 tons** or more, or have a displacement of **30,000 tons** and steam catapults developed, to be made jet capable." | 111 |
| Small-carrier catapult rule | "Carriers below **10 000 tons** must have catapults to launch aircraft with max speed above 120 knots at more than light load." | 110 |
| Carrier-build tech ladder | convert to **CVL** after "level 3 'Flight Deck'"; then purpose-built CVLs; then convert to **CV**; then purpose-built CVs; "The displacement limit for a purpose built aircraft carrier will be determined by the level of the 'Shipboard aircraft operation' tech." | 109–110 |

**Uncertainty / gaps in the scaling.** The manual names *that* the DD max, CL max, CL
armour exemption, BC speed bar, CV max and AV large size change with time/tech, but gives
**no numeric schedule** (no per-year or per-tech-level table). Any numeric progression is
therefore a **BALANCE TARGET**, not a manual value. This is also stated in **[A]** §5.7.

---

## 4. Era / scenario model

### 4.1 Campaign-start options (p. 21)

> "There are options to start the game in **1890, 1900, 1920, or 1935**. When the game
> starts, you will have an existing legacy fleet at game start. The legacy fleet is
> generated automatically in the **1890, 1920 and 1935** starts, but can optionally be
> built manually in the **1900** start." — **p. 21**

Related statements:

- Historical-budget option is tied to the 1900 start: "If you want to play with more
  historical budgets, there is an option for that in the **1900 campaign start**." — **p. 19**
- The Suez Canal "is operational at the start of the scenarios"; the Panama Canal becomes
  operational in 1914 and is controlled by the owner in the "**1900, 1920 and 1935**
  scenarios." — **p. 15** (this lists only three of the four starts explicitly).
- Tech-variation options (none / some / considerable) — **pp. 19–20**; they change *when*
  technologies appear, not the start dates.

### 4.2 Overall covered span (p. 7)

> "Rule the Waves III extends the time of the simulation from **1890 to 1970**." — **p. 7**

### 4.3 Tying ship types / tech to the starts

The manual does **not** give a per-start ship-type table. What it ties to a start is the
**legacy fleet** (auto-generated, or player-built in 1900) — p. 21. Carrier/aviation
progression is tied to the **"Shipboard aircraft operation" tech level**, not to a start
year — pp. 109–110. The type bounds are tied to *technology progress* generically (p. 131).

### 4.4 Divergence from the repo's canonical scenarios — flag

The repo's five canonical scenarios are `scen_1880`, `scen_1900`, `scen_1920`,
`scen_1935`, `scen_1960`, each starting in January of its year, with simulation end at
completion of **December 1970** and five era bands (`EARLY` 1880–1899, `PRE_WAR`
1900–1919, `INTERWAR` 1920–1939, `MID_CENTURY` 1940–1959, `LATE` 1960–1970) — **[C]**.

So the manual's start set (`1890/1900/1920/1935`) does **not** match the repo's start set
(which adds **1880** and **1960** and drops **1890**). This is a **content-mapping
decision** the spec/orchestrator must own; it is not a manual statement. In particular,
the manual's Victorian turret era (§5.2: "early to mid 1890s") begins *after* the repo's
`scen_1880` start, so the repo's EARLY band is wider than the manual's Victorian era.

---

## 5. The manual's visual-part model

### 5.1 Appendix 3 — ship side views (pp. 136–137)

**Picture format and location (p. 136):**

- Designated pictures go in the save directory (`Save1`, `Save2`, …) under `RTW\Save`.
- "Pictures for ships should be **640 x 160 pixels** and in **jpg or bmp** format."
- A picture can be changed per class via the ship-list popup ("change picture").

**The ship picture generator (p. 136):**

- Optional; "a way of generating nice side views of your ships."
- "Select the **set of ship elements** you want to use. Originally there will be only one
  set, but graphically gifted players may make their own and add for example lighter or
  darker versions or even **camouflaged sets**."
- Step 1: choose **background**, then **bow and stern type**, press "Generate" to generate
  the hull; regeneration is unlimited **until** detail placement begins — "you should not
  redo the hull generation once you have started placing details."
- Step 2: a second tab to place superstructure and details.
- **Placement order (p. 136, verbatim):** "Ship elements should be placed in the order
  from left to right, that is start with **masts, then decks, then superstructure and last
  accessories**."
- Fine-tuning: after moving an element to roughly the right area but **before** clicking,
  arrow keys move it one pixel at a time; Enter finishes.

**Layering / depth rules (p. 137):**

- "**Masts, decks and superstructure will be shown behind hull and turrets.** That means
  that you can regulate the height of masts or superstructure by sinking them into the
  hull."
- "**Accessories will be shown in front of everything else.**"
- "Use the **deck panels under accessories** to connect raised decks to barbettes, to make
  them show in front of the barbettes."
- Finishing: "select use and exit and your picture will automatically be assigned to the
  selected ship class"; verify by double-clicking the ship in the ship list.

**Output format / naming (p. 137):**

- "The output is a **bitmap** that will be stored under the save directory of the current
  game. It will be named **Classname + NationNumber + .bmp**."
- **Uncertainty:** the manual never defines what `NationNumber` is (no mapping table in
  the PDF). The name is **not** the single-letter nationality identifier used by turret
  files (§5.2). Treat the numeric nation index as **undefined by the manual** (inference:
  a per-nation integer), and note the two naming schemes are unrelated.

**Element categories the generator exposes (implied by pp. 136–137):** element *sets*
(one default; player-made/camouflaged sets), **background**, **bow** and **stern** types,
**masts**, **decks**, **superstructure**, **accessories**, and **deck panels**. The manual
does not enumerate the individual sprites within each category.

### 5.2 Appendix 5 — creating turret files (pp. 138–142)

**What a turret file is (p. 139):** "drawings … used by the game to represent the wide
variety of guns and gun mounts used by the game's nations over different time periods."
Files live in `RTW3/Data/Graphics` with extension `*.tus` (p. 139; restated p. 141). A
turret file in the local Graphics directory is used automatically (p. 139).

**Filename format (p. 139), example `XDHT2.tus`:**

| Position | Meaning | Values |
| -------- | ------- | ------ |
| 1 | **Nationality** | one of the letters in the table below; `X` = universal default |
| 2 | **Era** | `V/P/D/L` (table below) |
| 3 | **Size** | `S/M/L` per p. 141 — *but see the inconsistency note below* |
| 4 | **Turret type** | `T` = turreted (p. 139); `S` = shielded (inferred — p. 139 only spells out `T`) |
| last | **Number of guns** | `1`–`4` (p. 141) |

The manual's worked example: "This file represents a **heavy 2-gun dreadnought era turret**
that can be used universally." (p. 139)

> **Manual inconsistency (flag for the implementator).** The example `XDHT2.tus` explains
> position 3 as "`H` … stands for a heavy gun" (p. 139), but the **SIZE** section gives the
> size codes as `S` = small, `M` = medium, `L` = large (p. 141) — there is no `H`. The four
> special-case filenames in §5.2.4 also use `H`. So the example filenames on pp. 139/141/142
> use a *different* third character than the documented size codes. Do not copy `H` as a
> size code; use `S/M/L`, and treat the example names as legacy/illustrative.

#### 5.2.1 National identifiers (p. 140) — 10 nations + universal

> "List of national identifiers:
> A = Austro-Hungarians
> B = British
> F = French
> G = German
> I = Italian
> J = Japanese
> Q = Chinese
> R = Russian
> S = Spanish
> U = American
> X = Universal (default) These turrets will be used if no national version is available."

That is **10 national styles + `X` universal = 11 identifiers total**. The task's
"A/B/F/G/I/J/Q/R/S/U/X" list is exactly this set.

- "This identifier is used to create gun mounts that have a distinct **national visual
  look**… When its nationality is selected in the 'Ship design/Graphics Tab/ Turret nation
  style' drop down list, a turret of the appropriate nationality will be used… If there is
  no turret file with the selected nationality, then a **universal mount (X identifier)
  will be used instead**." — p. 139
- "there is **no restriction** on using a particular national turret type — you may use any
  nation's mounts on your ship design." — p. 139 (visual only; no gameplay effect).

#### 5.2.2 Era identifiers (p. 140) — 4 eras

> "There are 4 era identifiers. Gun mounts have been modeled for the Victorian era, the
> pre-dreadnought era, the dreadnought era and the late dreadnought era."
>
> - **V = Victorian era.** "These represent ships from the **early to mid 1890s**."
> - **P = Pre-dreadnought era.** "These represent guns **up to about 1905**."
> - **D = Dreadnought era.** "These represent guns used from the **early 1900s through
>   about the 1930s**."
> - **L = Late dreadnought era.** "These represent guns from the **late WW2 period through
>   the end of the game**." — **p. 140**

- Era "only affects the visual appearance of the mount; it has no impact on in-game
  functionality." — p. 140
- "The **dreadnought era is the default era**; if no mount file is available for a
  particular era, the **dreadnought era version will be used**." — p. 140
- Signposted in the designer under "Ship design/Guns tab/Turret era" — p. 140.

> **Overlap note (inference, not a manual statement):** the era ranges as written overlap
> (V "early–mid 1890s" vs D "early 1900s–1930s"; P "up to about 1905" vs D "from the early
> 1900s"). The manual gives no tie-break; selection is a player choice (p. 140).

#### 5.2.3 Size bands (p. 141)

> "There are 3 turret sizes.
> **S = Small guns up to 5".**
> **M = Medium guns from 6" to 11".**
> **L = Large guns 12" and above.**" — **p. 141**

#### 5.2.4 Turret type, gun count, special cases (p. 141)

- **Turret type:** "Gun mounts should be drawn in two variations: **shielded or turreted**.
  The game decides when it will use the shielded or turreted version of a gun drawing based
  on the size of the mount and the amount of armour applied to the turrets in the ship
  design. There is no specific version of an unshielded gun, though you can certainly draw
  one…" — p. 141. (The letter for shielded is not spelled out; `S` is inferred from the
  special-case names below and the `T` = turreted statement on p. 139.)
- **Number of guns:** "The last digits in the turret file name indicates the number of guns
  in the mount, **1 through 4**. As with most other parameters, if the game is told to load a
  mount with 3 guns and there is no version available the game will default to using the
  **universal dreadnought version** of a 3-gun mount." — p. 141
- **The 4 special-case turret files (p. 141, verbatim):**
  - `XVHS3` — "an open top single barbette gun"
  - `XVHT3` — "an open top double barbette gun"
  - `XVHT4` — "an unshielded single gun"
  - `XVHS4` — "used for casemate guns"

#### 5.2.5 Superstructure layers 5 & 6, 12"-reference auto-resizing, sponsons (p. 142)

- **Superstructure layers:** "When creating turret files, you can use **two layers**. The
  game will use any drawings found in **layers 5 and 6** for the turret." — p. 142
- **Colour restriction:** "The color of the drawing may be changed while making the turret,
  but it will always be saved with a **neutral gray color**. The color is restricted
  because **the game itself colors turrets to indicate damage or destruction** of the
  turret." — p. 142 (this is the manual's only explicit **damage-state** visual rule).
- **12"-reference auto-resizing:** "The game has a function that **automatically resizes
  each gun based on the caliber** of the gun. When drawing guns, you should **draw the gun
  to match the size of a 12" gun**… More specifically, you should probably match the overall
  length of the gun you are drawing to the length of a 12" gun from the same era… My default
  gun for this purpose is `XDHT2.tus`." — p. 142
- **Sponsons:** "Any gun mount may be assigned to use a **'sponson'** when it is placed on a
  ship design. For this reason, **you do not need to draw a sponson or barbette** for your
  gun mount as these can be added during the ship design process. Visually, a sponson is
  simply **a ring drawn under the gun mount** … they can also be used to visually imply the
  mount's barbette… You can add a sponson during the design process by using a gun mount's
  right-click menu for a main gun or by simply setting a sponson radius for secondary and
  tertiary guns. You can set the width of the sponson by using the **'Sponson radius'**
  setting on the Guns tab of the ship designer." — p. 142

#### 5.2.6 Related ship-design graphics hotkeys (p. 138)

For completeness (the milestone's editor): "**S**: snap angle (45° degree); **D**: delete
last point; **CTRL**: hold to show alignment lines; **ALT**: force placement on ship
centreline." — p. 138. Also "Cross deck fire" for wing turrets in positions **F, G, K, J**
(like the historical Indefatigable or Kaiser classes) — p. 135.

---

## 6. Nation → repo mapping

The repo's canonical list is the 24 `NATION_IDS` in `packages/content-schema/src/nation.ts`
lines 8–33 — **[N]**. The manual's **10** national turret styles are on p. 140 — **[M]**.
Mapping (the manual's own letters and names verbatim; the repo id chosen by name match):

| Manual id | Manual nation (p. 140) | Repo `NATION_IDS` | Distinct manual style? |
| --------- | ---------------------- | ----------------- | ---------------------- |
| **A** | Austro-Hungarians | `austria_hungary` | **Yes** |
| **B** | British | `uk` | **Yes** |
| **F** | French | `france` | **Yes** |
| **G** | German | `germany` | **Yes** |
| **I** | Italian | `italy` | **Yes** |
| **J** | Japanese | `japan` | **Yes** |
| **Q** | Chinese | `qing` | **Yes** |
| **R** | Russian | `russia` | **Yes** |
| **S** | Spanish | `spain` | **Yes** |
| **U** | American | `usa` | **Yes** |
| **X** | Universal (default) | (fallback for all remaining) | fallback |

**Repo nations with a distinct manual national style (10):** `uk`, `germany`, `usa`,
`japan`, `france`, `italy`, `russia`, `austria_hungary`, `spain`, `qing`.

**Repo nations that would fall back to universal `X` (14):** `ottoman_empire`, `egypt`,
`netherlands`, `belgium`, `denmark`, `sweden_norway`, `portugal`, `greece`, `brazil`,
`chile`, `argentina`, `korea`, `persia`, `siam`.

**Caveats (inference):** the manual lists only 10 nations; the repo has 24, so 14 must use
`X`. `Q = Chinese` → `qing` is a name/era match, not an explicit manual→repo statement (the
manual predates no repo data). The manual gives no distinct style for e.g. the Ottoman
Empire, Netherlands, or the South American navies, so a "national style" for them is **not
manual-sanctioned** and would be invented content.

---

## 7. Historical ship-type ownership per nation per era

**The manual does not state this.** A full-text search of `docs/manual.pdf` for
nation-name + ship-type co-occurrence found **no substantive statement** (the only hit is
a bibliography line for *Japanese Destroyer Captain*, p. 147). Specifically:

- Appendix 1 (pp. 131–134) defines types with **no nation attribution**.
- Appendix 5 (pp. 139–142) gives **national turret *styles*** (§5.2.1) but says nothing
  about which nation operated which *ship type* in which era.
- The "NATIONAL CHARACTERISTICS" section (pp. 59–60) lists non-type traits (efficient/
  undeveloped shipbuilding, global naval power, cautious, poor education, surprise attack,
  inconsistent naval policy, attention to detail, technology leader, hidden faults,
  kamikaze) — **none** is a ship-type ownership claim.

Therefore **any per-nation-per-era ship-type ownership matrix must be marked as
fabricated/unsourced** if the app presents one. The manual is silent; do not backfill from
RTW3 content that is not in this PDF. (The repo's per-nation naval-profile research notes
exist, but they are separate from this manual and out of scope for a manual-grounded
catalogue.)

---

## 8. Gaps — visual parts the manual implies that the app does not yet model

The current app model (read directly):

- **Design workspace `hull-plan`** (`apps/desktop/src/renderer/components/design-workspace/panels/hull-plan/`):
  side profile with hull silhouette/deck-edge, stepped **superstructure + bridge** and
  **funnels** (`profile-structures.ts`, `profile-layers.tsx`), plus **fittings** as circle
  markers and **gun arcs** (`fitting-layers.tsx`), and overlays for **armour zones,
  compartments, machinery, centre of mass** (`ship-view-layers.tsx`). Plans/hull
  `bowStyleFor`/`sternStyleFor` pick ram/spoon/plumb and counter/transom/round by hull-form
  id (`hull-character.ts`). The view/overlay vocabulary is `ship-view.ts`
  (`SHIP_VIEWS` = top/side/armour/compartments/arcs; `SHIP_OVERLAYS` = armour/arcs/
  footprint/mass/topside/machinery/conflicts) — the contract in **[S]**.
- **Component taxonomy** (`packages/content-schema/src/ship-component.ts`,
  `design.ts`): simulation categories include `MAIN_GUN`, `SECONDARY_GUN`, `MOUNT`,
  `TORPEDO_TUBE`, `AIRCRAFT_FACILITY`, `RADAR`, `DIRECTOR`, `RANGEFINDER`, etc., and
  `DesignTemplateSchema.torpedoArmament` carries torpedo mounts. These are **simulation**
  fields.

Gaps against the manual's visual model:

| Manual visual part (page) | Manual rule | App today | Gap |
| ------------------------- | ----------- | --------- | --- |
| **Turret/mount national style** (pp. 139–140) | 10 national + universal styles; drop-down "Turret nation style" | Fittings are undifferentiated circle markers + arcs; no per-nation sprite | **Not modelled**: nation-specific mount rendering |
| **Turret era style** (pp. 139–140) | 4 eras (V/P/D/L); dreadnought default | No era on a mount's visual | **Not modelled**: era-specific mount rendering |
| **Turret size / type / gun count** (pp. 139–141) | S/M/L by calibre; turreted vs shielded; 1–4 barrels | Mount data has barrels/calibre; no visual variant selection | **Partial**: data present, no visual variant |
| **Sponsons** (pp. 141–142) | Ring under a mount; radius setting on the Guns tab | No sponson concept at all | **Not modelled** |
| **Superstructure layers 5 & 6** (p. 142) | Turrets may use two drawing layers | No layer model for turret art | **Not modelled** |
| **Damage-state colour** (p. 142) | Game colours turrets for damage/destruction | Design workspace has warnings/status, no damage-state colouring on ship art | **Not modelled** in the design view; tactical view shows dots/graphics only (p. 78) |
| **Masts** (p. 136) | A placeable element category (drawn behind hull/turrets) | No mast element | **Not modelled** |
| **Decks / deck panels** (pp. 136–137) | Placeable; deck panels connect raised decks to barbettes | Deck-edge line only; no placeable deck panels | **Not modelled** |
| **Accessories** (pp. 136–137) | Placed last; drawn in front of everything | Funnels + fitting markers only | **Partial**: no accessory set |
| **Background / element sets / camouflage** (p. 136) | Selectable background; one default set; player can add lighter/darker/camouflaged sets | Single schematic style | **Not modelled** |
| **Bow/stern type choice** (p. 136) | Player picks bow and stern before generating hull | Bow/stern derived from hull-form id (`hull-character.ts`), not player-chosen | **Divergent**: derived, not selectable |
| **Aviation visuals** (catapults/hangars/flight deck/helipad; pp. 108–111) | Catapult, hangar, flight deck, angled deck, deck-edge lifts, helipad | `AIRCRAFT_FACILITY` category exists; no visual | **Not modelled** |
| **Radar / electronics visuals** (p. 121+; components `RADAR`/`DIRECTOR`/`RANGEFINDER`) | Radar, directors, rangefinders as equipment | Component categories + icons; no purpose-drawn visual | **Not modelled** visually |
| **Torpedo-tube visuals** (Appendix 1 requires torpedoes for DD, p. 131; `design.ts` torpedo mounts) | Torpedo launchers are a selectable element (per **[B]**) | Torpedo mounts are data; no distinct visual | **Partial**: data present, no visual |
| **Picture output** (pp. 136–137) | 640×160 jpg/bmp; named `Classname + NationNumber + .bmp` | No picture generator/export | **Not modelled** |
| **Tactical-map ship graphics** (p. 78) | Ships as graphics when zoomed in; dots when out | Tactical map uses dots/scale helpers (`tacticalScale.ts`) | **Out of scope here** (design view is the milestone surface) |

**Deferred-mechanics caution.** Mines and submarines are recorded as built-but-unreachable
deferrals in `docs/DEFERRALS.md` (D-7). Their visualisation must not be presented as a
reachable feature (DESIGN-55 §14, unsupported-content isolation). No manual visual rule for
mines/submarines is claimed here.

---

## 9. Recommendations to the implementator

1. **Type bounds.** Use §3.2 as the single source; honour strict vs inclusive at the
   load-bearing points (2000 t DD/CL, 6 in CL/CA, 34 aircraft CVL/CV), and use **standard
   displacement in tons** and **integer (rounded) inches** (Appendix 2, p. 135).
2. **Tech-scaled maxima are BALANCE TARGETS.** The DD 2000→3800 t, CL max rise, CL
   unarmoured, BC speed bar, CV super-carrier max, and AV small→large are all named on
   pp. 131–134 but **unscheduled**; do not ship them as manual facts. Use an explicit
   versioned ruleset constant (spec-owned) for the progression.
3. **Visual-part vocabulary.** The manual's side-view categories are exactly
   **masts → decks → superstructure → accessories** in placement order, with layering
   "masts/decks/superstructure behind hull and turrets; accessories in front" (pp. 136–137).
   The turret vocabulary is nationality × era × size × type × gun-count (pp. 139–141).
4. **Nation/era turret style table.** Use §5.2.1–5.2.3 verbatim as the enum; default to
   `X` universal and `D` dreadnought when no style exists (p. 139–140). Treat `S` =
   shielded as an inference and flag the `H`-vs-`S/M/L` inconsistency (§5.2) to the spec.
5. **Nation → repo map.** §6 gives the 10 distinct styles and the 14 `X` fallbacks. A
   nation-specific style for the 14 fallbacks is **not manual-sanctioned**.
6. **Do not fabricate per-nation-per-era type ownership** (§7) — the manual is silent.
7. **Era/scenario mismatch is a decision-request.** The manual's starts (1890/1900/1920/
   1935) differ from the repo's (`1880/1900/1920/1935/1960`) — §4.4. This is a canonical
   mapping the orchestrator/spec must own; do not silently resolve.
8. **Correction:** campaign starts are on **p. 21**, not p. 614 (§2 box).

All numeric values in §3, §4.1, and §5 are manual facts; anything described as
"unscheduled", "inference", "fallback", or "divergence" is **non-normative**.

---

## 10. Deferred / open

- **Numeric schedules** for the tech-scaled maxima (§3.3) — need a spec-owned ruleset
  constant; not derivable from the manual.
- **Era/scenario mapping** (§4.4) — manual starts vs repo starts; needs an owner.
- **`NationNumber`** in the picture filename (p. 137) — undefined by the manual; needs a
  repo decision if picture export is ever modelled.
- **`H` vs `S/M/L` size-code inconsistency** (p. 139 vs p. 141) — needs a spec ruling.
- **Shielded-code letter** (`S`) and the era-range overlaps (§5.2.2) — inferred; confirm.
- **Historical ship-type ownership per nation per era** (§7) — the manual is silent;
  any such matrix is out of scope for manual grounding.
- **Mines/submarines visualisation** — deferred/unreachable (D-7, DESIGN-55 §14); do not
  present as reachable.
