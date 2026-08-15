# Weather Progression & Records

- **Type:** grilling
- **Status:** resolved

## Question

How does tactical weather progress during a battle? What is the interval and
transition model? What does the weather event record contain? How are weather
events ordered in the canonical event order?

## Answer

**Progression** (§4): exactly 30 tactical minutes. At each interval, the engine
transitions precipitation, fog, cloud cover, wind, and visibility through the
climate profile's declared transition table and keyed stream
`battle/weather/interval`. Sea state changes by at most 1 level per interval.
Wind direction changes by at most one climate transition band. Each transition
creates a `WeatherEventRecord`.

**WeatherEventRecord** (§28): battle minute/substep, source/affected participants,
canonical inputs, formulas and multipliers, command/inventory references, RNG
decisions, pre/post state hashes, ruleset/formula versions, record hash.

**Canonical ordering** (§29): weather transitions by minute and weather-component
priority, then weather commands by canonical tactical-command order, then
observation rays by observer/target, then fire rays by shooter/battery/salvo/target.

Emitted via `BattleLedger`+`canonicalEventOrder`. Two-process determinism proof
required (AC-14).