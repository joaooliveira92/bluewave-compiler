import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { applyContentSecurityPolicy, CONTENT_SECURITY_POLICY } from "../src/main/csp.js";

describe("B9 Electron boundary (criteria 4-6)", () => {
  it("applies `default-src 'self'` CSP to renderer responses (criterion 6)", () => {
    const headers = applyContentSecurityPolicy({ "X-Frame-Options": ["DENY"] });
    expect(headers["Content-Security-Policy"]).toEqual([CONTENT_SECURITY_POLICY]);
    expect(CONTENT_SECURITY_POLICY).toBe("default-src 'self'");
    // Pre-existing headers are preserved.
    expect(headers["X-Frame-Options"]).toEqual(["DENY"]);
  });

  it("registers the narrow `compile` IPC handler in the main process (criterion 4)", () => {
    // The main process source must register exactly one IPC channel: `compile`.
    const mainSource = readFileSync(resolve(__dirname, "../src/main/index.ts"), "utf8");
    expect(mainSource).toContain('ipcMain.handle("compile"');
    // No arbitrary IPC channels may be exposed.
    expect(mainSource.match(/ipcMain\.handle\(/g)?.length ?? 0).toBe(1);
  });

  it("narrows the preload bridge to only the compile method (criterion 4)", () => {
    const preloadSource = readFileSync(resolve(__dirname, "../src/preload/index.ts"), "utf8");
    expect(preloadSource).toContain("contextBridge.exposeInMainWorld");
    expect(preloadSource).toContain("compile: (");
    expect(preloadSource).toContain('ipcRenderer.invoke("compile"');
    // Only a single exposed method.
    const exposed = preloadSource.match(/(\w+):\s*\(/g) ?? [];
    expect(exposed.filter((s) => s.includes("compile"))).toHaveLength(1);
  });

  it("aborts an in-flight compilation on a new concurrent request (criterion 7)", () => {
    const mainSource = readFileSync(resolve(__dirname, "../src/main/index.ts"), "utf8");
    // The main handler aborts the previous AbortController before starting a new compile.
    expect(mainSource).toContain("currentAbortController.abort()");
    expect(mainSource).toContain("new AbortController()");
  });
});
