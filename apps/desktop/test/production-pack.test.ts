import { describe, it, expect } from "vitest";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runCompilation } from "../src/main/compiler.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../..");
const PRODUCTION_PACK = resolve(REPO_ROOT, "content", "production", "1880");

describe("production pack (content/production/1880)", () => {
  it("compiles deterministically through the desktop path with zero diagnostics", () => {
    const signal = new AbortController().signal;
    const result = runCompilation(PRODUCTION_PACK, signal);

    expect(result.success).toBe(true);
    expect(result.diagnostics).toEqual([]);
    expect(result.snapshotHash).toBeDefined();
    expect(result.contentArtifactHash).toBeDefined();

    const nations = result.nations ?? [];
    expect(nations.length).toBe(14);
    expect(nations.some((n) => n.id === "GBR")).toBe(true);
    expect(nations.some((n) => n.id === "FRA")).toBe(true);
    expect(nations.some((n) => n.id === "CHI")).toBe(true);

    // Determinism: a second compile produces identical hashes.
    const second = runCompilation(PRODUCTION_PACK, signal);
    expect(second.snapshotHash).toBe(result.snapshotHash);
    expect(second.contentArtifactHash).toBe(result.contentArtifactHash);
  });
});
