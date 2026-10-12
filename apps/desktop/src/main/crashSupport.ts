// Crash / error observability (release-readiness ticket 02, ADR-0133): a
// local-only support bundle. When the main or renderer process hits an
// uncaught error, we write a small, user-shareable JSON bundle beside the
// app's user data and tell the user where it is — never silently swallowing a
// failure, and never making a network call (reporting is opt-in only; nothing
// here sends anything anywhere).
//
// Pure policy, kept apart from `index.ts` like `shellPolicy.ts`, so the bundle
// shape and the crash wiring are unit-tested without launching Electron. The
// clock and log are injected; the bundle is not authoritative state and is
// allowed a wall-clock timestamp.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Result, Schema } from "effect";

export interface CrashContext {
  /** Where bundles are written (main passes `<userData>/support`). */
  readonly bundleDir: string;
  readonly appVersion: string;
  readonly platform: string;
  readonly arch: string;
  readonly processId: number;
  /** Injected so the filename/timestamp are deterministic under test. */
  readonly now: () => Date;
  /** Where "could not write the bundle" is reported (main passes console.error). */
  readonly log: (message: string) => void;
}

export interface CrashDetails {
  readonly message: string;
  readonly stack?: string;
}

export type CrashSource = "main" | "renderer";
/** Main-process failure kinds. */
export type MainCrashKind = "uncaughtException" | "unhandledRejection";
/** Renderer failure kinds (the DOM event vocabulary). */
export type RendererCrashKind = "window-error" | "unhandledrejection";
export type CrashKind = MainCrashKind | RendererCrashKind;

export interface CrashReport extends CrashDetails {
  readonly source: CrashSource;
  readonly kind: CrashKind;
  readonly appVersion: string;
  readonly platform: string;
  readonly arch: string;
  readonly processId: number;
  readonly timestamp: string;
  /** Set only for renderer reports: the kind the renderer classified it as. */
  readonly note: string;
}

function safeStringify(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

/** A best-effort `{message, stack}` from anything a crash handler can receive. */
export function detailsFromError(error: unknown): CrashDetails {
  if (error instanceof Error) {
    return error.stack !== undefined
      ? { message: error.message, stack: error.stack }
      : { message: error.message };
  }
  return { message: safeStringify(error) };
}

/** Filesystem-safe form of an ISO timestamp (`:` and `.` are unsafe on Windows). */
export function bundleFilename(timestamp: string, processId: number): string {
  return `crash-${timestamp.replace(/[.:]/gu, "-")}-${String(processId)}.json`;
}

export function buildCrashReport(
  source: CrashSource,
  kind: CrashKind,
  details: CrashDetails,
  ctx: Pick<CrashContext, "appVersion" | "platform" | "arch" | "processId" | "now">,
): CrashReport {
  const timestamp = ctx.now().toISOString();
  return {
    source,
    kind,
    message: details.message,
    ...(details.stack !== undefined ? { stack: details.stack } : {}),
    appVersion: ctx.appVersion,
    platform: ctx.platform,
    arch: ctx.arch,
    processId: ctx.processId,
    timestamp,
    note:
      "Local-only support bundle (ADR-0133). No network reporting; nothing is sent anywhere. " +
      "Share this file with a maintainer to report the failure.",
  };
}

/**
 * Build and write a support bundle. Returns the written path, or `null` when the
 * write itself failed (a crash handler must not crash): the failure is logged
 * through `ctx.log` so it is never hidden.
 */
export function captureCrash(
  source: CrashSource,
  kind: CrashKind,
  details: CrashDetails,
  ctx: CrashContext,
): string | null {
  const report = buildCrashReport(source, kind, details, ctx);
  const path = join(ctx.bundleDir, bundleFilename(report.timestamp, report.processId));
  try {
    mkdirSync(ctx.bundleDir, { recursive: true });
    writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    if (!existsSync(path)) throw new Error("bundle file was not created");
    return path;
  } catch (error) {
    ctx.log(`[crash] could not write the support bundle at ${path}: ${safeStringify(error)}`);
    return null;
  }
}

/** Only the parts of `EventEmitter` the installer uses, so tests can fake it. */
export interface CrashEmitter {
  on(event: string, listener: (...args: unknown[]) => void): unknown;
  off(event: string, listener: (...args: unknown[]) => void): unknown;
}

/**
 * Install `uncaughtException` / `unhandledRejection` handlers that capture a
 * bundle and then call `onFatal` (which must surface the failure and is expected
 * to quit). Returns an uninstall function. `emitter` defaults to the process and
 * is injectable for tests.
 */
export function installProcessCrashHandlers(
  ctx: CrashContext,
  onFatal: (error: unknown, bundlePath: string | null) => void,
  emitter: CrashEmitter = process,
): () => void {
  const onUncaught = (...args: unknown[]): void => {
    const error = args[0];
    const path = captureCrash("main", "uncaughtException", detailsFromError(error), ctx);
    onFatal(error, path);
  };
  const onRejection = (...args: unknown[]): void => {
    const reason = args[0];
    const path = captureCrash("main", "unhandledRejection", detailsFromError(reason), ctx);
    onFatal(reason, path);
  };
  emitter.on("uncaughtException", onUncaught);
  emitter.on("unhandledRejection", onRejection);
  return () => {
    emitter.off("uncaughtException", onUncaught);
    emitter.off("unhandledRejection", onRejection);
  };
}

/** The renderer's crash payload, validated at the IPC boundary (ENGINEERING-CONTRACT). */
export const RendererCrashInputSchema = Schema.Struct({
  kind: Schema.Literals(["window-error", "unhandledrejection"]),
  message: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(8_000)),
  stack: Schema.optional(Schema.String.check(Schema.isMaxLength(64_000))),
});

export interface RendererCrashInput {
  readonly kind: "window-error" | "unhandledrejection";
  readonly message: string;
  readonly stack?: string;
}

/** Decode a renderer crash payload; `null` when it is not the expected shape. */
export function parseRendererCrashInput(value: unknown): RendererCrashInput | null {
  const decoded = Schema.decodeUnknownResult(RendererCrashInputSchema)(value);
  return Result.isSuccess(decoded) ? decoded.success : null;
}
