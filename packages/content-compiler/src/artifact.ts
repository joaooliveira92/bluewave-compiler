//packages/content-compiler/src/artifact.ts
import { mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { canonicalSerialize, createEnvelope, verifyEnvelope } from "@bluewave/deterministic";
import type { DiagnosticCollector } from "@bluewave/diagnostics";

import { Compiler } from "./compiler.js";
import type { CompilerInput, ContentBundle } from "./index.js";
import { BUNDLE_GENERATED_BY } from "./stages/compile.js";

/**
 * The generated content bundle: one deterministic, inert, hash-pinned artifact
 * (ADR-0122) covering the content-pack collections and the ship-building
 * catalogue, plus a manifest carrying the semantic content version and the
 * SHA-256 body hash. Both the compiler CLI and the desktop main process read
 * this contract so the "what CI validated" and "what the app runs" identity
 * cannot drift.
 */
export const CONTENT_BUNDLE_ARTIFACT_KIND = "content-bundle";
export const CONTENT_BUNDLE_COMPATIBILITY_VERSION = "0.1.0";
export const CONTENT_BUNDLE_MANIFEST_VERSION = 1;
export const CONTENT_ARTIFACT_FILENAME = "content-artifact.json";
export const CONTENT_MANIFEST_FILENAME = "content-manifest.json";

export interface ContentBundleManifest {
  readonly manifestVersion: number;
  readonly doNotEdit: string;
  readonly contentVersion: string;
  readonly artifactKind: string;
  readonly compatibilityVersion: string;
  readonly algorithm: string;
  readonly bodyHash: string;
  readonly bodyLength: number;
}

export interface ContentBundleArtifact {
  readonly bundle: ContentBundle;
  readonly envelope: {
    readonly algorithm: string;
    readonly artifactKind: string;
    readonly compatibilityVersion: string;
    readonly bodyHash: string;
    readonly bodyLength: number;
  };
  readonly manifest: ContentBundleManifest;
  readonly contentVersion: string;
  /** Canonical serialization of `bundle` — exactly the bytes written to disk. */
  readonly artifactJson: string;
  /** Canonical serialization of `manifest` — exactly the bytes written to disk. */
  readonly manifestJson: string;
}

/** The minimum shape a generated bundle must have for verification. */
export interface ContentBundleLike {
  readonly generatedBy: string;
  readonly [key: string]: unknown;
}

export type ContentBundleVerification =
  | {
      readonly ok: true;
      readonly bundle: ContentBundleLike;
      readonly manifest: ContentBundleManifest;
    }
  | { readonly ok: false; readonly code: string; readonly message: string };

/**
 * Runs the compiler over the full surface and produces the artifact in memory.
 * Returns `undefined` when compilation fails (the collector carries the
 * diagnostics) — the caller never writes a partial artifact.
 */
export function buildContentBundleArtifact(
  input: CompilerInput,
  signal: AbortSignal,
  collector: DiagnosticCollector,
): ContentBundleArtifact | undefined {
  const output = new Compiler().compile(input, signal, collector);
  if (!output || collector.hasErrors) return undefined;

  const envelope = createEnvelope(
    CONTENT_BUNDLE_ARTIFACT_KIND,
    CONTENT_BUNDLE_COMPATIBILITY_VERSION,
    output.bundle,
  );
  const manifest: ContentBundleManifest = {
    manifestVersion: CONTENT_BUNDLE_MANIFEST_VERSION,
    doNotEdit: BUNDLE_GENERATED_BY,
    contentVersion: output.contentVersion,
    artifactKind: envelope.artifactKind,
    compatibilityVersion: envelope.compatibilityVersion,
    algorithm: envelope.algorithm,
    bodyHash: envelope.bodyHash,
    bodyLength: envelope.bodyLength,
  };
  return {
    bundle: output.bundle,
    envelope,
    manifest,
    contentVersion: output.contentVersion,
    artifactJson: canonicalSerialize(output.bundle),
    manifestJson: canonicalSerialize(manifest),
  };
}

/**
 * Writes the artifact atomically: temp files first, then rename. The manifest
 * lands first so a reader never sees a new artifact described by an old
 * manifest; the final paths are never left partially written.
 */
export function writeContentBundleArtifact(
  outDir: string,
  artifact: ContentBundleArtifact,
): {
  artifactPath: string;
  manifestPath: string;
} {
  mkdirSync(outDir, { recursive: true });
  const artifactPath = resolve(outDir, CONTENT_ARTIFACT_FILENAME);
  const manifestPath = resolve(outDir, CONTENT_MANIFEST_FILENAME);
  const tempArtifact = artifactPath + ".tmp";
  const tempManifest = manifestPath + ".tmp";
  try {
    writeFileSync(tempArtifact, artifact.artifactJson, "utf8");
    writeFileSync(tempManifest, artifact.manifestJson, "utf8");
    renameSync(tempManifest, manifestPath);
    renameSync(tempArtifact, artifactPath);
  } finally {
    rmSync(tempArtifact, { force: true });
    rmSync(tempManifest, { force: true });
  }
  return { artifactPath, manifestPath };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asManifest(value: unknown): ContentBundleManifest | null {
  if (!isRecord(value)) return null;
  const {
    manifestVersion,
    doNotEdit,
    contentVersion,
    artifactKind,
    compatibilityVersion,
    algorithm,
    bodyHash,
    bodyLength,
  } = value;
  if (
    manifestVersion !== CONTENT_BUNDLE_MANIFEST_VERSION ||
    typeof doNotEdit !== "string" ||
    typeof contentVersion !== "string" ||
    typeof artifactKind !== "string" ||
    typeof compatibilityVersion !== "string" ||
    typeof algorithm !== "string" ||
    typeof bodyHash !== "string" ||
    typeof bodyLength !== "number"
  ) {
    return null;
  }
  return {
    manifestVersion,
    doNotEdit,
    contentVersion,
    artifactKind,
    compatibilityVersion,
    algorithm,
    bodyHash,
    bodyLength,
  };
}

/**
 * Verifies a decoded artifact + manifest pair against the generated-bundle
 * contract: the manifest must declare the expected kind/version/algorithm and
 * do-not-edit marker, the bundle must carry the same marker, and the recorded
 * body hash/length must match the canonical serialization of the bundle
 * (`verifyEnvelope`). A mismatch is a tamper/format failure, never a warning.
 */
export function verifyContentBundleArtifact(
  bundleValue: unknown,
  manifestValue: unknown,
): ContentBundleVerification {
  const manifest = asManifest(manifestValue);
  if (manifest === null) {
    return {
      ok: false,
      code: "CONTENT_MANIFEST_INVALID",
      message: "The content manifest is missing required fields or has an unsupported format.",
    };
  }
  if (manifest.doNotEdit !== BUNDLE_GENERATED_BY) {
    return {
      ok: false,
      code: "CONTENT_MANIFEST_MARKER_MISMATCH",
      message: "The content manifest is not a generated artifact (do-not-edit marker mismatch).",
    };
  }
  if (manifest.artifactKind !== CONTENT_BUNDLE_ARTIFACT_KIND) {
    return {
      ok: false,
      code: "CONTENT_ARTIFACT_KIND_MISMATCH",
      message: `Expected a '${CONTENT_BUNDLE_ARTIFACT_KIND}' artifact but the manifest declares '${manifest.artifactKind}'.`,
    };
  }
  if (manifest.compatibilityVersion !== CONTENT_BUNDLE_COMPATIBILITY_VERSION) {
    return {
      ok: false,
      code: "CONTENT_ARTIFACT_VERSION_MISMATCH",
      message: `Expected content-bundle compatibility version '${CONTENT_BUNDLE_COMPATIBILITY_VERSION}' but the manifest declares '${manifest.compatibilityVersion}'.`,
    };
  }
  if (manifest.algorithm !== "sha256") {
    return {
      ok: false,
      code: "CONTENT_ARTIFACT_ALGORITHM_UNSUPPORTED",
      message: `Unsupported content hash algorithm '${manifest.algorithm}'.`,
    };
  }
  if (!isRecord(bundleValue)) {
    return {
      ok: false,
      code: "CONTENT_ARTIFACT_INVALID",
      message: "The content artifact is not a JSON object.",
    };
  }
  if (bundleValue.generatedBy !== BUNDLE_GENERATED_BY) {
    return {
      ok: false,
      code: "CONTENT_ARTIFACT_MARKER_MISMATCH",
      message: "The content artifact is not a generated bundle (do-not-edit marker mismatch).",
    };
  }
  // The manifest's semantic content version must agree with the version embedded
  // in the bundle it describes; the manifest itself is not covered by the body
  // hash, so this catches a manifest/artifact mismatch the hash check cannot.
  const embeddedManifest = bundleValue.manifest;
  const embeddedVersion = isRecord(embeddedManifest) ? embeddedManifest.version : undefined;
  if (typeof embeddedVersion === "string" && embeddedVersion !== manifest.contentVersion) {
    return {
      ok: false,
      code: "CONTENT_VERSION_MISMATCH",
      message: `The content manifest declares version '${manifest.contentVersion}' but the artifact bundle declares '${embeddedVersion}'.`,
    };
  }
  if (
    !verifyEnvelope(
      {
        algorithm: manifest.algorithm,
        artifactKind: manifest.artifactKind,
        compatibilityVersion: manifest.compatibilityVersion,
        bodyHash: manifest.bodyHash,
        bodyLength: manifest.bodyLength,
      },
      bundleValue,
    )
  ) {
    return {
      ok: false,
      code: "CONTENT_ARTIFACT_HASH_MISMATCH",
      message: "The content artifact does not match its recorded SHA-256 body hash.",
    };
  }
  return { ok: true, bundle: bundleValue as ContentBundleLike, manifest };
}
