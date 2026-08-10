# DESIGN-44: Carrier Operations

> **Canonical status:** Normative migration of `SOURCE-DESIGN-v1.0.md` v1.0.
> **Requirement language:** Existing source wording is preserved. Where the source uses mandatory language, it is normative. Ambiguities are tracked in `docs/OPEN-ISSUES.md`; implementations MUST NOT invent unresolved behavior.
> **Stable document ID:** `DESIGN-44`

Carrier State:

- Aircraft capacity.
- Spot value.
- Deck state.
- Catapults.
- Lifts.
- Flight-deck condition.
- Hangar condition.
- Ordnance.
- Assigned air group.

Carrier Capacity:

- CVL: 4–34 aircraft.
- CV: above 34 aircraft.
- Carriers above 100 aircraft suffer reduced operating efficiency and increased
  cost.
- Jet aircraft may consume 1.5 capacity according to type and carrier size.
- Capacity rounding is deterministic per aircraft assignment.

Spot Value:

- Normally approximately half aircraft capacity.
- Modified by:
  - catapults;
  - speed;
  - deck configuration;
  - damage;
  - technology.
- Carriers below 24 knots have reduced spot value.

Jet Capability:

- Normally requires:
  - 40,000 tons;
  - or 30,000 tons with steam catapults.
- Heavy jets require jet-capable carriers.
- Angled deck is required for applicable heavy-jet operations.

Deck-Cycle States:

- unready
- readying
- spotting
- spotted
- launching
- forming
- airborne
- returning
- holding
- landing
- refueling
- rearming
- struck_down

Deck Contention:

- CAP, search, strike launch, and recovery compete for deck operations.
- Maximum simultaneous operations depend on technology and carrier layout.

Strike:

- Origin.
- Target report.
- Aircraft allocation.
- Escort.
- Loadout.
- Coordination.
- Timing.
- Fuel.
- Mission state.

Strike Timing:

- Spot and launch normally requires approximately 20–30 minutes.
- Coordinated strikes take longer but improve survival and cohesion.
- A strike larger than current spot value cannot launch.

Carrier Maneuver:

- Automatically turns into wind and uses required speed for launch or recovery.
- Player cannot issue conflicting maneuver orders during mandatory deck
  operations.

Vulnerability:

- Fueled and armed aircraft increase fire and explosion risk.
- Night recovery causes severe operational-loss risk.
- Weather may suspend operations.

Ordnance:

- Aircraft torpedoes.
- Guided bombs.
- Anti-ship missiles.
- Unused weapons from stood-down aircraft return to storage.
- Jettisoned airborne weapons are lost.
