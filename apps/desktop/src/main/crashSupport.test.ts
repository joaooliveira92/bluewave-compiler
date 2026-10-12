// Crash / error observability (release-readiness ticket 02, ADR-0133): the
// local-only support bundle. Forces a crash through the installed handlers and
// asserts a user-shareable bundle is produced; validates the renderer IPC
// boundary.
import { EventEmitter } from "node:events";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import {
  bundleFilename,
  captureCrash,
  detailsFromError,
  installProcessCrashHandlers,
  parseRendererCrashInput,
  type CrashContext,
  type CrashReport,
} from "./crashSupport.js";

let dir: string;
let logs: string[];
const FIXED = new Date("2026-10-12T12:00:00.000Z");

const context = (): CrashContext => ({
  bundleDir: dir,
  appVersion: "9.9.9",
  platform: "darwin",
  arch: "arm64",
  processId: 4242,
  now: () => FIXED,
  log: (message) => logs.push(message),
});

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "crash-support-"));
  logs = [];
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("support bundle (ADR-0133)", () => {
  it("writes a bundle carrying the crash message and app context", () => {
    const path = captureCrash(
      "main",
      "uncaughtException",
      detailsFromError(new Error("boom")),
      context(),
    );
    expect(path).not.toBeNull();
    expect(existsSync(path!)).toBe(true);
    const report = JSON.parse(readFileSync(path!, "utf8")) as CrashReport;
    expect(report.message).toBe("boom");
    expect(report.source).toBe("main");
    expect(report.kind).toBe("uncaughtException");
    expect(report.appVersion).toBe("9.9.9");
    expect(report.processId).toBe(4242);
    expect(report.timestamp).toBe(FIXED.toISOString());
    // Local-only: the report states no network reporting and points at the file.
    expect(report.note).toMatch(/no network/i);
  });

  it("returns null and logs (never throws) when the bundle cannot be written", () => {
    const bad: CrashContext = { ...context(), bundleDir: join(dir, "file-not-a-dir") };
    // Make the target path a file so mkdirSync fails.
    writeFileSync(bad.bundleDir, "x");
    const path = captureCrash("main", "uncaughtException", { message: "x" }, bad);
    expect(path).toBeNull();
    expect(logs.join("\n")).toMatch(/could not write the support bundle/);
  });

  it("frames uncaughtException and unhandledRejection through the installed handlers", () => {
    const emitter = new EventEmitter();
    const seen: Array<{ value: unknown; path: string | null }> = [];
    const uninstall = installProcessCrashHandlers(
      context(),
      (error, path) => seen.push({ value: error, path }),
      emitter,
    );

    const boom = new Error("uncaught!");
    emitter.emit("uncaughtException", boom);
    const rejection = new Error("rejected!");
    emitter.emit("unhandledRejection", rejection, Promise.resolve());

    expect(seen).toHaveLength(2);
    expect(seen[0]!.value).toBe(boom);
    expect(seen[1]!.value).toBe(rejection);
    for (const { path } of seen) {
      expect(path).not.toBeNull();
      expect(existsSync(path!)).toBe(true);
    }
    const second = JSON.parse(readFileSync(seen[1]!.path!, "utf8")) as CrashReport;
    expect(second.kind).toBe("unhandledRejection");
    expect(second.message).toBe("rejected!");

    uninstall();
    emitter.emit("uncaughtException", new Error("after uninstall"));
    expect(seen).toHaveLength(2);
  });

  it("derives timing-safe filenames and accepts non-Error throws", () => {
    expect(bundleFilename("2026-10-12T12:00:00.000Z", 7)).toBe(
      "crash-2026-10-12T12-00-00-000Z-7.json",
    );
    expect(detailsFromError("plain string").message).toBe("plain string");
    expect(detailsFromError({ a: 1 }).message).toBe('{"a":1}');
  });
});

describe("renderer crash IPC boundary", () => {
  it("accepts a well-formed payload and rejects malformed ones", () => {
    expect(parseRendererCrashInput({ kind: "window-error", message: "boom" })).toEqual({
      kind: "window-error",
      message: "boom",
    });
    expect(
      parseRendererCrashInput({ kind: "unhandledrejection", message: "x", stack: "s" }),
    ).toEqual({
      kind: "unhandledrejection",
      message: "x",
      stack: "s",
    });
    expect(parseRendererCrashInput({ kind: "nope", message: "x" })).toBeNull();
    expect(parseRendererCrashInput({ kind: "window-error", message: "" })).toBeNull();
    expect(parseRendererCrashInput(undefined)).toBeNull();
  });
});
