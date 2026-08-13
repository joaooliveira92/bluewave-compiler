import { describe, it, expect } from "vite-plus/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  applyContentSecurityPolicy,
  CONTENT_SECURITY_POLICY,
  DEV_CONTENT_SECURITY_POLICY,
} from "../src/main/csp.js";

describe("B9 Electron boundary (criteria 4-6)", () => {
  it("applies `default-src 'self'` CSP to renderer responses (criterion 6)", () => {
    const headers = applyContentSecurityPolicy({ "X-Frame-Options": ["DENY"] });
    expect(headers["Content-Security-Policy"]).toEqual([CONTENT_SECURITY_POLICY]);
    expect(CONTENT_SECURITY_POLICY).toBe("default-src 'self'");
    // Pre-existing headers are preserved.
    expect(headers["X-Frame-Options"]).toEqual(["DENY"]);
  });

  it("defaults to the strict CSP when isDev is omitted", () => {
    const headers = applyContentSecurityPolicy({});
    expect(headers["Content-Security-Policy"]).toEqual([CONTENT_SECURITY_POLICY]);
  });

  it("relaxes CSP only for the dev server origin when isDev is true, never in production", () => {
    const headers = applyContentSecurityPolicy({}, true);
    expect(headers["Content-Security-Policy"]).toEqual([DEV_CONTENT_SECURITY_POLICY]);
    // The relaxation is scoped to Vite's dev server, not a blanket unsafe-inline/eval grant.
    expect(DEV_CONTENT_SECURITY_POLICY).toContain("http://localhost:5173");
    expect(DEV_CONTENT_SECURITY_POLICY).not.toBe(CONTENT_SECURITY_POLICY);

    const prodHeaders = applyContentSecurityPolicy({}, false);
    expect(prodHeaders["Content-Security-Policy"]).toEqual([CONTENT_SECURITY_POLICY]);
  });

  it("registers only the allow-listed IPC handlers in the main process (criterion 4)", () => {
    // The main process source must register exactly the allow-listed channels.
    const mainSource = readFileSync(resolve(__dirname, "../src/main/index.ts"), "utf8");
    const allowed = [
      'ipcMain.handle("compile"',
      'ipcMain.handle("project:open"',
      'ipcMain.handle("project:new"',
      'ipcMain.handle("project:save"',
      'ipcMain.handle("project:save-as"',
      'ipcMain.handle("campaign:load-save"',
    ];
    for (const handler of allowed) {
      expect(mainSource).toContain(handler);
    }
    // No IPC channels beyond the allow-list may be registered.
    const registered = mainSource.match(/ipcMain\.handle\("[^"]+"/g) ?? [];
    expect(registered.length).toBe(allowed.length);
  });

  it("narrows the preload bridge to only the allow-listed methods (criterion 4)", () => {
    const preloadSource = readFileSync(resolve(__dirname, "../src/preload/index.ts"), "utf8");
    expect(preloadSource).toContain("contextBridge.exposeInMainWorld");
    const exposed = preloadSource.match(/([a-zA-Z]+):\s*\(/g) ?? [];
    const allowed = [
      "compile:",
      "openProject:",
      "newProject:",
      "saveProject:",
      "saveProjectAs:",
      "loadCampaignSave:",
    ];
    expect(exposed.length).toBe(allowed.length);
    for (const method of allowed) {
      expect(exposed.some((s) => s.startsWith(method))).toBe(true);
    }
  });

  it("aborts an in-flight compilation on a new concurrent request (criterion 7)", () => {
    const mainSource = readFileSync(resolve(__dirname, "../src/main/index.ts"), "utf8");
    // The main handler aborts the previous AbortController before starting a new compile.
    expect(mainSource).toContain("currentAbortController.abort()");
    expect(mainSource).toContain("new AbortController()");
  });
});
