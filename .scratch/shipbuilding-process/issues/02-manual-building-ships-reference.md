# 02: Manual building-ships reference

**Type:** research
**Status:** resolved
**Blocked by:** none

## Question

Produce a citable reference of the BUILDING SHIPS process in `docs/manual.pdf` (printed p30–33,
including the rebuilding, docks, shipyard-capacity, submarine and coastal-artillery passages in
that span), so the build-phase decisions can be grounded in the manual's exact rules.

Capture, with exact manual wording and page:

- build time determinants and the efficient/undeveloped shipbuilding-industry modifier;
- payment in monthly instalments during build time;
- temporary halting (cost = half mothballed maintenance) and the delayed-ship rule (monthly
  build cost not deducted);
- acceleration (a limited number of ships, 10% faster, 5% cost increase, risk of delaying others);
- the build dialog: ordering up to 12 ships of one class laid down, with automatically assigned names;
- the rebuild action list and its conditions (main-armament swaps, secondary/tertiary battery
  changes, machinery swap, fire-control improvement, bulges with speed penalty, +1" deck armour,
  conning-tower removal, upper-belt change, CV/CVL conversion, type reclassification);
- docks (dock size as the build/operate ceiling, one year to build, +1000–2000 t per step by
  period, occasional private-shipbuilding auto-increase, capacity multiplier);
- shipyard capacity (multiple of dock size, total tonnage under construction, rebuilds/AMC/
  corvettes excluded, submarines counted); and
- foreign yards (limited by the building nation's dock size, impound risk by tension, treaty
  guarantees delivery, technology-insight advantage).

Write the reference under `docs/research/`, cite manual page numbers, and report the artifact
path back on this ticket.

## Answer

Resolved 2026-10-12. Artifact: `docs/research/manual-building-ships-rules.md` (topic-by-topic,
each item cited to its page).

Grounded rules: build time depends on ship type, modified by an efficient/undeveloped
shipbuilding industry (no magnitude given); cost is paid in monthly instalments over the build
time; halted ships carry half the mothballed maintenance cost; a delayed ship's monthly build cost
is not deducted; acceleration is limited to some number of ships, builds 10% faster at +5% cost
and risks delaying other ships; the build dialog orders up to 12 ships of one class with
auto-assigned names; rebuilds permit the listed armament/machinery/FC/bulge/deck/conning-tower/
upper-belt edits and CV/CVL conversion, with suggested-or-mandatory reclassification; docks cap
build/operate size and set capacity (one year per step, +1000–2000 t by period, occasional private
auto-increase); shipyard capacity is a multiple of dock size, excludes rebuilds/AMC/small corvettes,
and counts submarines; foreign yards are capped by the builder's dock size with tension-scaled
impoundment, treaty-guaranteed delivery and a tech-insight advantage; submarines are standardised
(not designed) and coastal artillery uses predefined types in a specific possession.

Flagged BALANCE TARGET / deferred (no number in the manual): industry-modifier magnitude,
ship-type build-time table, acceleration ship count, dock→capacity multiplier, private
auto-increase chance, tension→impoundment probability, and the mothballed-maintenance cost base.
