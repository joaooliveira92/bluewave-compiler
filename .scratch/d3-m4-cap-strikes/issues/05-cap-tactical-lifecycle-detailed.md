## Question

What is the full CAP (Combat Air Patrol) lifecycle within a tactical battle? From the moment a CAP squadron is assigned to a patrol station, through detection of incoming threats, interception, engagement, and recovery/reassignment.

DESIGN-43 defines:
- CAP as a fighter mission role (§23) requiring air-to-air armament, controller or patrol policy
- Squadron mission eligibility predicates (§33)
- Aircraft availability calculation (§34)

DESIGN-44 defines:
- Alert CAP prep time: 5 minutes (§14)
- CAP as a deck-cycle state (§11)
- CAP in contention priority (§12)
- Recovery priority includes CAP (§26)

But the tactical minute-by-minute execution of CAP is not defined in either doc. Open questions:
1. How is a CAP patrol represented in the tactical state? A geolocated station/race track pattern around the carrier/formation?
2. Detection range of CAP vs incoming strikes — does CAP use the existing spotting/sensor model (B-2, DESIGN-38) or a dedicated air-search model?
3. Interception timing: when an incoming strike is detected, how many minutes does the CAP need to intercept before the strike attacks? Does it depend on relative speed, altitude, vector geometry?
4. How many CAP aircraft can intercept a strike formation? Limited by numerical advantage, doctrine, fuel?
5. What happens after engagement: CAP returns to station, returns to carrier, or continues? Fuel limits?
6. Does CAP consume RNG for patrol (random detection) or only for engagement (interception outcome)?

Deliverable: proposed CAP tactical lifecycle — states, transitions, timing rules, detection and interception formulas, fuel consumption model. Identify where this touches existing code (spotting in B-2, carrier operations in D-2).