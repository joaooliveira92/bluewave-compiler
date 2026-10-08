**Type:** research
**Status:** resolved
**Blocked by:** none

## Question

Spec §18 (Determinism) of [01-diagnosis.md](../01-diagnosis.md).

No design decision needed — the doc's rule is unambiguous (no
`Math.random()`/`Date.now()`/`crypto.randomUUID()` in simulation-relevant
code; use named campaign RNG streams). The charting-session audit already
found this clean today in `packages/campaign`, `packages/campaign-engine`,
`packages/phase-engine` simulation code, and confirmed a real seeded-stream
abstraction exists (`packages/random`'s `RandomEngine.stream()` /
`RandomStream.next()`, backed by `seeded-prng.ts`, with a `RandomLedger`
recording `RandomDecision` entries; `rngAllowed` is already a first-class
flag per phase in `PhaseRegistry`).

Resolve via `/research` subagent:

1. Trace whether `RandomEngine.stream()` is actually **consumed** yet by
   research, diplomacy, or construction resolution code (the charting audit
   did not confirm this, only that the abstraction exists and is unused as
   far as it checked).
2. Enumerate which named RNG streams M2's new/touched subsystems need
   (research completion, diplomacy tension change, ship naming per §18.3's
   `CampaignRandomStream` union) and confirm each maps onto a real,
   distinct `RandomStream` domain — not a shared stream two subsystems
   would silently cross-contaminate.
3. Confirm stable-iteration requirements (§18.4) — grep for any collection
   ordering in touched code (research fields, diplomacy nations,
   construction projects) that relies on object insertion order, filesystem
   order, or similar non-deterministic ordering.
4. Report findings as this ticket's Answer — a short compliance table (spec
   area → RNG stream needed → currently wired? y/n) other tickets
   (particularly [Research allocation](./07-research-allocation.md) and
   [Diplomacy tension-threshold policy](./11-diplomacy-tension-threshold-policy.md))
   can cite directly.

## Answer

**1. `RandomEngine.stream()` consumption** — Already wired for research.
`packages/phase-engine/src/month.ts:505` draws a per-`(nation, field)` stream
keyed `research/month/${nationId}/${fieldId}` for weighted technology
selection, recorded to a `RandomLedger` with a `sha256Hex`-hashed input for
determinism. `PhaseGuard.rng(phaseId, seed)` (`phase-guard.ts:193`) is the
only sanctioned way a phase obtains a `RandomEngine`, gated by each phase's
`rngAllowed` flag. No `stream(` call exists anywhere for diplomacy,
construction, or ship naming.

**2. Streams needed vs. wired** — `RandomEngine.stream(domain: string)`
takes a free-form string domain (not an enum), so any of the doc's §18.3
`CampaignRandomStream` names are trivially expressible as a domain string
following the `area/scope/...ids` convention research already established
(`research/month/{nation}/{field}`). But **phase-level gating is the real
constraint, not the API**: `PhaseRegistry.PHASES` currently sets
`rngAllowed: true` only on `weather_generation`, `ai_planning`,
`resolve_research`, `battle_generation`, and `battle_resolution` (registry.ts).
`resolve_diplomacy` (order 6.5) and `construction_processing` (order 6) are
both `rngAllowed: false` today — diplomacy's monthly tension change and any
construction randomness are currently phase-gated to be **deterministic/
rule-based only**, not just "unwired." If M2's diplomacy resolution (§13.4)
needs bounded randomness, that's a `PhaseRegistry` change (flip
`resolve_diplomacy.rngAllowed` to `true`), not just adding a stream call —
flag this to [Diplomacy tension-threshold policy](./11-diplomacy-tension-threshold-policy.md)
and [Foreign Relations page](./12-foreign-relations-page.md) as a real,
small engine change if their design needs it. No phase exists for ship
naming at all (naming isn't part of `PhaseRegistry`, consistent with it
being a construction-order-time UI concern, not a monthly-resolution one).

**3. Stable iteration** — Spot-checked `packages/campaign-engine/src/diplomacy.ts`,
`research.ts`, and `packages/campaign/src/state.ts` for `for...in`,
`Object.keys(`, `.entries()` iteration patterns that would leak
insertion/Map order into results: no hits. Not a full audit of every
touched file, but no immediate violation found in the core domain modules.

**Compliance table**

| Spec area | RNG stream needed | Currently wired? |
|---|---|---|
| Research completion (§10.6) | `research/month/{nation}/{field}` | **Yes** — real, ledgered, `rngAllowed: true` |
| Diplomacy tension change (§13.4) | e.g. `diplomacy/month/{nation}` | **No** — `resolve_diplomacy` phase is `rngAllowed: false`; needs a registry change if randomness is actually required |
| Ship naming (§12.6 generated fallback) | e.g. `naming/{campaignId}/{seq}` | **No** — no phase-engine involvement at all; naming happens at construction-order time (UI/application layer), not monthly resolution — a stream can be wired there directly without touching `PhaseRegistry` |
| Construction resolution (§12.8) | none currently specified by the doc | **No** — `construction_processing` is `rngAllowed: false`; doc's resolution steps are deterministic, consistent with this |

**Summary**: RNG infrastructure is real and already load-bearing for research;
the pattern (keyed domain string + `RandomLedger` recording) is the one to
replicate. The one real risk for M2 is diplomacy — if tension-change
randomness is wanted, it requires a deliberate, tracked `PhaseRegistry`
change (flip one flag), not silent addition of a stream call that the guard
would then reject.
