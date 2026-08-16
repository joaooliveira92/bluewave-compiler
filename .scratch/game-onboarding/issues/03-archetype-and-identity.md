# Archetype re-skin + Admiral/Campaign Identity step

**Type:** grilling
**Status:** resolved
**Blocked by:** none

## Question

Spec two adjacent steps:

1. **Archetype re-skin** — the existing 3-dimension (Economy/Industry/Combat)
   allocation screen (`NewGameArchetypeScreen.tsx`, `archetype-consequence.ts`)
   keeps its engine model as-is; decide what doc-flavored presentation layers
   on top (e.g. named presets like "The Naval Reformer") without changing the
   underlying dimensions or effects.
2. **Admiral & Campaign Identity** — a new short step (does not exist in any
   form today) capturing: admiral name, campaign name, naming convention
   (historical/generated/custom), ship-name reuse (allowed/disabled),
   measurement system (imperial/metric). Spec these as captured settings
   shown later in the commissioning review — do NOT spec the app-wide unit
   conversion or generated-naming logic that would consume them (out of
   scope, see map).

Cover where in the flow this identity step sits (between Archetype and
Commissioning Review) and its minimal input/validation requirements.

## Answer

**Part 1 — Archetype re-skin: no changes.** `packages/campaign-engine/src/archetype.ts`
already ships three named, tagged, described presets (Merchant Prince /
Shipyard Baron / Grand Admiral) wired into `NewGameArchetypeScreen.tsx` with a
consequence panel showing real numeric effects. That already satisfies "doc
flavor layers on top of the unchanged Economy/Industry/Combat model" — no new
copy, no 4th preset, no screen changes. This part of the ticket resolves by
pointing at existing code.

**Part 2 — Admiral & Campaign Identity, new step:**

Fields:
- **Admiral name** — free text, required (non-empty, trimmed), 60-char cap,
  placeholder `"e.g. John Fisher"`. No auto-generated default.
- **Campaign name** — free text, required (non-empty, trimmed), 60-char cap,
  placeholder `"e.g. Britannia Ascendant"`. No auto-generated default.
- **Naming convention** — `namingConvention: "historical" | "generated" | "custom"`,
  default `"historical"`.
- **Ship name reuse** — `shipNameReuse: "allowed" | "disabled"`, default
  `"disabled"`.
- **Measurement system** — `measurementSystem: "imperial" | "metric"`, default
  `"imperial"`.

These three enum ids are new UI-only concepts — no engine setting ids back
them (confirmed: no ship-naming data, generator, or measurement-system code
exists anywhere in the repo). They're captured in draft state and displayed
later in the commissioning review; they are **not** sent to `compileCampaign`
and no unit-conversion or name-generation logic consumes them (already ruled
out of scope on the map).

**Validation**: "Next" is disabled until both admiral name and campaign name
are non-empty (post-trim). The three enum fields always have a valid default,
so they never block progress.

**Flow position**: sits immediately after Archetype, before Commissioning
Review — a single static-position step, no branching. Back returns to
Archetype preserving its selection; Next goes to Commissioning Review.
Absolute placement relative to Nation Confirmation / Preferences / Fleet
Method stays deferred to final spec assembly, per the precedent set by
[Nation confirmation screen](./01-nation-confirmation.md).
