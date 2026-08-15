# Research — B-3 M2 Gunnery Constants (core surface gunnery fire-resolution)

> Sprint: B-3 (`@bluewave/combat`, DESIGN-39 core surface gunnery slice, `.scratch/b3-m2-gunnery`).
> Purpose: ground the versioned gunnery constant set B-3 ships — `baseReloadMilliseconds` by
> broad caliber (§4), the `RANGING`/`NORMAL` fire-mode + fire-control-solution semantics (§2/§3),
> and the accuracy-multiplier/dispersion context (§3) — against recognized naval reference data.
> Sim era: `scen_1880` runs Jan 1880–Dec 1970, but this slice targets late-19th to mid-20th
> **surface** naval gunnery. This note is **reference grounding**, not normative tuning: exact
> shipped integers are authored as `*_v1` ruleset constants inside BALANCE TARGET bounds, per the
> B-3 ADR. Marked values are indicative reference ranges unless directly quoted.
> Sources are NavWeaps (compiled from Campbell/Friedman/BuOrd/CONUS official range tables) — a
> recognized secondary reference built on primary data; each claim traced below.

## 1. Base reload / firing cycle by broad caliber (DESIGN-39 §4)

DESIGN-39 represents fire rate as **reload work per shot** (integer `baseReloadMilliseconds`),
not rpm. Grounded per-gun firing cycles (per-nav official rate-of-fire figures via NavWeaps):

| Broad caliber | Grounded cyclic rate (per gun) | Grounded per-shot cycle | Chosen baseReloadMs |
|---|---|---|---|
| 6 in / 152 mm | 8–10 rpm (US 6"/47 Mk16, 1937) | 6.0–7.5 s | **7 000** ms |
| 8 in / 203 mm | 3–4 rpm (US 8"/55 Mk9/11/13/14, 1927); exceptional 5–6 rpm at Java Sea | 15–20 s (best ~10 s) | **18 000** ms |
| 12 in / 305 mm | 2–3 rpm (US 12"/50 Mk7, 1912/1944) | 20–30 s | **25 000** ms |
| 14 in / 356 mm | 1.25–2 rpm (US 14"/45 1.25–1.5; 14"/50 ~1.75–2) | 30–48 s | **36 000** ms |
| 15 in / 381 mm | 2 rpm nominal (RN 15"/42 Mk1, 1916–1954); 30.2 s best; monitors ~1 rpm | ~30–36 s (monitors ~60 s) | **35 000** ms |
| 16 in / 406 mm | ~1.5 rpm (US 16"/45 Mk1, 1921) | ~40 s | **40 000** ms |

Sources (verified directly):
- 15 in Mk I: NavWeaps = "2 rounds per minute… nominal firing cycle 36 seconds [Mk I/Mk I*], 30.2 s
  achieved 1 Oct 1917; Mk II (Hood) nominal 32 s; monitors rarely faster than 1 rpm."
- 16"/45 Mk1: NavWeaps = "about 1.5 rounds per minute."
- 12"/50 Mk7: NavWeaps = "2 - 3 rounds per minute."
- 14"/45 Mk1/2/3/5: NavWeaps = New York ~1.25–1.5 rpm, Nevada/Pennsylvania ~1.5–1.75 rpm (labor
  intensive handling); 14"/50 Mk7/11 = ~1.75 rpm, Mk B = 2 rpm.
- 8"/55 Mk9/11/13/14: NavWeaps = "3 - 4 rounds per minute"; USS _Houston_ 5–6 rpm at Java Sea 1942.
- 6"/47 Mk16: NavWeaps = "8 - 10 rounds per minute" (10+ achieved in 1939 trials; ~5 rpm at +60° AA).

**scen_1880 (EARLY) reality — heavy guns are slow muzzle loaders.** The production-pack capital
ships are 1880-ERA RML heavy guns (12 in/305 RML, 16 in/406 RML, up to 17.7 in/450 RML) per
`docs/research/content-1-fleets-and-ship-classes.md`. Large muzzle-loading rifles required
intrinsically slow load-at-the-muzzle cycles — of order **2–5 minutes per round**, heavily
crew-dependent; the giant 100-ton guns were slower still. **No single primary table pins a precise
integer** for 1880s RML reload, so B-3 should author the scen_1880 heavy-gun `baseReloadMilliseconds`
as a **BALANCE TARGET** grounded in the 120 000–300 000 ms (2–5 min) range, and flag it (never
silently resolve) either as an ADR'ed constant or an OPEN DECISION for the content owner.

## 2. Fire control / ranging / salvo practice (MODES + solution quality)

- **Ranging practice:** standard early-to-mid-century technique was to fire a **"ladder"** of
  deliberate salvos spaced down (short) and up (over) the target to bracket/straddle, then shift to
  steady fire. NavWeaps (Savannah/Honolulu 1939 trials, quoted from Friedman): *"a ship fired a
  'ladder' to find the range, then shifted to rapid fire… fourteen shells well short, fourteen…
  well over, then full rapid fire by individual guns, 138 shots being fired in one minute."*
  → **`RANGING` mode = deliberate, solution-building salvos** (slower, few guns, range-correcting);
  **`NORMAL` mode = steady, full-battery salvos** once a solution/straddle is established. This
  matches DESIGN-39 `RANGING`/`NORMAL` semantics and the §7 rule that `RAPID` requires a valid
  straddle + solution.
- **Concrete salvo cycle (sustained fire):** USS _Idaho_ firing test, 10 Oct 1942 (156 salvos,
  100 rds/gun forward, ~21 000 yd): **average interval between salvos = 1 min 24 s (~84 s)**;
  one 5-gun salvo at 49 s; salvos 60–80 at ~67 s; degrading to ~2 min as magazine supply thinned
  (NavWeaps quoting Friedman/USN test). This is strong grounding for a realistic **full-battery
  salvo interval of ~60–90 s at long range** and for reload degradation driven by ammunition/supply.
- **Fire-control solution quality concept:** solution quality is the confidence in the computed
  range/deflection solution. It is bounded by firing practice, ranging observation (spotting), and
  optics/radar. Grounding for a sane ceiling: a well-solved, radar/table-supported engagement
  legitimately approaches the 10 000-bp (perfect) neutral; a purely ranging/ladder phase yields a
  **low** solution; DESIGN-39 §7 already requires ≥6 000 bp for `RAPID` autoloader eligibility.
  → Recommend neutral solution quality default **10 000 bp** with the DEFINED quality bands left as
  authorable ruleset constants (`RANGING` low, e.g. <6 000; `NORMAL` high). This is a **BALANCE
  TARGET** bound, not a primary-sourced quantity.

## 3. Accuracy / dispersion context (DESIGN-39 §3)

Dispersion is the primary physical driver behind the accuracy multipliers; neutral 10 000 bp
means "at/near specified mean-point-of-impact." Grounding (NavWeaps):
- **Poor tuning ⇢ large patterns:** 8"/55 early-cruiser full-salvo patterns **sometimes ~2 000 yd**,
  corrected by lowering MV and relining (unit-specific, 1930s). → justifies a **gun-quality** /
  technology multiplier moving accuracy as configuration improves.
- **Good practice ⇢ tight patterns:** 14"/50 rebuilt guns cut 12-gun patterns to **<700 yd**;
  Surigao Strait 1942 reports of **300–400 yd** patterns at 20 000 yd; adding ~0.1 s (14"/45) or
  0.06 s (14"/50) fire-delay coils halved dispersion. → justifies a **crew + fire-control**
  multiplier and a previous-salvo/spotting correction term (belief that range error diminishes as
  the battery achieves a straddle).
- These bounded (~3x) dispersion spreads across realistic conditions recommend **modifiers in a
  roughly ±25% band around the 10 000-bp neutral** (i.e., ~7 500–12 500 bp) for crew, fire-control,
  range, and visibility — defensible authored values, all **BALANCE TARGET** (non-normative; not a
  primary fact).

## Constants recommended for the B-3 slice

| Name | Value | Basis | Status |
|---|---|---|---|
| `baseReloadMs_6in` | 7 000 ms | 6"/47 = 8–10 rpm (6.0–7.5 s) | Grounded; BalTarget |
| `baseReloadMs_8in` | 18 000 ms | 8"/55 = 3–4 rpm (15–20 s) | Grounded; BalTarget |
| `baseReloadMs_12in` | 25 000 ms | 12"/50 = 2–3 rpm (20–30 s) | Grounded; BalTarget |
| `baseReloadMs_14in` | 36 000 ms | 14"/45/50 = 1.25–2 rpm (30–48 s) | Grounded; BalTarget |
| `baseReloadMs_15in` | 35 000 ms | 15"/42 = 2 rpm nominal (30–36 s) | Grounded; BalTarget |
| `baseReloadMs_16in` | 40 000 ms | 16"/45 = ~1.5 rpm (~40 s) | Grounded; BalTarget |
| `baseReloadMs_rmlHeavy1880` (12–17.7 in RML) | **BALANCE TARGET ~120 000–300 000 ms** | 1880s muzzle-loading heavy guns, ~1–5 min/rd; no precise primary integer | **NOT fully grounded → needs owner/ADR** |
| Fire-control solution neutral/default | 10 000 bp | Perfect-solution ceiling; `RAPID` needs ≥6 000 | BalTarget |
| Sustained full-battery salvo interval | ~60 000–90 000 ms | _Idaho_ test 84 s avg @ ~21 000 yd | Grounded anchor; BalTarget |
| Accuracy modifier band (crew/FC/range/visibility) | ~7 500–12 500 bp | dispersion ~3x spreads (300–2 000 yd) | BalTarget (qualitative) |

All values above (except the three explicitly marked **Grounded**) are **BALANCE TARGET** — the
engine/formula write it as a versioned constant; no primary source fixes a unique tuned integer.
The only value I could not ground to a precise primary integer is the 1880s RML heavy-gun reload,
where the defensible range (120 000–300 000 ms) should be surfaced rather than silently pinned.

## Deferred / owners

- 1880s RML reload exact constant: needs content-owner decision or a B-3 ADR (flagged; not silently
  resolved — respects `.scratch/b3-m2-gunnery/map.md` decision 06 and `docs/OPEN-ISSUES.md`).
- Fire-control solution-quality numeric bands and mode-specific salvo cadence: later fire-control/
  radar slice (recorded in map "not yet specified").
- Autoloader/dual-purpose specific reload factors (§6–15): deferred per B-3 scope boundary.

## Sources (verified directly this sprint)
- NavWeaps: UK 15"/42 Mk I (ROF + 30.2 s); US 16"/45 Mk1 (1.5 rpm); US 12"/50 Mk7 (2–3 rpm);
  US 14"/45 Mk1/2/3/5 + 14"/50 Mk7/11 (ROF, dispersion, _Idaho_ test); US 8"/55 Mk9/11/13/14
  (ROF, dispersion, Java Sea); US 6"/47 Mk16 (ROF, 1939 ladder example). Compiled from Campbell
  *Naval Weapons of WW2*, Friedman *US Naval Weapons / US Battleships*, BuOrd OP-1188 range tables.
- Repo grounding: `docs/research/content-1-fleets-and-ship-classes.md` (1880s RML calibers);
  `.scratch/b3-m2-gunnery/map.md` (decision 06 = research-grounded naval constant set).
  (Secondary-reference compilation; treat per-gun figures as representative reference values.)
