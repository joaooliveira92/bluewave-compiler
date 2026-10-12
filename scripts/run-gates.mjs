// Bounded, dependency-aware runner for the `preflight` gate set (ADR-0107, D-6).
//
// The flat `&&` chain this replaces had no dependency graph, ran gates serially
// even when independent, and had no per-gate timeout. This runner schedules
// independent gates up to a concurrency bound, orders dependents behind their
// prerequisites (skipping a gate whose prerequisite failed), bounds each gate's
// runtime, and prints one stable summary. Output is captured per gate so parallel
// gates never interleave; a passing gate prints one line, a failing gate prints
// its captured output.
//
// It is deliberately small and data-driven: the gate table lives in GATE_SETS.

import { spawn } from "node:child_process";
import { availableParallelism } from "node:os";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const DEFAULT_TIMEOUT_MS = 180_000;

/** The `preflight` gate set. `needs` are gate ids that must pass first. */
export const GATE_SETS = {
  preflight: [
    { id: "git-state", label: "git state", args: ["scripts/preflight.cjs"] },
    {
      id: "single-copy-self-test",
      label: "single-copy guard self-test",
      needs: ["git-state"],
      args: ["scripts/assert-single-effect.mjs", "--self-test"],
    },
    {
      id: "single-copy",
      label: "effect single-copy",
      needs: ["single-copy-self-test"],
      args: ["scripts/assert-single-effect.mjs"],
    },
    {
      id: "runtime-free-self-test",
      label: "runtime-free guard self-test",
      needs: ["git-state"],
      args: ["scripts/assert-runtime-free.mjs", "--self-test"],
    },
    {
      id: "runtime-free",
      label: "runtime-free imports",
      needs: ["runtime-free-self-test"],
      args: ["scripts/assert-runtime-free.mjs"],
    },
    {
      id: "claude-skill-links",
      label: "claude skill links",
      needs: ["git-state"],
      args: ["scripts/link-claude-skills.mjs"],
    },
    { id: "docs", label: "docs hygiene", needs: ["git-state"], args: ["scripts/docs-check.cjs"] },
    {
      id: "doc-budgets",
      label: "doc budgets",
      needs: ["git-state"],
      args: ["scripts/verify-doc-budgets.mjs"],
    },
    {
      id: "dependency-policy",
      label: "dependency policy",
      needs: ["git-state"],
      args: ["scripts/verify-package-dependencies.mjs"],
    },
    {
      id: "unknown-casts",
      label: "no-new-unknown-casts",
      needs: ["git-state"],
      args: ["scripts/verify-no-unknown-casts.mjs"],
    },
    {
      id: "test-focus",
      label: "no focused/unexplained-skip tests",
      needs: ["git-state"],
      args: ["scripts/verify-test-focus.mjs"],
    },
    {
      id: "tracker-consistency",
      label: "tracker consistency",
      needs: ["git-state"],
      args: ["scripts/verify-tracker-consistency.mjs"],
    },
  ],
};

/** @typedef {{ id: string, label: string, args: string[], needs?: string[] }} Gate */
/** @typedef {"passed"|"failed"|"skipped"} GateStatus */
/** @typedef {{ gate: Gate, status: GateStatus, durationMs: number, output: string, code: number|null, error?: string }} GateResult */

function positiveIntFromEnv(name) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return undefined;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || String(parsed) !== raw) {
    throw new Error(`run-gates: ${name} must be a positive integer, got ${JSON.stringify(raw)}.`);
  }
  return parsed;
}

function defaultConcurrency(count) {
  return Math.max(1, Math.min(count, Math.max(2, availableParallelism())));
}

function skipped(gate, reason) {
  return { gate, status: "skipped", durationMs: 0, output: "", code: null, error: reason };
}

/**
 * Run one gate as a `node` child, bounded by a timeout.
 * @param {Gate} gate
 * @param {number} timeoutMs
 * @returns {Promise<GateResult>}
 */
export function spawnGate(gate, timeoutMs) {
  return new Promise((resolveResult) => {
    const startedAt = performance.now();
    const child = spawn(process.execPath, gate.args, {
      cwd: ROOT,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    child.stdout.on("data", (chunk) => (output += chunk.toString()));
    child.stderr.on("data", (chunk) => (output += chunk.toString()));
    const timer = setTimeout(() => child.kill("SIGKILL"), timeoutMs);
    child.on("error", (error) => {
      clearTimeout(timer);
      resolveResult({
        gate,
        status: "failed",
        durationMs: performance.now() - startedAt,
        output,
        code: null,
        error: error.message,
      });
    });
    child.on("close", (code, signal) => {
      clearTimeout(timer);
      const durationMs = performance.now() - startedAt;
      const status = signal === null && code === 0 ? "passed" : "failed";
      const error = signal !== null ? `killed by ${signal} (timeout ${timeoutMs}ms?)` : undefined;
      resolveResult({ gate, status, durationMs, output, code, error });
    });
  });
}

/**
 * Schedule gates with a bounded worker pool. A gate starts once every id in its
 * `needs` has a result; if any prerequisite did not pass (or fail-fast has
 * tripped), it is skipped rather than run.
 * @param {Gate[]} gates
 * @param {{ concurrency: number, timeoutMs: number, failFast?: boolean, executor?: (gate: Gate, timeoutMs: number) => Promise<GateResult>, observer?: (result: GateResult) => void }} options
 * @returns {Promise<GateResult[]>} results in declaration order.
 */
export async function runGates(gates, options) {
  const { concurrency, timeoutMs, failFast = false, executor = spawnGate, observer } = options;
  const byId = new Map(gates.map((gate) => [gate.id, gate]));
  for (const gate of gates) {
    for (const need of gate.needs ?? []) {
      if (!byId.has(need))
        throw new Error(`run-gates: gate "${gate.id}" needs unknown gate "${need}".`);
    }
  }

  const results = new Map();
  const pending = new Set(gates.map((gate) => gate.id));
  let active = 0;
  let failed = false;
  const parked = [];
  const unpark = () => {
    for (const resolveWait of parked.splice(0)) resolveWait();
  };

  const worker = async () => {
    while (pending.size > 0) {
      const id = [...pending].find((candidate) =>
        (byId.get(candidate).needs ?? []).every((need) => results.has(need)),
      );
      if (id === undefined) {
        if (active === 0) return; // no runnable gate and nothing running: cycle
        await new Promise((resolveWait) => parked.push(resolveWait));
        continue;
      }
      pending.delete(id);
      const gate = byId.get(id);
      const needsPassed = (gate.needs ?? []).every((need) => results.get(need).status === "passed");
      let result;
      if (!needsPassed) result = skipped(gate, "prerequisite failed");
      else if (failed && failFast) result = skipped(gate, "fail-fast");
      else {
        active += 1;
        result = await executor(gate, timeoutMs);
        active -= 1;
      }
      results.set(id, result);
      if (result.status === "failed") failed = true;
      if (observer !== undefined) observer(result);
      unpark();
    }
  };

  const workers = Math.min(Math.max(1, concurrency), gates.length);
  await Promise.all(Array.from({ length: workers }, () => worker()));
  for (const id of pending)
    results.set(id, skipped(byId.get(id), "unreachable (dependency cycle)"));
  return gates.map((gate) => results.get(gate.id));
}

function formatDuration(ms) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${Math.round(ms)}ms`;
}

function printResult(result) {
  const tag = result.status === "passed" ? "ok  " : result.status === "skipped" ? "skip" : "FAIL";
  process.stdout.write(
    `${tag} ${result.gate.label} (${formatDuration(result.durationMs)})${result.error ? ` — ${result.error}` : ""}\n`,
  );
  if (result.status === "failed" && result.output.trim() !== "") {
    process.stdout.write(`${result.output.replace(/\n?$/, "\n")}`);
  }
}

async function main() {
  const mode = process.argv[2] ?? "preflight";
  const gates = GATE_SETS[mode];
  if (gates === undefined) {
    process.stderr.write(
      `run-gates: unknown gate set "${mode}". Known: ${Object.keys(GATE_SETS).join(", ")}.\n`,
    );
    return 2;
  }
  const concurrency =
    positiveIntFromEnv("BLUEWAVE_GATE_CONCURRENCY") ?? defaultConcurrency(gates.length);
  const timeoutMs = positiveIntFromEnv("BLUEWAVE_GATE_TIMEOUT_MS") ?? DEFAULT_TIMEOUT_MS;
  const failFast = process.env.BLUEWAVE_GATE_FAIL_FAST === "1";
  process.stdout.write(
    `run-gates: ${mode} — ${gates.length} gate(s), concurrency ${concurrency}${failFast ? ", fail-fast" : ""}\n`,
  );
  const startedAt = performance.now();
  const results = await runGates(gates, {
    concurrency,
    timeoutMs,
    failFast,
    observer: printResult,
  });
  const passed = results.filter((result) => result.status === "passed").length;
  process.stdout.write(
    `run-gates: ${passed}/${results.length} passed in ${formatDuration(performance.now() - startedAt)}\n`,
  );
  return passed === results.length ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  try {
    process.exitCode = await main();
  } catch (error) {
    process.stderr.write(`run-gates: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
