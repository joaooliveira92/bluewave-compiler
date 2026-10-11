import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vite-plus/test";

import { CONTENT_ARTIFACT_FILENAME, CONTENT_MANIFEST_FILENAME } from "@bluewave/content-compiler";

import { ContentArtifactError, readContentArtifact } from "./contentArtifact.js";
import { resolveGeneratedContentDir } from "./contentPack.js";

const scratchDirs: string[] = [];

afterEach(() => {
  for (const dir of scratchDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

/** A private copy of the generated artifact so a test can tamper without touching the shared build. */
function copyArtifact(): string {
  const source = resolveGeneratedContentDir();
  const dir = mkdtempSync(join(tmpdir(), "bw-artifact-"));
  scratchDirs.push(dir);
  writeFileSync(
    join(dir, CONTENT_ARTIFACT_FILENAME),
    readFileSync(join(source, CONTENT_ARTIFACT_FILENAME), "utf8"),
  );
  writeFileSync(
    join(dir, CONTENT_MANIFEST_FILENAME),
    readFileSync(join(source, CONTENT_MANIFEST_FILENAME), "utf8"),
  );
  return dir;
}

function expectError(fn: () => unknown): ContentArtifactError {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(ContentArtifactError);
    return error as ContentArtifactError;
  }
  throw new Error("expected readContentArtifact to throw");
}

describe("compiled content artifact loader (ticket 03)", () => {
  it("loads and verifies the shipped production artifact", () => {
    const { bundle, manifest } = readContentArtifact(resolveGeneratedContentDir());
    expect(typeof manifest.bodyHash).toBe("string");
    expect(manifest.bodyHash).toMatch(/^[0-9a-f]{64}$/);
    expect(bundle.shipBuilding).toBeDefined();
    expect(Array.isArray(bundle.technologies)).toBe(true);
  });

  it("fails closed when the artifact is absent", () => {
    const dir = mkdtempSync(join(tmpdir(), "bw-artifact-empty-"));
    scratchDirs.push(dir);
    expect(expectError(() => readContentArtifact(dir)).code).toBe("CONTENT_ARTIFACT_MISSING");
  });

  it("fails closed when the artifact bytes are tampered (hash mismatch)", () => {
    const dir = copyArtifact();
    const artifactPath = join(dir, CONTENT_ARTIFACT_FILENAME);
    const value = JSON.parse(readFileSync(artifactPath, "utf8")) as Record<string, unknown>;
    value.tampered = true;
    writeFileSync(artifactPath, JSON.stringify(value), "utf8");
    const error = expectError(() => readContentArtifact(dir));
    expect(error.code).toBe("CONTENT_ARTIFACT_INVALID");
    expect(error.reason).toBe("CONTENT_ARTIFACT_HASH_MISMATCH");
  });

  it("fails closed on a manifest version mismatch", () => {
    const dir = copyArtifact();
    const manifestPath = join(dir, CONTENT_MANIFEST_FILENAME);
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, unknown>;
    manifest.compatibilityVersion = "9.9.9";
    writeFileSync(manifestPath, JSON.stringify(manifest), "utf8");
    const error = expectError(() => readContentArtifact(dir));
    expect(error.code).toBe("CONTENT_ARTIFACT_INVALID");
    expect(error.reason).toBe("CONTENT_ARTIFACT_VERSION_MISMATCH");
  });

  it("fails closed when the manifest content version disagrees with the bundle", () => {
    const dir = copyArtifact();
    const manifestPath = join(dir, CONTENT_MANIFEST_FILENAME);
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, unknown>;
    manifest.contentVersion = "999.0.0";
    writeFileSync(manifestPath, JSON.stringify(manifest), "utf8");
    const error = expectError(() => readContentArtifact(dir));
    expect(error.code).toBe("CONTENT_ARTIFACT_INVALID");
    expect(error.reason).toBe("CONTENT_VERSION_MISMATCH");
  });

  it("fails closed when the do-not-edit marker is stripped", () => {
    const dir = copyArtifact();
    const manifestPath = join(dir, CONTENT_MANIFEST_FILENAME);
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, unknown>;
    manifest.doNotEdit = "";
    writeFileSync(manifestPath, JSON.stringify(manifest), "utf8");
    expect(expectError(() => readContentArtifact(dir)).code).toBe("CONTENT_ARTIFACT_INVALID");
  });
});
