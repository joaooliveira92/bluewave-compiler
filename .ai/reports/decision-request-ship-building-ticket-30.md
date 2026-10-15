# Decision Request: Closing the unsourced-content release gate (ship-building ticket 30)

## Status

**OPEN — blocked pending owner decision.** No content, code, or ticket value was
changed. Ticket 30 stays `claimed` (frontier).

## Trigger

`.scratch/ship-building/issues/30-sourced-content-values.md` is the standing
**release gate** for `.scratch/ship-building/` (P-2 acceptance). Its acceptance:

> Each replaced value cites its source in a comment and in a research note with a
> confidence label; the ratchet ceiling is lowered in the same change; the cost
> calibration tests still pass.

The ticket's whole purpose is to _replace the remaining unsourced content
values_; the release gate is "closed" when the PLACEHOLDER ratchet reaches its
floor. Three research passes have now failed to source the residual set. The
question is not a value conflict: it is **what to do when high-authority content
does not exist in any accessible source** — accept the values as documented
ESTIMATEs (and close the gate), or keep the gate open as a hard release blocker.
Choosing wrong silently redefines a release gate and, if any numbers change,
alters authoritative content and compiled-design hashes.

## Evidence

- Ticket: `.scratch/ship-building/issues/30-sourced-content-values.md` (Status
  `claimed`; inventory + two open conflicts).
- Research record: `docs/research/ship-building-content-sourcing.md` — pass 1
  (lines 1-259), pass 2 (260-394), **pass 3 "fresh sources" (396-592)**. Pass 3
  tried Jane's, _The Engineer_/_Engineering_, INA/IESS Transactions, HathiTrust,
  Google Books, Grace's Guide, the Admiralty _Manual of Gunnery_ 1880,
  _Text-book of Service Ordnance_ 1886, Hotchkiss/Maxim-Nordenfelt handbooks,
  _Mechanism of Men-of-War_ 1896, Sleeman 1880 — and found **no** usable value
  for any residual item. It also recorded that archive.org's FTS `scrape.json`
  endpoint, the Google Books API and Grace's Guide search do **not** offer
  corpus-wide search, so a further OCR-grep pass cannot reach the gap.
- Residual PLACEHOLDER markers (ticket 30 owns ~25 in `components.yaml`):
  light/medium mount footprint+volume (6-in/26, QF 6-in/40, 4.7-in, 12-pdr,
  6-pdr, 3-pdr, Nordenfelt, Maxim); BL 12-in/25 (Collingwood) barbette;
  `tube_14in_*` volume+cost; magazine section; `rangefinder_optical` mass;
  general-equipment section (electrical plant/quarters/funnel/pumps/ventilation).
  Plus `plants.yaml` header line 4 and `balance.yaml` line 3.
- Ratchet: `packages/ship-design/test/placeholders.test.ts` (ceilings
  components 50 / balance 5 / plants 1 / hull-forms 0 / reference-designs 0; the
  test asserts `count === ceiling`, so a ceiling may only fall with a real fix).
  `scripts/verify-content-gate.mjs` allowlists 23 placeholders independently.
- Prior partial landing (already committed): big barbette footprints/volumes
  (13.5/12/10/9.2-in) and water-tube plant/yard rate were sourced in
  `91123d05`; `hull-forms.yaml` and `reference-designs/` are already at 0.
- The residual set is **not** available in digitised literature: it lives in
  non-digitised RN Admiralty dockyard records (Sheer Draughts, Books of
  Reference, contract weight schedules), National Maritime Museum ship plans,
  and armament makers' (Elswick/Armstrong, Vickers, Maxim-Nordenfelt) drawing
  catalogues. None is full-text searchable online.
- Contract: `.ai/ENGINEERING-CONTRACT.md` ("Do not silently reinterpret gameplay
  rules, invent missing canonical content"); `.ai/AUTONOMOUS-AGENT.md` stop
  conditions ("required high-authority content is missing"; "a repair would
  fabricate canonical information").

## Why agent judgment is insufficient

- **Closing the gate by relabelling** the residual heuristics as `ESTIMATE`
  (keeping every current number) invents no value, but it reclassifies a
  release blocker as "done". That is a product/quality-bar decision, not a local
  implementation detail, and it changes what "P-2 acceptance" means.
- **Sourcing the values** requires physical/non-digitised archives the agent
  cannot access; it is not an engineering task.
- **Changing the numbers** to anything else would alter authoritative content
  and compiled-design hashes, requiring golden re-pin + migration assessment
  (ADR-0007) with no evidential basis — i.e. fabrication.

All three outcomes differ in product and release significance, so this cannot be
resolved by agent inference alone.

## Options

### Option A: Accept the residual values as documented ESTIMATEs and close the gate

- Behavior: keep every current number; replace each residual `PLACEHOLDER`
  comment with a justified `ESTIMATE` note (mirroring the existing "Decided, not
  placeholders" pattern for the revision constants), lower the PLACEHOLDER
  ratchet ceilings to their new floor, and record the decision in an ADR. Update
  `scripts/verify-content-gate.mjs`'s allowlist to match.
- Advantages: no gameplay/hash change; the P-2 gate can close; the values are
  honest and documented rather than mislabelled.
- Risks: lowers the sourcing bar for the residual set; the numbers remain
  unsourced (a reviewer may later dispute them by play).
- Compatibility impact: none (no value changes).
- Migration impact: none (no hashes change).
- Scope and effort: small — comment/ADR/ratchet edits; re-run content gate,
  calibration and golden tests.

### Option B: Keep the gate open; treat ticket 30 as a deferred release blocker

- Behavior: ticket 30 stays open/`claimed`; record the residual set as a
  documented, owner-unblockable blocker (this decision request). Advance the
  frontier to tickets 37 (lightweight TB propulsion) and 39 (reference-design
  provenance), which are independent implementation work.
- Advantages: no canonical-content compromise; honest release stance; unblocks
  independent tickets.
- Risks: P-2 cannot reach full acceptance; the gate may stay open indefinitely.
- Compatibility impact: none.
- Migration impact: none.
- Scope and effort: none now; owner to arrange archive access later.

### Option C: Commission non-digitised sourcing before closing

- Behavior: the owner obtains the Admiralty dockyard records / NMM plans /
  makers' catalogues and a later research pass sources the values.
- Advantages: highest fidelity; closes the gate with real sources.
- Risks: requires owner/archive access (out of agent reach); long lead time.
- Compatibility impact: none.
- Migration impact: none (unless derived values change, then ADR-0007 process).
- Scope and effort: external research effort.

## Recommendation

**Option B as the default** (keep the gate open, advance to 37/39), because it
compromises nothing and the frontier has independent work. If the owner prefers
to close P-2 now without archive access, **Option A** is the only honest way to
close — but it is the owner's quality-bar call, and should be recorded as an ADR.
Do not relabel the markers or touch any content value without that approval.

## Work safely completed while blocked

- Research pass 3 appended to `docs/research/ship-building-content-sourcing.md`
  (new sources tried, every residual item re-confirmed unsourced, the non-
  digitised source classes named, and the tooling limits recorded so a future
  pass does not retry dead ends).
- Ticket 30 moved `open → claimed` (frontier bookkeeping).
- No content, code, golden, or ratchet change was made.
