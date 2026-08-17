# Research — C-1 M3 Torpedo Constants (torpedo model / launcher / hit-resolution grounding)

> Sprint: C-1 / M3 (`@bluewave/combat`, DESIGN-40 torpedo rules, `.scratch/c1-m3-torpedoes`).
> Purpose: ground the authored `torpedo_models_v1` constant set (per-model physical data, warhead
> explosive-equivalent mass, propulsion, ordered speed/range settings, minimum arming distance,
> reliability basis points, wake-visibility modifier, tube-hit hazard policy) plus the
> launch-speed thresholds (§7/§8), protection-leak multipliers (§17), machinery-hit weights (§19),
> and tube-hit / chain-reaction probabilities (§21/§22) against recognized naval reference data.
> Sim era: `scen_1880` runs Jan 1880–Dec 1970; era bands EARLY 1880–1899, PRE_WAR 1900–1919,
> INTERWAR 1920–1939, MID_CENTURY 1940–1959, LATE 1960–1970
> (`docs/research/content-0-scenario-era-bands.md`). Target torpedo era: 1880–1945.
> This note is **reference grounding, not normative tuning**: exact shipped integers are authored
> as `*_v1` ruleset constants inside BALANCE TARGET bounds, per the gunnery/armor precedent
> (`docs/research/b3-m2-gunnery.md`, `docs/research/b4-m2-armor-damage.md`). Marked values are
> indicative reference ranges unless directly quoted from a source.
> Determinism: constants are fixed integers; engine randomness must come only from the
> deterministic keyed RNG streams (per `.ai/ENGINEERING-CONTRACT.md`) — no wall-clock, no locale,
> no `Math.random`. All recommendations below are deterministic-safe.
> Source trust: NavWeaps (compiled from Campbell / Friedman / BuOrd / official trials) — recognized
> secondary reference built on primary data; NHHC War Damage Reports — primary; Wikipedia +
> Dreadnought Project + period texts (Armstrong 1896) — secondary, flagged where used.

## 1. Question

What historical figures ground the DESIGN-40 torpedo constants that C-1/M3 authors as
`torpedo_models_v1` and launcher/hazard constants?

1. Per-model data for representative torpedoes across 1880–1945 (diameter, length, mass, warhead
   explosive mass + type + TNT equivalence, propulsion, ordered speed/range settings, arming
   distance, reliability, wake visibility, tube-hit hazard).
2. Launch-speed limits for underwater vs above-water tubes (sanity-check DESIGN-40 §7 `25` knots
   underwater / §8 `30` and `35` knots above-water).
3. Underwater-protection (torpedo-defense system / bulge) history to ground §17 protection-leak
   multipliers (`15_000` / `12_500` / `10_000` / `7_500` / `5_000` bp).
4. Torpedo hit/flooding damage reality (breach sizes, flooding rates, machinery shock,
   torpedo-vs-gun weighting) to ground §17 flotation / impact-zone multipliers and §19 machinery
   severity weights.

## 2. Sources

Directly verified this session (content read/seen):

- NavWeaps — *World War II Torpedoes of Germany* (WTGER_WWII.php): G7a full spec, reliability
  note. ✔
- NavWeaps — *World War II Torpedoes of the United Kingdom* (WTBR_WWII.php): 18" Mark XII data. ✔
  (21" Mk VIII section truncated — re-verify)
- NavWeaps — *Pre-World War II Torpedoes of the United Kingdom* (WTBR_PreWWII.php): Whitehead 18"
  1888/1894 spec. ✔ (21" Mk I–IV truncated — re-verify)
- NavWeaps — *World War II Torpedoes of the United States* (WTUS_WWII.php): Mk 13 header. ✔
  (Mk 14/Mk 15/Mk 18 sections truncated — re-verify)
- NavWeaps — *World War II Torpedoes of Japan* (WTJAP_WWII.php): Type 93 data (via truncated
  fetch + cross-check). ◐ re-verify
- NavWeaps — tech-047, Czarnecki, *Torpedo Defense Systems of World War II*. ◐ fetch truncated
  early — deep-detail claims re-verify
- Wikipedia — *G7a torpedo*: full spec table incl. arming distances (100/150/300 m impeller
  variants) and Torpedokrise. ✔
- Wikipedia — *Type 93 torpedo*: oxygen system, near-wakelessness, premature-detonation issue,
  Suzuya loss. ✔
- Wikipedia — *Anti-torpedo bulge*: Tennyson-d'Eyncourt, Edgar-class 1914 refits, Glatton,
  Revenge-class. ✔
- NHHC — *USS Canberra (CA-70) War Damage Report No. 54*. ✔ (primary)
- NHHC — Destroyer Report *Torpedo and Mine Damage* (USS Bristol). ◐ excerpt
- Naval Undersea Museum — *Whitehead* history (1866–1877 milestones). ✔
- Uboataces.com / Wikipedia G7a — G7a spec variants; Georgia Southern thesis (Butler), *Wolves
  Without Teeth* (G7e battery details, German torpedo crisis). ✔
- subsim.com forum quoting USNI Technical Report — Mk 14 arming distance (`450` yd). ✔
- NavWeaps forums (tapatalk) — underwater-tube launch-speed discussion quoting tvre.org
  (15–20 kn) and Bill Jurens (circular runs). ✔ (secondary)
- DESIGN-40 `docs/rules/torpedoes.md` — exact shipped §7/§8/§17/§18/§19/§21/§22/§23 values. ✔

Fetch failed / not verified:

- NavWeaps WTBR_18in_MkVIII.php — **404** (18" Mk VIII data lives on WTBR_WWII.php)
- NavWeaps WTJAP_T93.php — **404** (Type 93 is on WTJAP_WWII.php)
- tvre.org/en/gyro-angled-torpedoes — **transport error** (the 15–20 kn quote is second-hand via
  NavWeaps forums; retry `https://tvre.org/en/gyro-angled-torpedoes` for the direct text)
- Specific figures marked "verify" below were recalled from pages whose fetch output was
  truncated in this session; re-confirm against the live pages before citing verbatim.

## 3. Findings

### 3.1 Torpedo model table (1880–1945)

Representative models by era band (values as documented; sources per row):

| Model | Era | Diameter | Length | Mass | Warhead (explosive) | TNT equiv. | Propulsion | Ordered speed/range settings | Arming | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Whitehead 14-in ~1886 (RN/Fiume) | EARLY | 355.6 mm (14") | ~4.5 m | ~300 kg | 60 lb (27 kg) wet guncotton | ~27 kg | compressed air (cold) | 600 yd (550 m) @ 25 kn | n/a (contact) | 1884 redesign ~24 kn max (Armstrong 1896); wet guncotton unstable |
| Whitehead 18-in 1888/1894 | EARLY | 457 mm (18") | 3.556 m (140 in) | 383 kg (845 lb) | 118 lb (53.5 kg) wet guncotton | ~54 kg | compressed air, Brotherhood radial | 800 yd (730 m) @ 26.5 kn | n/a (contact) | NavWeaps WTBR_PreWWII |
| RN 21-in Mk IV (1912/1916) | PRE_WAR | 533.4 mm (21") | — | 1,454 kg (3,206 lb) | 515 lb (234 kg) TNT | 234 kg | wet heater | 8,000 yd @ 35 kn; 10,000 yd @ 29 kn; 13,500 yd @ 25 kn | ~50 m (BALANCE) | principal British WW1 torpedo |
| USN Whitehead Mk 2/3 (1893 design) | EARLY | 457 mm (17.7"/18") | 3.556 m (140 in) | 383 kg (845 lb) | 118 lb (53.5 kg) wet guncotton | ~54 kg | compressed air | 800 yd @ ~27 kn | n/a (contact) | Mk 3 + Obry gyro: deviation 24 yd → 8 yd |
| RN 21-in Mk VIII / VIII** (1925/1927) | INTERWAR | 533.4 mm | 6.579 m (21 ft 7 in) | 1,566 kg (3,452 lb) | Mk VIII: 750 lb (340 kg) TNT; VIII**: 805 lb (365 kg) Torpex | 340 / ~548 kg | wet heater (burner cycle) | Mk VIII: 5,000 yd @ 40 kn; VIII**: 5,000 yd @ 45.5 kn; 7,000 yd @ 41 kn | ~100 m (BALANCE) | 3,732 fired by Sep 1944 = 56.4% of British torpedoes (workhorse) |
| USN 21-in Mk 14 (1930/1931) | INTERWAR | 533.4 mm | 6.248 m (20 ft 6 in) | 1,361 kg (3,000 lb) | Mod 0: 507 lb (230 kg) TNT; Mod 3: 668 lb (303 kg) TPX | 230 / ~394 kg | wet heater (steam turbine) | 4,500 yd @ 46 kn; 9,000 yd @ 31 kn | 450 yd (410 m) | Mk 6 exploder: 1941–43 depth/premature/dud fiasco; BuOrd: 700 yd needed for stabilization |
| USN 21-in Mk 15 (1930s/1938) | INTERWAR | 533.4 mm | — | 1,560 kg (3,438 lb) | Mod 0: 494 lb (224 kg) TNT; Mod 3/5: 801–823 lb (364–373 kg) HBX | 224 / ~420 kg | wet heater | 6,000 yd @ 45 kn; 10,000 yd @ 33.5 kn; 15,000 yd @ 26.5 kn | 450 yd (410 m) | destroyer torpedo; same Mk 6 exploder family |
| German 53.3 cm G7a T1 (1934) | INTERWAR | 533.4 mm | 7.163–7.186 m (23 ft 6–7 in) | 1,528 kg (3,369 lb); 1,538 kg ready | 617 lb (280 kg) Hexanite / Schießwolle 36 | ~280 kg | wet heater (Decalin) | 6,000 m @ 44 kn; 8,000 m @ 40 kn; 14,000 m @ 30 kn | 100/150/300 m (impeller) | "very reliable"; 44-kn overloaded engine, banned until fix; 1939–42 Torpedokrise (pistols) |
| German 53.3 cm G7e T2/T3 (1936) | INTERWAR | 533.4 mm | 7.163 m | 1,603 kg (3,534 lb) | 617 lb (280 kg) Hexanite | ~280 kg | electric (lead-acid) | T2: 5,000 m @ 30 kn; T3: 7,500 m @ 30 kn | 100/150/300 m (same pistols) | trackless; battery preheat 30 °C, serviced every 3–5 days; H2 gassing risk |
| Japanese 61 cm Type 93 (1933/1935) | INTERWAR | 610 mm | 9.000 m (354 in) | 2,700 kg (5,952 lb) | Mod 1: 1,080 lb (490 kg) Type 97; Mod 3: 1,720 lb (780 kg) Type 97 | 490 / 780 kg | kerosene–pure oxygen (wet heater) | 40,000 m @ 36–38 kn; 32,000 m @ 40–42 kn; 20,000 m @ 48–50 kn | ~300 m (BALANCE) | nearly wakeless; dangerous handling; Java Sea premature/wake detonations (~⅓) |
| (deferred) USN 22.4-in Mk 13 (1938) | INTERWAR | 569 mm (22.4") | 4.089–4.191 m | 884–1,005 kg (1,949–2,216 lb) | Mod 0: 600 lb (272 kg) TNT; later Torpex | 272 / ~410 kg | wet heater | 6,300 yd @ 33.5 kn (Mod 0) | 200 yd (180 m) | aircraft/PT torpedo — defer to air slice |

**Uncertainty / conflicts:**
- **G7a ranges:** NavWeaps and uboat.net give 6,000/8,000/14,000 m @ 44/40/30 kn; Wikipedia G7a
  gives 5,000/7,500/12,000 m. Prefer NavWeaps + uboat.net (two sources agree); flag the
  discrepancy in the constant's provenance.
- **Mk 14 / Mk 15 / Mk VIII / Type 93 spec values** above come partly from truncated fetches —
  re-verify against NavWeaps before shipping the constant table.
- **Whitehead 14-in 1880s:** no single primary production spec captured. Dreadnought Project
  (RN, 1886): "range of 600 yards at a speed of 25 knots… warhead comprising 60 lbs of wet
  guncotton"; Armstrong 1896: 1876 14-in = 18 kn @ 600 yd / 26 lb; 1884 redesign = 24 kn max.
  Values are a range (18–25 kn), not a single pinned figure — author the EARLY 14-in constant as
  BALANCE TARGET within 18–25 kn / 26–60 lb.
- **18-in Mk VIII URL 404'd** — the RN 18-in Mk VIII (submarine, 1925) exists on WTBR_WWII.php;
  re-verify there.

### 3.2 Launch-speed limits (grounding DESIGN-40 §7 / §8)

- **Underwater tubes (surface ships):** fixed/trainable submerged tubes were non-trainable or
  limited, mounted under the armored deck, and created a local protection discontinuity. Firing
  at high speed risked torpedo deformation while the torpedo was still partly in the tube and
  partly in the water flow; a torpedo entering water at an angle could dive or broach.
  - tvre.org (via NavWeaps forums): *"the speed of the firing vessel had to be reduced to about
    15–20 knots."* Bill Jurens (NavWeaps forums): circular runs were especially a problem when
    firing from submerged tubes at high speed off the beam; on the order of **~1 torpedo in 20**
    ran circular.
  - → **Historical practical band for submerged-surface tubes: ~15–20 kn.** DESIGN-40 §7 ships
    **25 kn** as the hard ceiling. 25 kn is *above* the documented practical band — it is a
    defensible (slightly generous) upper bound; it errs in the attacker's favor, which is safe
    for a shipped default, but the note recommends flagging it as a BALANCE TARGET choice
    (historical doctrine was tighter).
- **Above-water tubes:** no direct primary quote captured for a 30/35-kn figure; however
  above-water tubes (deck mounts, trainable) are fired clear of the hull water flow and were
  routinely used at high speed (destroyer night actions, Type 93 from cruisers/destroyers at
  30+ kn, US DD above-water Mk 15). DESIGN-40 §8 `30` kn fixed / `35` kn trainable is consistent
  with historical practice → keep as shipped; mark "consistent, not directly pinned".
- **Speed/range trade doctrine (grounding ordered settings):** multi-setting torpedoes traded
  speed for range sharply (inverse relationship, ~range ∝ 1/speed³ in practice):
  - G7a: 44 kn ↔ 6,000 m; 40 kn ↔ 8,000 m; 30 kn ↔ 14,000 m
  - Mk 15: 45 kn ↔ 6,000 yd; 33.5 kn ↔ 10,000 yd; 26.5 kn ↔ 15,000 yd
  - Mk 14: 46 kn ↔ 4,500 yd; 31 kn ↔ 9,000 yd
  - Type 93: 48–50 kn ↔ 20,000 m; 40–42 kn ↔ 32,000 m; 36–38 kn ↔ 40,000 m
  - RN Mk IV: 35 kn ↔ 8,000 yd; 29 kn ↔ 10,000 yd; 25 kn ↔ 13,500 yd
  → ordered settings in `torpedo_models_v1` should preserve this monotone inverse pairing.

### 3.3 Underwater protection / TDS (grounding §17)

- **Anti-torpedo bulge:** water-filled compartmented sponsons; outer air-filled part ruptures,
  inner water-filled part dissipates shock/fragments; transverse bulkheads limit flooding.
  Developed by RN DNC Eustace Tennyson-d'Eyncourt; first on four **Edgar-class** protected
  cruisers (1914 refits); **Revenge-class** built with bulges (1914); HMS Glatton in drydock
  (1914–18) shows the bulge; US Pennsylvania-class retrofits 1929–31; IJN Yamashiro 1930.
  (Wikipedia *Anti-torpedo bulge*)
- **TDS design resistances (verify tech-047 full text):**
  - US TDS designed to resist **~800–1,000 lb (363–454 kg) TNT** (Friedman, USNI).
  - Italian Pugliese cylinder (Vittorio Veneto; Cavour/Doria reconstruction): designed vs
    **~350 kg (770 lb)** warhead.
  - **Richelieu:** deepest TDS ~7 m amidships; judged the most effective WW2 design.
  - Tennessee (1915): five-layer void/liquid/liquid/liquid/void with 3 elastic bulkheads;
    Nelson (1922): layered scheme; US fast battleships: heavy rigid bulkhead proved too rigid
    (downgraded); North Carolina: flash reached the forward magazine; Royal Oak capsized after
    2–3 hits; Ramillies/Resolution severely damaged.
  - Magnetic / under-keel detonation: never adequately solved; shock deranges machinery and
    weapons mounts even without hull penetration.
- **Mapping to §17 leak multipliers** (leak = fraction of base warhead flotation damage that
  penetrates; shipped values `15_000`/`12_500`/`10_000`/`7_500`/`5_000` bp):
  - `no torpedo-defense system` (15_000 = 1.5×): pre-1900 unprotected hulls, no voids
  - `weak` (12_500): early bulges / thin torpedo bulkhead (Edgar 1914, Dreadnought-era partial)
  - `standard` (10_000): interwar layered TDS (Tennessee 1915, Nelson 1922) — designed vs ~350 kg
  - `strong` (7_500): deep layered (Richelieu ~7 m, Yamato, Iowa/SoDak) — vs ~700–800 kg
  - `advanced` (5_000): post-WWII best designs (multi-void, designed vs ~1,000 lb + shock
    isolation)
  The multipliers themselves are DESIGN-40 shipped values (BALANCE TARGET); the historical
  mapping above is their justification.

### 3.4 Torpedo hit / flooding damage reality (grounding §17 flotation + §19 machinery)

Primary evidence (NHHC War Damage Reports):

- **USS Canberra (CA-70), WDR No. 54** (primary):
  - Aerial torpedo, ~606 lb (275 kg) Torpex ≈ **900–1,100 lb (408–500 kg) TNT equivalent**;
    hit ~18 ft (5.5 m) below the waterline.
  - **Both engine rooms flooded** — not primarily by blast but by **shaft displacement**: the
    No. 1 shaft was displaced upward/inboard and tore the 90/105 bulkheads (flooding vector is
    machinery shock, not the breach).
  - No. 4 boiler demolished — *"most of it was lost through the hole in the shell"*; machinery
    destroyed on the starboard side of No. 3 & 4 fire rooms; No. 1 shaft broke its
    reduction-gear coupling.
  - The 2.5-in STS third deck raised ~3 in but did NOT rupture (armored deck contained the
    blast) — damage restricted.
  - **Casualty statistics (cruisers):** only **2 of 11 US cruisers** hit by a single torpedo in
    machinery spaces were immobilized (Canberra + Houston); **7 of 31 US cruisers** torpedo-hit
    sank vs **20 of 24 Japanese cruisers**; **no US cruiser** was lost to a single torpedo hit;
    3 Japanese cruisers were lost to single hits; only 2 US cruisers were lost solely to two
    torpedo hits vs 4 Japanese.
- **USS Bristol (DD-453, 1,630 t), NHHC Destroyer Report** (verify exact URL):
  - One torpedo (~860 lb TNT equivalent) in a machinery space; three machinery spaces flooded
    rapidly to the waterline; **broke in two and sank ~4 minutes** after the hit; all propulsive
    and electrical power lost.
- **USS North Carolina (I-19, Type 95, ~893 lb charge)** (verify citation): **32 ft × 18 ft
  (9.8 × 5.5 m)** hull breach; 5 killed.
- **HMS Prince of Wales stern damage survey** (USNI article, verify URL): port hit ~frame 284,
  hole ~4 m × 6 m; starboard hit ~4 m × 11 m; thousands of tons of water entered via the shaft
  alley, flooding two engine rooms, damaging the electrical system, disabling steering.
- **Gneisenau** (Wikipedia): torpedo hit at Brest, Feb 1942 — flooded machinery spaces; never
  repaired.

**Findings for §17 / §19:**
- Breach scale: ~550–900 kg TNT-equivalent charges on cruiser/battleship hulls produce breaches
  of ~20–55 m² (NC 53 m² from ~893 lb; PoW 24–44 m² from ~200 kg Type 91) and flood several
  compartments.
- **Machinery shock is the primary kill mechanism** — shaft displacement floods engine rooms
  through bulkheads *not* breached by blast; boilers/turbines are destroyed or displaced;
  electrical generation and steering fail. This grounds §19's machinery severity weights and the
  §17 machinery-space impact-zone multiplier (`12_500`).
- Torpedo vs gun: single machinery-space hits routinely immobilize (Canberra, Bristol);
  destroyers die from one hit (Bristol sank in ~4 min); cruisers survive single hits far better
  (US design + DC doctrine) — grounds the torpedo-vs-gun damage weighting and the flotation
  reserve design.
- Sanity check on §19 weights: dead-in-water (`1_500` bp = 15%) + catastrophic (`500` bp = 5%)
  = 20% ≈ the observed 2/11 (18.2%) US-cruiser single-torpedo machinery-space immobility rate.

### 3.5 Explosive-equivalence factors

| Explosive | Factor vs TNT | Basis |
|---|---|---|
| Torpex | ~1.5 (range 1.49–1.82) | WDR No. 54: 606 lb Torpex ≈ 900–1,100 lb TNT |
| TPX | ~1.3 | Torpex family w/ aluminium (BALANCE TARGET) |
| HBX | ~1.15–1.3 | HBX-1/3 (BALANCE TARGET) |
| Hexanite / Schießwolle 36 | ~1.0–1.06 | TNT/hexyl mix (BALANCE TARGET) |
| Type 97 (Japanese) | ~1.0 | TNT-class (BALANCE TARGET) |
| Wet guncotton | ~1.0 | period explosive, TNT-class (BALANCE TARGET) |
| TNT | 1.0 | baseline |

### 3.6 Reliability evidence (grounding per-model reliability bp)

- **G7a:** NavWeaps: *"issued throughout the war and was considered to be very reliable."* —
  highest-reliability anchor. 44-kn setting: engine breakdowns early war → banned until new
  engine (Wikipedia). German 1939–42 **Torpedokrise** (Pi A/AZ, Pi MZ magnetic pistols): depth
  keeping and magnetic-pistol failures → premature/late/non-detonations; fixed by Pi1/Pi2 (1942).
- **G7e:** battery preheat 30 °C; serviced every 3–5 days; hydrogen gassing in tubes; after ~120
  days of ventilation cycles batteries no longer combat-ready (Butler thesis). Trackless and
  quiet — the reason U-boats preferred it by day (Wikipedia G7a).
- **Mk 14 (US):** 1941–43 fiasco — ran ~10 ft deep (magnetic exploder misfired/prematured
  ~50 ft short), contact exploder dudded; corrected mid-1943 (Naval Undersea Museum / NavWeaps).
  BuOrd analysis: 450-yd arming too short; 700 yd needed for stabilization (USNI technical
  report via subsim).
- **Mk VIII (RN):** workhorse — 56.4% of all British torpedoes fired by Sep 1944.
- **Type 93:** Java Sea — roughly **⅓ of Type 93s prematurely detonated or detonated on wakes**
  (fuze sensitivity); late-war oxygen-purity problems (38% O2) roughly halved range (verify).
- **Whitehead 14-in/18-in:** wet guncotton unstable; early gyro-less runs erratic (Mk 3 gyro cut
  deviation 24 yd → 8 yd).

### 3.7 Oxygen torpedo hazard (grounding §21/§22/§23)

- **Wake:** Type 93 nearly wakeless because pure-oxygen combustion produces CO₂ + H₂O (soluble)
  instead of nitrogen bubbles; ~5× oxidizer per volume vs air. Electric G7e also wakeless (no
  gas exhaust). Wet-heater/air torpedoes leave visible bubble wakes.
  → DESIGN-40 §23 ships oxygen wake-detection multiplier `7_500` bp (i.e., detected at 75% of
  base). Historical evidence supports *near-invisibility* — recommend the per-model
  `wake-visibility modifier` carry the realistic value (see §4.4) and surface the §23 tension
  as a BALANCE TARGET item for the owner (do not silently alter the shipped `7_500`).
- **Handling / tube hazard:** oxygen torpedoes were dangerous to handle: joint regulator valve,
  13-L compressed-air start tank, meticulous maintenance (Wikipedia Type 93). Fires/explosions
  of stored Type 93s contributed to losses of **Suzuya** (Samar, 25 Oct 1944: near-miss bomb
  detonated torpedoes in tube mounts → fires → boiler and engine rooms → magazines → sunk) and
  **Mikuma** (Midway); **Chōkai** (Samar) — shell-fire-induced oxygen-torpedo explosion (verify
  each case's citation; Wikipedia Type 93 covers Suzuya via Lacroix & Wells).
  → Grounds §21 propulsion multiplier oxygen `15_000` (tube-hit severe flooding) and §22
  chain-reaction oxygen `3_000` > ordinary `1_500`. Electric `1_000`/`7_500`: lead-acid battery
  hydrogen gassing is a real tube hazard (Butler thesis) but lower than oxygen; DESIGN-40's
  ordering is defensible (BALANCE TARGET, not contradicted).

## 4. Recommendations for authored constants

### 4.1 `torpedo_models_v1` — model set + physical constants

Recommended entries (era-band reachable in `scen_1880`; defer air/Mk 13 to the air slice):

| model_id | Era | diameter_mm | length_m | mass_kg | warhead kg + type | tnt_equiv_kg | propulsion | provenance |
|---|---|---|---|---|---|---|---|---|
| `whitehead_14in_1886` | EARLY | 356 | 4.5 | 300 | 27 wet guncotton | 27 | `COMPRESSED_AIR` | GROUNDED range (18–25 kn / 26–60 lb); value BALANCE TARGET |
| `whitehead_18in_1894` | EARLY | 457 | 3.556 | 383 | 53.5 wet guncotton | 54 | `COMPRESSED_AIR` | GROUNDED (NavWeaps WTBR_PreWWII) |
| `rn_21in_mk_iv_1916` | PRE_WAR | 533 | 7.0* | 1,454 | 234 TNT | 234 | `WET_HEATER` | GROUNDED (NavWeaps; length verify) |
| `rn_21in_mk_viii_1927` | INTERWAR | 533 | 6.579 | 1,566 | 340 TNT / 365 Torpex | 340 / 548 | `WET_HEATER` | GROUNDED (NavWeaps; verify) |
| `usn_21in_mk14_1931` | INTERWAR | 533 | 6.248 | 1,361 | 230 TNT / 303 TPX | 230 / 394 | `WET_HEATER` | GROUNDED (NavWeaps + USNI; verify) |
| `usn_21in_mk15_1938` | INTERWAR | 533 | 7.3* | 1,560 | 224 TNT / 364–373 HBX | 224 / 420 | `WET_HEATER` | GROUNDED (NavWeaps; verify) |
| `ger_533mm_g7a_1934` | INTERWAR | 533 | 7.163–7.186 | 1,528 | 280 Hexanite | 280 | `WET_HEATER` | GROUNDED (NavWeaps + Wikipedia) |
| `ger_533mm_g7e_1936` | INTERWAR | 533 | 7.163 | 1,603 | 280 Hexanite | 280 | `ELECTRIC` | GROUNDED (NavWeaps; verify) |
| `jpn_61cm_type93_1935` | INTERWAR | 610 | 9.000 | 2,700 | 490 / 780 Type 97 | 490 / 780 | `OXYGEN` | GROUNDED (NavWeaps; verify) |

*length marked `*` = not captured this session; verify or author as BALANCE TARGET.

### 4.2 Ordered speed/range settings (per model; metres + knots)

| model_id | Setting 1 | Setting 2 | Setting 3 | provenance |
|---|---|---|---|---|
| `whitehead_14in_1886` | 25 kn @ 550 m | — | — | GROUNDED band 18–25 kn; value BALANCE TARGET |
| `whitehead_18in_1894` | 26.5 kn @ 730 m | — | — | GROUNDED (NavWeaps) |
| `rn_21in_mk_iv_1916` | 35 kn @ 7,315 m | 29 kn @ 9,144 m | 25 kn @ 12,344 m | GROUNDED (NavWeaps; verify) |
| `rn_21in_mk_viii_1927` | 40 kn @ 4,572 m | 45.5 kn @ 4,572 m (VIII**) | 41 kn @ 6,401 m (VIII**) | GROUNDED (NavWeaps; verify) |
| `usn_21in_mk14_1931` | 46 kn @ 4,115 m | 31 kn @ 8,230 m | — | GROUNDED (NavWeaps; verify) |
| `usn_21in_mk15_1938` | 45 kn @ 5,486 m | 33.5 kn @ 9,144 m | 26.5 kn @ 13,716 m | GROUNDED (NavWeaps; verify) |
| `ger_533mm_g7a_1934` | 44 kn @ 6,000 m | 40 kn @ 8,000 m | 30 kn @ 14,000 m | GROUNDED (NavWeaps + uboat.net; Wikipedia variant 5,000/7,500/12,000 — flagged) |
| `ger_533mm_g7e_1936` | 30 kn @ 5,000 m (T2) | 30 kn @ 7,500 m (T3) | — | GROUNDED (NavWeaps; verify) |
| `jpn_61cm_type93_1935` | 48 kn @ 20,000 m | 40 kn @ 32,000 m | 36 kn @ 40,000 m | GROUNDED (NavWeaps; verify) |

### 4.3 Minimum arming distance (metres)

| model_id | arming_distance_m | provenance |
|---|---|---|
| `whitehead_14in_1886` / `whitehead_18in_1894` | 20–30 (nominal; contact pistol) | BALANCE TARGET — no run-based arming captured |
| `rn_21in_mk_iv_1916` | 50 | BALANCE TARGET |
| `rn_21in_mk_viii_1927` | 100 | BALANCE TARGET |
| `usn_21in_mk14_1931` | **410** (450 yd) | **GROUNDED** — USNI technical report via subsim; BuOrd: 700 yd recommended for stabilization |
| `usn_21in_mk15_1938` | **410** | GROUNDED (same Mk 6 exploder family; flag verify) |
| `ger_533mm_g7a_1934` | **150** (U-boat red impeller; 100 shore / 300 surface variants) | **GROUNDED** — Wikipedia G7a spec table (Pi1/Pi2); recommend 150 as model default, launcher-type variant optional |
| `ger_533mm_g7e_1936` | **150** | GROUNDED (same pistols) |
| `jpn_61cm_type93_1935` | 300 | BALANCE TARGET — no source captured |

### 4.4 Wake-visibility modifier (bp; multiplier on wake-detection probability — BALANCE TARGET)

| propulsion | modifier bp | basis |
|---|---|---|
| compressed air / wet heater | `10_000` | visible bubble wake (air exhaust) |
| wet heater (steam turbine, Mk 14/15) | `9_000` | visible, partially condensed |
| electric | `2_500` | trackless, no gas exhaust |
| oxygen | `2_500` | CO₂+H₂O soluble, near-invisible (then DESIGN-40 §23 oxygen wake multiplier `7_500` applies → effective ~1_875 bp ≈ 19%) |

Note: DESIGN-40 §23 ships oxygen wake-detection multiplier `7_500`; historical evidence supports
near-invisibility. **Surface as a BALANCE TARGET item for the owner** — do not silently change
the shipped value; the per-model modifier is the correct lever.

### 4.5 Reliability basis points (BALANCE TARGET; qualitative grounding only)

| model_id | reliability_bp | evidence |
|---|---|---|
| `ger_533mm_g7a_1934` | 96_000 | "very reliable" (NavWeaps); 44-kn setting exception |
| `rn_21in_mk_viii_1927` | 95_500 | workhorse; 56.4% of British torpedoes |
| `usn_21in_mk15_1938` | 95_000 | late-war standard (Mk 6 fixed) |
| `usn_21in_mk14_1931` | 94_000 | late-war fixed; early-war fiasco documented |
| `ger_533mm_g7e_1936` | 93_000 | battery/preheat/service constraints |
| `rn_21in_mk_iv_1916` | 93_500 | WW1 standard |
| `jpn_61cm_type93_1935` | 92_000 | Java Sea premature/wake detonations |
| `whitehead_18in_1894` | 90_000 | wet guncotton instability, erratic runs |
| `whitehead_14in_1886` | 88_000 | earliest era, poorest accuracy (gyro-less) |

### 4.6 Launch-speed limits (grounding §7/§8 — keep shipped values)

- **Underwater (surface ships):** keep `25` kn (12,861,100 µm/s) as the hard ceiling. Historical
  practical band was ~15–20 kn (tvre.org; Jurens). 25 kn is generous-but-defensible; flag as
  BALANCE TARGET for the owner (a tighter `20` kn would match doctrine; do not change silently).
- **Above-water:** keep `30` kn fixed / `35` kn trainable — consistent with high-speed
  destroyer/cruiser practice; no primary quote pins the exact figures → BALANCE TARGET.
- **SUBMARINE_INTERNAL:** model-specific per §7; no recommendation (no sub data researched here).

### 4.7 §17 protection levels / §19 machinery — historical mapping (multipliers are shipped BALANCE TARGET)

| §17 level | leak bp (shipped) | historical anchor |
|---|---|---|
| no TDS | 15_000 | pre-1900 unprotected hulls |
| weak | 12_500 | Edgar-class 1914 bulges, Dreadnought-era thin bulkheads |
| standard | 10_000 | Tennessee 1915 five-layer, Nelson 1922 (vs ~350 kg) |
| strong | 7_500 | Richelieu ~7 m, Yamato, Iowa/SoDak (vs ~700–800 kg) |
| advanced | 5_000 | post-WWII multi-void + shock isolation (vs ~1,000 lb) |

§19 machinery weights (`1_000`/`4_000`/`3_000`/`1_500`/`500` bp) are consistent with WDR-54
(boilers demolished, shafts displaced, engines flooded via bulkhead tears) and the 2/11 (18.2%)
immobility statistic ≈ dead-in-water + catastrophic (20%). Keep shipped; add the WDR-54
shaft-displacement flooding vector to the resolver's machinery-shock semantics (recommendation,
not a new shipped value).

### 4.8 Tube-hit / chain-reaction (grounding §21/§22 — keep shipped values)

- Keep §21 base `5_000` bp, oxygen propulsion multiplier `15_000`, electric `7_500`; §22 chain
  reaction ordinary `1_500` / oxygen `3_000` / electric `1_000`. Historical grounding:
  Suzuya/Mikuma/Chōkai oxygen chain reactions; G7e battery hydrogen hazard (lower than oxygen).
- Per-model `tubeHitHazardPolicy` values: `ORDINARY` for compressed-air/wet-heater,
  `OXYGEN` for Type 93, `ELECTRIC` for G7e — matching the shipped propulsion multipliers.

### 4.9 Determinism note

All recommended constants are fixed integers (metres, knots, kg, basis points). Any probabilistic
roll (reliability, detonation outcome, machinery severity, chain reaction, wake detection) MUST
use the deterministic keyed RNG streams only — no wall-clock, no locale, no `Math.random`
(per `.ai/ENGINEERING-CONTRACT.md`).

## 5. Deferred / decision requests

- **tvre.org direct quote** — fetch failed (transport error); the 15–20 kn underwater-tube figure
  is second-hand via NavWeaps forums. Retry `https://tvre.org/en/gyro-angled-torpedoes` if a
  direct citation is required; otherwise the forum-quoted figure stands as secondary grounding.
- **tech-047 full text** — fetch truncated; TDS deep-detail claims (Tennessee five-layer,
  Pugliese 350 kg, Richelieu 7 m, NC forward-magazine flash, US 800–1,000 lb resistance) need
  re-verification against the full article before citing verbatim.
- **Spec numbers pending re-verification** (fetches truncated): Mk 14 / Mk 15 / Mk 18 / Mk 13
  (WTUS_WWII.php), Mk VIII 21" (WTBR_WWII.php), 21" Mk I–IV (WTBR_PreWWII.php), Type 93
  (WTJAP_WWII.php), USN Whitehead Mk 2/3 (Wikipedia).
- **Unverified figures** (recall-only, need a citation before use): USS North Carolina 32×18 ft
  breach; Prince of Wales stern-survey hole dimensions (4×6 m / 4×11 m); USS Bristol 860 lb TNT
  eq / 4-min sinking; Type 93 "⅓ premature at Java Sea"; late-war 38%-oxygen range halving;
  Chōkai/Mikuma oxygen-torpedo loss mechanics.
- **BALANCE TARGET items for the owner (surfaced, not silently resolved):** §7 `25`-kn
  underwater ceiling vs documented 15–20 kn band; §23 oxygen wake-detection multiplier `7_500`
  vs near-invisible wake evidence; G7a range-set discrepancy (NavWeaps 6/8/14 km vs Wikipedia
  5/7.5/12 km); EARLY 14-in Whitehead range/speed band (18–25 kn, 26–60 lb) — no single pinned
  figure.
- **Deferred mechanics (not researched as reachable per DESIGN-55 §14):** Mk 13 aerial torpedo
  (air slice), submarine-launch arming/limits (SUBMARINE_INTERNAL), pattern-running T3a/Falke
  acoustic guidance, G7e battery-readiness degradation modeling, Type 93 oxygen-generator
  logistics.
