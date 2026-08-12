# Research: Content Sprint 2 — PRE_WAR Era Naval Technology & Ship Design (1900–1919)

Historical research notes for scoping the PRE_WAR-band technology + ship-design
slice of the `scen_1880` production pack. Research-only; no collection files
authored here (that is the CONTENT-2 implementation sprint).

**Scope.** Real, historically-grounded technology for the PRE_WAR era band
(January 1900 – December 1919 — see `content-0-scenario-era-bands.md`), building
on the CONTENT-1 EARLY DAG. The era's spine is the **all-big-gun revolution** and
the **maturation of centralised fire control**.

## Headline grounding (high-trust sources consulted and verified)

- **All-big-gun + turbine battleship (1906).** HMS *Dreadnought* was the first
  battleship with a uniform all-12-in main battery and the first capital ship
  driven by steam turbines; 10× 12-in in five twin turrets, 21 kt, ~18,120 long
  tons, Krupp-cemented (KCA) armour, 18 Babcock & Wilcox boilers at 250 psi.
  Source: *HMS Dreadnought (1906)* (Wikipedia): Dreyer-table director, FQ-2
  rangefinders, Dumaresq computer, Vickers range clocks, gyro-stabilised Argo
  mount, 1909 director prototype removed; 1912–13 refit added Dreyer table.
- **Fire control.** Dreyer Table, Dumaresq, and Argo Clock came into use around
  1905–1912; director-controlled firing matured and most RN capital ships were
  director-fitted by mid-1916. Source: *Fire-control system* (Wikipedia):
  Dreyer Mark IV* definitive; Dumaresq part of Dreyer Table; Argo Clock; Pollen
  vs Dreyer; director high on the superstructure.
- **Krupp armour.** Krupp armour developed 1893, replaced Harvey; Krupp cemented
  armour (KCA/VC) by early 1900s; KCA ~carbon 0.35/nickel 3.90/chromium 2.00%.
  Source: *Krupp armour* (Wikipedia).
- Context claims (from established naval reference material, re-verified at
  implementation time via the `/research` skill): super-dreadnoughts moved to
  13.5-in (Orion-class, 1912) then 15-in (Queen Elizabeth-class, 1915, oil-fired);
  Invincible-class battlecruisers (1908); South Carolina (USA, superfiring,
  1908); Kongō (JPN, Vickers 356 mm, 1913); Courbet (FRA, 1913); Standard-type
  all-or-nothing armour (USA, ~1910s); WWI U-boats and the 1916 depth charge.

## Thrusts for the PRE_WAR tech tree (by research field)

- **HULL_CONSTRUCTION:** Krupp/Vickers cemented armour (→ from Harvey/Krupp),
  all-or-nothing armour, high-tensile structural steel.
- **MACHINERY:** steam turbines on capital ships (1906), oil-fired boilers
  (coal-oil → oil focus, ~1911), geared turbines (~1915).
- **SHIP_DESIGN:** dreadnought design (1906), battlecruiser design (1908),
  super-dreadnought design (1912).
- **GUNNERY:** big 12-in gun standardisation (1905), superfiring turrets (~1910),
  13.5-in (1912), 15-in (1915).
- **FIRE_CONTROL:** coincidence/9-ft rangefinder (1905), mechanical direction
  (Dumaresq/Dreyer, ~1910), director firing (1913).
- **TORPEDOES:** long-range 18-in torpedo (~1904), WWI 21-in torpedo (1912).
- **MINES_AND_ASW:** automatic/moored contact mine (~1906), WWI depth charge
  (1916).
- **SUBMARINES:** diesel-electric boats (~1910), WWI ocean-going boats (1915).
- **INFRASTRUCTURE / DAMAGE_CONTROL:** dreadnought-scale drydocks (1906), oil
  basing (1912), torpedo bulkheads (1908).

## Explicitly deferred (not invented)

- **Deployment** (DESIGN-25) and **blockades** (B10c) content — mechanics-gated.
- **AVIATION / CARRIER_OPERATIONS** PRE_WAR techs (real scout aviation 1911–19)
  — deferred to M4/D-track because the aviation unit mechanic is not accepted.
- **RADAR_AND_ELECTRONICS / MISSILES** — first operational examples postdate 1919.

## Sources

- *HMS Dreadnought (1906)* — Wikipedia (all-big-gun; first turbine battleship;
  10×12-in, 21 kt, 18,120 lt; KCA; FQ-2/Dumaresq/Dreyer/Argo; director 1909).
- *Fire-control system* — Wikipedia (Dreyer Table, Dumaresq, Argo Clock;
  director firing by mid-1916; Dreyer Mark IV*).
- *Krupp armour* — Wikipedia (1893; KCA early 1900s; composition).
- Context (re-verified at implementation): Orion-class (13.5-in, 1912),
  Queen Elizabeth-class (15-in, oil-fired, 1915), Invincible-class (1908),
  South Carolina-class (superfiring, 1908), Kongō-class (Vickers 356 mm, 1913),
  Courbet-class (1913).