# Nation strip, intel bars and relations

**Type:** grilling
**Status:** resolved
**Blocked by:** 01, 02

## Question
RTW3's right column shows each major power's flag, an intel bar, an Intel level +/- control, Almanac, Intel reports, All relations. The engine has no intel state. What do we show now (relations/war status from Diplomacy, strength?), what is the deferred shape, and where do Almanac and All relations live?

## Answer

Owner asked the orchestrator to proceed (2026-10-08); decided by the orchestrator. The right rail lists the major powers in the campaign (player pinned first): flag/name, relation to the player (peace, pact, alliance, war, blockade) and war score where at war, all from the existing Diplomacy/relations inspect views. Selecting a nation opens the existing nation drawer. **Intel bars, Intel level +/- and Intel reports are deferred** ("Not yet modelled", the engine has an empty `IntelligenceState`); no placeholder bars. **All relations** opens the Diplomacy & War screen (relations matrix lives there). **Almanac** is deferred v1 (static content, no engine state; a later content ticket).
