# INC-4 — Admiral & Campaign Identity step

**What to build:** New screen (replacing INC-1's stub) capturing five
fields per [the assembled spec](../spec.md) §4: admiral name (free text,
required, trimmed, 60-char cap, placeholder "e.g. John Fisher"), campaign
name (free text, required, trimmed, 60-char cap, placeholder "e.g.
Britannia Ascendant"), naming convention (historical/generated/custom,
default historical), ship name reuse (allowed/disabled, default disabled),
measurement system (imperial/metric, default imperial). Values are captured
in draft state only — not sent to `compileCampaign`, no unit-conversion or
name-generation logic consumes them.

**Blocked by:** INC-1

**Status:** ready-for-agent

- [ ] All five fields render with the specified defaults
- [ ] Next is disabled until both admiral name and campaign name are
      non-empty after trimming
- [ ] The three enum fields never block progress (always have a valid
      default)
- [ ] Back returns to Archetype preserving its selection
- [ ] Field values are readable from draft state by later screens (INC-6's
      review) but are not part of the `compileCampaign` payload
- [ ] Component tests cover validation gating and default values
