import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Repo root is one level up from this `scripts/` directory.
export const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));

// Node's on-disk compile cache stores the V8 bytecode of Vitest's own modules
// and the externalized dependencies, so later runs skip recompiling them. It is
// only worth enabling when the directory survives between runs: local
// development, and CI pipelines that restore it (quality.yml). Vitest
// propagates `NODE_COMPILE_CACHE` to every worker and disables it automatically
// when the `v8` coverage provider is active (bytecode loses the source
// positions precise coverage needs).
if (!process.env.NODE_COMPILE_CACHE) {
  process.env.NODE_COMPILE_CACHE = join(repoRoot, "node_modules", ".cache", "node-compile-cache");
}

// Shared Vitest defaults for every workspace project. `fsModuleCache` persists
// the transform cache to disk so a rerun over a large module graph skips the
// transform phase (the in-memory watch cache is otherwise discarded once a run
// finishes). It is `false` in the installed vitest and `true` upstream from
// 5.0.4, so set it explicitly to pin the behaviour.
export const sharedTestConfig = {
  fsModuleCache: true,
};
