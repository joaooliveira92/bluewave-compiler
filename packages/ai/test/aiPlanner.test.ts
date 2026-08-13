import { describe, it, expect, vi } from "vite-plus/test";
import { SafeInt } from "@bluewave/contracts";
import { canonicalSerialize, sha256Hex } from "@bluewave/deterministic";

import { createDeterministicEngine } from "@bluewave/random"; // adapt to your factory

function snap(overrides: Partial<any> = {}) {
  const base = {
    campaignId: "c1",
    turnNumber: SafeInt(10) as SafeInt,
    nations: new Map([
      [
        "usa",
        {
          treasury: SafeInt(100) as SafeInt,
          constructionProjects: [
            { id: "b", totalWork: SafeInt(50) as SafeInt, completedWork: SafeInt(0) as SafeInt, status: "ACTIVE" },
            { id: "a", totalWork: SafeInt(50) as SafeInt, completedWork: SafeInt(0) as SafeInt, status: "ACTIVE" },
          ],
        },
      ],
    ]),
    ...overrides,
  };
  return base as any;
}

describe("AiPlanner", () => {
  it("picks project deterministically sorted by id", () => {
    const engine = createDeterministicEngine("seed");
    const lifecycle = { process: vi.fn(() => ({ type: "success" })) } as any;
    const planner = new AiPlanner();
    const r1 = planner.generate(snap(), engine, lifecycle, { nationId: "usa", type: "AI" } as any, new Map());
    const engine2 = createDeterministicEngine("seed");
    const r2 = planner.generate(snap(), engine2, lifecycle, { nationId: "usa", type: "AI" } as any, new Map());
    expect(r1.envelopes.map((e) => e.body)).toEqual(r2.envelopes.map((e) => e.body));
    // legal sorted => with same seed, chosen project is deterministic regardless of insertion order
    const snapReversed = snap({
      nations: new Map([
        [
          "usa",
          {
            treasury: SafeInt(100) as SafeInt,
            constructionProjects: [
              { id: "a", totalWork: SafeInt(50) as SafeInt, completedWork: SafeInt(0) as SafeInt, status: "ACTIVE" },
              { id: "b", totalWork: SafeInt(50) as SafeInt, completedWork: SafeInt(0) as SafeInt, status: "ACTIVE" },
            ],
          },
        ],
      ]),
    });
    const r3 = planner.generate(snapReversed, createDeterministicEngine("seed"), lifecycle, { nationId: "usa", type: "AI" } as any, new Map());
    expect(r1.envelopes[0]!.body).toEqual(r3.envelopes[0]!.body);
  });

  it("returns diagnostic when nation missing", () => {
    const planner = new AiPlanner();
    const res = planner.generate(snap(), createDeterministicEngine("s"), { process: vi.fn() } as any, { nationId: "missing", type: "AI" } as any, new Map());
    expect(res.diagnostics[0]!.code).toBe("AI_NATION_MISSING");
    expect(res.accepted.length).toBe(0);
  });

  it("no budget command when treasury negative or no legal projects", () => {
    const planner = new AiPlanner();
    const s = snap({
      nations: new Map([
        ["usa", { treasury: SafeInt(-5) as SafeInt, constructionProjects: [{ id: "a", totalWork: SafeInt(10) as SafeInt, completedWork: SafeInt(0) as SafeInt, status: "ACTIVE" }] }],
      ]),
    });
    const res = planner.generate(s, createDeterministicEngine("s"), { process: vi.fn(() => ({ type: "success" })) } as any, { nationId: "usa", type: "AI" } as any, new Map());
    expect(res.envelopes.filter((e) => (e.body as any).type === "budget_project").length).toBe(0);
  });

  it("research highCount clamped and uses integer RNG", () => {
    const planner = new AiPlanner();
    const lifecycle = { process: vi.fn(() => ({ type: "success" })) } as any;
    const res = planner.generate(snap(), createDeterministicEngine("seed2"), lifecycle, { nationId: "usa", type: "AI" } as any, new Map());
    const research = res.envelopes.find((e) => (e.body as any).type === "SetResearchPriority")!;
    expect(research).toBeDefined();
    const priorities = (research.body as any).fieldPriorities;
    const highCount = Object.values(priorities).filter((v) => v === 2).length; // HIGH=2 per content-schema
    expect(highCount).toBeGreaterThanOrEqual(1);
    expect(highCount).toBeLessThanOrEqual(3); // MAX_HIGH_PRIORITY_FIELDS
  });

  it("handles all lifecycle rejections as diagnostics", () => {
    const planner = new AiPlanner();
    const diag = { code: "STALE_SNAPSHOT_HASH", severity: "error", stage: "ai_planning", message: "stale", entityId: "usa" };
    const lifecycle = { process: vi.fn(() => ({ type: "stale_snapshot", diagnostic: diag })) } as any;
    const res = planner.generate(snap(), createDeterministicEngine("s"), lifecycle, { nationId: "usa", type: "AI" } as any, new Map());
    expect(res.accepted.length).toBe(0);
    expect(res.diagnostics.length).toBe(2); // budget + research both rejected
  });

  it("stream key encodes nationId with colon", () => {
    const engine = { stream: vi.fn(() => ({ next: () => 0.5 } as any)) } as any;
    // need drawUniform mock
    const planner = new AiPlanner();
    const s = snap();
    // nationId with colon should be encoded
    planner.generate(s, engine, { process: () => ({ type: "success" }) } as any, { nationId: "a:b", type: "AI" } as any, new Map());
    expect(engine.stream).toHaveBeenCalledWith(expect.stringContaining(encodeURIComponent("a:b")));
  });

  it("never mutates snapshot", () => {
    const s = snap();
    const before = canonicalSerialize(s);
    const planner = new AiPlanner();
    planner.generate(s, createDeterministicEngine("x"), { process: () => ({ type: "success" }) } as any, { nationId: "usa", type: "AI" } as any, new Map());
    expect(canonicalSerialize(s)).toBe(before);
  });
});
