# 22: Replace ESTIMATE and Wikipedia-only rows in the build-time table (release blocker)

**Type:** task
**Status:** open
**Blocked by:** none
**Frontier:** yes

Source: ticket 20 review. In `content/production/1880/ship-building/balance.yaml`, `buildMonthsByDisplacementT` has unsourced ESTIMATE points at 300, 3,000, 9,000 and 20,000 t, and a Wikipedia-only point at 12,000 t whose completion date conflicts with Brassey 1901 (Cressy delivered Oct 1900 vs Wikipedia 28 May 1901). Verify against Conway's, Brassey 1902 or navweaps, add destroyer and torpedo-boat sources, record machine-readable provenance per point, and drop the "provisional" label in the Drawing Board forecast once no ESTIMATE rows remain. Release blocker.

## Comments

### 2026-10-08 implementator

Status: partly done, left open. No ESTIMATE rows remain, but one point is SECONDARY, so builds between 390 t and 11,000 t still show "provisional".

Table now (`content/production/1880/ship-building/balance.yaml`, notes in `docs/research/ship-building-build-times.md`): 390 t 16 months (Brassey 1901 p. 263, Bat 16 / Whiting 14, VERIFIED), 5,600 t 30 (Brassey 1901 p. 262 Hermes/Highflyer, SECONDARY because the displacement is not in the volumes read), 11,000 t 30 (Diadem, p. 262, VERIFIED), 12,000 t 31 (Cressy, VERIFIED), 12,950 t 35, 14,900 t 36 (unchanged, VERIFIED), 16,500 t 34 (Lord Nelson, Brassey 1908 p. 27, VERIFIED), 18,600 t 28 (Bellerophon, Brassey 1910 p. 1, VERIFIED). The 300/3,000/9,000/20,000 t ESTIMATE points were replaced by these sourced points.

Cressy conflict resolved: Oct 1900 is the contractor's delivery to Portsmouth (Brassey 1901 p. 20); commissioning was May 1901 (Brassey 1902 p. 396, "commissioned in May last"), matching Wikipedia's 28 May 1901. Laid down 12 Oct 1898 (Brassey 1901 p. 23). Keel to commissioning is 31 months.

Provenance: new `buildMonthsProvenance` list (status VERIFIED/SECONDARY/ESTIMATE + source), parallel to the points; `buildTimeIsProvisional` (construction.ts) throws on a length mismatch, unknown status or empty source; `WorkshopView.forecast.historicalProvisional`; the Drawing Board shows "provisional" only while a bracketing point is not VERIFIED. Balance content is cast, not schema-validated, so the check lives in that function.

Not verified / remaining: (1) Hermes/Highflyer 5,600 t displacement (SECONDARY); (2) no Conway's/navweaps/Navypedia source was reachable, Brassey is the only primary; (3) no completion date for the 9,800 t Kent/Monmouth class. Design caveat: the 1906-10 battleship points (34, 28) are shorter than the 1897-1900 ones, so the table is no longer monotonic above 14,900 t (era effect; a follow-up could add an era multiplier). The monotonic test now covers up to 14,900 t.

Commands: `cd packages/ship-design && npx vp test run` -> 29 files, 280 passed; `npx tsc --noEmit` clean; `npx vp lint .` clean. `cd apps/desktop && npx vp test run src/renderer/screens/construction` -> 28 passed; `npx tsc -b` clean. `cd packages/phase-engine && npx vp test run test/submit-design.test.ts` -> 8 passed. `npx vp fmt --check content packages/ship-design apps/desktop/src/renderer/screens/construction` clean.
