# ADR-0119: Promote the remaining 1880 coast-defence / casemate capital starters

## Status

Accepted (2026-10-11). Follows ADR-0111, ADR-0114, ADR-0116 and ADR-0117.

## Context

ADR-0116 gave the 1880 scenario a classification ruleset (`balance.yaml` →
`ship.classification`, `rulesetVersion: 2`) that admits slow, belted, heavy-gun
coast-defence and casemate ironclads as capital (B): displacement ≥ 1,500 t, main
belt ≥ 4 in, speed < 18 kn and 1–2 main-gun mounts. ADR-0117 promoted the first of
the ADR-0114 candidates, the US monitor *Canonicus*, and left the rest deferred
because the shared catalogue did not model their ordnance. Two research notes now
ground that ordnance without inventing values
(`docs/research/ship-building-1880-coast-defence-armament.md` and
`…-coast-defence-followups.md`): bore and mount from navypedia, gun masses from
Von Müller 1879 and Conway's, with every shell/charge/muzzle-velocity not in a
print source left `ESTIMATE`.

The candidates are legal B under the ADR-0116 ruleset, and their national B
starters were still British `DOCTRINE_TEMPLATE` clones (`starter_b_<nation>_1880`).

## Decision

1. **Promote the canonical design.** Each nation's cloned `starter_b_<nation>_1880`
   is deleted and replaced by one canonical `HISTORICAL_RECONSTRUCTION` capital
   starter, classified in the shared map and added to `HISTORICAL_B_STARTERS`:
   - netherlands **Matador** (`matador_1879`) — 1 × 2 283 mm Krupp No.1 turret.
   - portugal **Vasco da Gama** (`vasco_da_gama_1876`) — 2 × 1 263 mm Krupp in a
     CASEMATE; the 263 mm is the exact existing `gun_bl_263mm_rkl20` family, and
     its Portuguese mount is a new CASEMATE use (mount overlay added).
   - brazil **Sete de Setembro** (`sete_de_setembro_1874`) — 4 × Whitworth 9-in
     (229 mm) 300-pdr RML in a central casemate, modelled as two side mounts of
     two guns to satisfy B's 1–2 main-mount rule.
   - japan **Fusō** (`fuso_1878`) — 4 × 235 mm Krupp RKL/22 (two side mounts) +
     2 × 173 mm RKL/25.
   - spain **Numancia** (`numancia_1864`) — 2 × 1 254 mm Armstrong 12-ton 300-pdr
     RML + 8 × 160 mm Palliser RML.
   - austria_hungary **Kaiser Max** (`kaiser_max_1876`) — 8 × 209 mm G. L/20 C.68
     in a central casemate, modelled as two side mounts of four guns.
2. **One first-class family per weapon.** Eight new gun families (+ matching
   `components.yaml` components, same id and category, as the release gate
   requires) are added: `gun_bl_283mm_krupp`, `gun_bl_149mm_rkl22`,
   `gun_bl_67mm_krupp`, `gun_rml_229mm_whitworth`, `gun_bl_235mm_rkl22`,
   `gun_bl_173mm_rkl25`, `gun_rml_10in_12ton_300pdr` and `gun_bl_209mm_gl20`,
   each with a `componentAccess` entry and a national `gunModels` overlay. The
   overlays that previously **substituted** a numerically close family are
   re-pointed at the correct family (e.g. Japan's 235 mm was mapped onto the
   254 mm `gun_rml_10in_18ton`; Brazil's 229 mm onto the 254 mm broadside family).
3. **Spain's 254 mm is a distinct gun.** The Spanish 300-pdr is the Armstrong
   **10-inch 12-ton** (≈12.2 t, 300 lb/136 kg projectile), *not* the Woolwich
   10-inch 18-ton (`gun_rml_10in_18ton`, 18.3 t, 400 lb/181 kg). It gets its own
   family rather than a shell-mass override on the 18-ton family, because the gun
   mass and calibre-length differ (research note §1). The "18 t" prose conflict in
   navypedia is recorded below rather than silently resolved.
4. **A new CASEMATE mount for the 26 cm RK L/20.** `gun_bl_263mm_rkl20_casemate`
   is added to `gun-mounts.yaml` (masses mirror the component) so the family's
   shared use in a casemate is first-class, not an ad-hoc overlay.
5. **No nation's domestic ceiling is inflated.** Portugal's *Vasco da Gama* was
   built abroad (Thames Iron Wks) and exceeds Portugal's domestic industrial
   ceiling (`maxPracticalDisplacementKg` 1,400 t = the largest domestic hull,
   *Duque da Terceira* 1,406 t); the ceiling is left unchanged, and the test treats
   a documented foreign-built reconstruction as an inherited asset rather than a
   new domestic order. No `maxImportedGunCaliberUm` is authored (see F3 below).

## Alternatives considered

- **Substitute the missing guns with numerically close families.** Rejected
  (ADR-0114): a different weapon is a false mechanism (e.g. a 235 mm Krupp on a
  254 mm RML family). Each weapon gets its own family instead.
- **A profile shell-mass override for the Spanish 300-pdr.** Rejected: it would
  leave the wrong gun mass and calibre-length on the 18-ton family.
- **Raise Portugal's `maxPracticalDisplacementKg`.** Rejected (ADR-0114): the
  ceiling is a sourced industrial fact; an imported hull does not raise it.
- **Re-source the German 26 cm RK L/20 from Von Müller 1879.** Deferred, not done
  here: `gun_bl_263mm_rkl20` is shared German content (the Sachsen class) and this
  sprint must preserve UK/France/Germany content; the correction is recorded below.

## Consequences

- netherlands, portugal, brazil, japan, spain and austria_hungary now begin with
  a nationally distinct coast-defence/casemate capital ship; only qing remains on
  a doctrine-template B starter. uk/france/germany content and classifications are
  untouched.
- Reference designs sit outside `pack.json`, so the compiled pack hash is
  unchanged; `shipBuildingContentHash` changes (a non-fatal replay-divergence
  warning per ADR-0113 §4).
- **F3 — import vs domestic ceilings, recorded not done.** No period source opened
  gives a separate *domestic* heavy-gun figure for netherlands, portugal, brazil,
  japan, spain, austria_hungary or qing (all bought their heavy ordnance), so
  `maxImportedGunCaliberUm` is left absent for every one; the single
  `maxGunCaliberUm` remains the import ceiling. Near-misses (Spain Trubia/Hontoria
  ~200 mm; Austria's Pola barrel conversions) are deferred pending a
  Spanish/Austrian print source.
- **Still deferred (recorded, not dropped).**
  - qing *Wei Yuen* (160/121 mm Armstrong; **belt 0**) and US *Trenton*
    (belt 0, wooden) can never be a B (ADR-0117).
  - The German `gun_bl_263mm_rkl20` correction (gun 18,000 kg; shell 189.3/172.5 kg;
    charge 35/30 kg — Von Müller 1879) is deferred to a Germany-content sprint.
  - The Spanish 300-pdr charge/muzzle velocity and the Portuguese 67 mm shell mass
    stay `UNVERIFIED`/`ESTIMATE` (no source).
  - navypedia's conflicting "18 t" prose for the Spanish guns is flagged; the
    decisive "300-pdr (136 kg)" label wins.
