# Decision 02: Scope boundary — damage-control extension

## Question

What vertical slice of DESIGN-41 remainder (detailed damage control beyond B-4) should C-5 deliver alongside the smoke module?

## Options

**A. Fire + flooding + damage-control resources.** Ship: fire state/resolution (§19-22, §24-25), flooding state/resolution (§13-18), damage-control resources + priority (§27-28). This extends B-4's creation-only fire/flooding into full per-minute resolution. Fire smoke (§25) couples with the smoke module. ~8-10 files.

**B. Flooding only.** Ship only flooding state + control (§13-18). Defer fire propagation to a later sprint.

**C. Full DESIGN-41 remainder.** Ship everything B-4 deferred: secondary hazards (§10-11), flooding (§13-18), fire (§19-25), aluminum (§26), damage control (§27-28), terminal states (§29-43), persistence (§44), records/ordering (§45-48). ~25-30 files — equals a whole M2 track by itself.

## Decision

**Option A.** Fire propagation + flooding resolution + damage-control resources (§§13-22, §24-25, §27-28). This is the natural companion to the smoke module (fire smoke coupling) and extends the existing B-4 pipeline stages 5-8 to full per-minute operation. The total is manageable (~18 files combined with smoke). Deferred: full secondary hazards beyond fire/flooding (§10-11), aluminum superstructure (§26), full terminal state machine (§29-43), survivors/rescue (§34-43), post-battle adjudication (§38).