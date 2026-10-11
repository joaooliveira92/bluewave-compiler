// Tests for scripts/run-gates.mjs — the bounded scheduler, dependency ordering,
// prerequisite skipping, and declaration-order results.
import assert from "node:assert/strict";
import { test } from "node:test";

import { runGates } from "../run-gates.mjs";

const passed = (gate) => ({ gate, status: "passed", durationMs: 0, output: "", code: 0 });

/** An executor that records concurrency and returns the configured status. */
function recordingExecutor(statusFor = {}) {
  const state = { active: 0, peak: 0, started: [] };
  const executor = async (gate) => {
    state.active += 1;
    state.peak = Math.max(state.peak, state.active);
    state.started.push(gate.id);
    await new Promise((resolveTick) => setImmediate(resolveTick));
    state.active -= 1;
    return statusFor[gate.id] === "failed"
      ? { gate, status: "failed", durationMs: 0, output: "", code: 1 }
      : passed(gate);
  };
  return { executor, state };
}

void test("runs independent gates concurrently up to the bound", async () => {
  const gates = ["a", "b", "c", "d"].map((id) => ({ id, label: id, args: [] }));
  const { executor, state } = recordingExecutor();
  const results = await runGates(gates, { concurrency: 2, timeoutMs: 1000, executor });
  assert.equal(results.length, 4);
  assert.ok(results.every((result) => result.status === "passed"));
  assert.ok(state.peak <= 2, `peak concurrency ${state.peak} exceeded the bound`);
});

void test("orders dependents after their prerequisites and skips on failure", async () => {
  const gates = [
    { id: "a", label: "a", args: [] },
    { id: "b", label: "b", args: [], needs: ["a"] },
    { id: "c", label: "c", args: [], needs: ["b"] },
  ];
  const { executor, state } = recordingExecutor({ a: "failed" });
  const results = await runGates(gates, { concurrency: 4, timeoutMs: 1000, executor });
  assert.deepEqual(state.started, ["a"], "only the root runs when it fails");
  assert.equal(results[0].status, "failed");
  assert.equal(results[1].status, "skipped");
  assert.equal(results[2].status, "skipped");
});

void test("a dependent runs after its prerequisite passes, in declaration order", async () => {
  const gates = [
    { id: "b", label: "b", args: [], needs: ["a"] },
    { id: "a", label: "a", args: [] },
  ];
  const { executor, state } = recordingExecutor();
  const results = await runGates(gates, { concurrency: 4, timeoutMs: 1000, executor });
  assert.ok(state.started.indexOf("a") < state.started.indexOf("b"));
  assert.deepEqual(
    results.map((result) => result.gate.id),
    ["b", "a"],
  );
});

void test("fail-fast skips not-yet-run independent gates", async () => {
  const gates = ["a", "b"].map((id) => ({ id, label: id, args: [] }));
  const { executor } = recordingExecutor({ a: "failed" });
  const results = await runGates(gates, {
    concurrency: 1,
    timeoutMs: 1000,
    failFast: true,
    executor,
  });
  assert.equal(results[0].status, "failed");
  assert.equal(results[1].status, "skipped");
});

void test("rejects a needs edge to an unknown gate", async () => {
  const gates = [{ id: "a", label: "a", args: [], needs: ["ghost"] }];
  await assert.rejects(
    () =>
      runGates(gates, { concurrency: 1, timeoutMs: 1000, executor: async (gate) => passed(gate) }),
    /unknown gate/u,
  );
});
