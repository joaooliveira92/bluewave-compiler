import { Compiler } from "@bluewave/content-compiler";
import type { CompilerInput } from "@bluewave/content-compiler";
import { DiagnosticCollector } from "@bluewave/diagnostics";
import { readFileSync, existsSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { resolve, dirname, sep, normalize } from "node:path";
import {
  canonicalSerialize,
  sha256Hex,
  createEnvelope,
  verifyEnvelope,
} from "@bluewave/deterministic";

export type OutputMode = "human" | "json";
export type ExitCategory =
  "success" | "validation-error" | "compile-error" | "aborted" | "internal-error" | "usage-error";

export interface CliOptions {
  manifest: string;
  contentDir: string;
  outputDir: string;
  outputMode: OutputMode;
}

export function runValidate(options: CliOptions): ExitCategory {
  const collector = new DiagnosticCollector();
  const input = buildInput(options, collector);
  if (!input) return "usage-error";

  const compiler = new Compiler();
  const signal = new AbortController().signal;
  const output = compiler.compile(input, signal, collector);

  printDiagnostics(collector, options.outputMode);

  if (collector.hasErrors) return "validation-error";
  if (!output) return "compile-error";

  printResult("Validation passed", options.outputMode);
  return "success";
}

export function runCompile(options: CliOptions): ExitCategory {
  const collector = new DiagnosticCollector();
  const input = buildInput(options, collector);
  if (!input) return "usage-error";

  const compiler = new Compiler();
  const signal = new AbortController().signal;
  const output = compiler.compile(input, signal, collector);

  printDiagnostics(collector, options.outputMode);

  if (collector.hasErrors) return "validation-error";
  if (!output) return "compile-error";

  const outDir = resolve(options.outputDir);
  mkdirSync(outDir, { recursive: true });

  const envelope = createEnvelope("content-pack", "0.1.0", output.pack);

  const artifactPath = resolve(outDir, "artifact.json");
  const envelopePath = resolve(outDir, "artifact.sig.json");

  const tempArtifact = artifactPath + ".tmp";
  const tempEnvelope = envelopePath + ".tmp";

  try {
    const artifactJson = canonicalSerialize(output.pack);
    const envelopeJson = canonicalSerialize(envelope);

    writeFileSync(tempArtifact, artifactJson, "utf8");
    writeFileSync(tempEnvelope, envelopeJson, "utf8");

    rmSync(artifactPath, { force: true });
    rmSync(envelopePath, { force: true });
    writeFileSync(artifactPath, artifactJson, "utf8");
    writeFileSync(envelopePath, envelopeJson, "utf8");
  } finally {
    rmSync(tempArtifact, { force: true });
    rmSync(tempEnvelope, { force: true });
  }

  if (options.outputMode === "json") {
    printResult(
      JSON.stringify({
        artifactHash: output.rawHash,
        envelopeHash: output.envelopeHash,
        artifactPath,
        envelopePath,
      }),
      "human",
    );
  } else {
    printResult(`Compiled successfully`, "human");
    printResult(`  Artifact: ${artifactPath} (SHA-256: ${output.rawHash})`, "human");
    printResult(`  Envelope: ${envelopePath} (SHA-256: ${output.envelopeHash})`, "human");
  }

  return "success";
}

export function runInspect(options: CliOptions): ExitCategory {
  const artifactPath = resolve(options.outputDir, "artifact.json");
  const envelopePath = resolve(options.outputDir, "artifact.sig.json");

  if (!existsSync(artifactPath)) {
    printResult(`Artifact not found at ${artifactPath}`, "human");
    return "usage-error";
  }

  if (!existsSync(envelopePath)) {
    printResult(`Envelope not found at ${envelopePath}`, "human");
    return "usage-error";
  }

  try {
    const artifactJson = readFileSync(artifactPath, "utf8");
    const envelopeJson = readFileSync(envelopePath, "utf8");
    const envelope = JSON.parse(envelopeJson);

    const computedHash = sha256Hex(artifactJson);
    const valid = computedHash === envelope.bodyHash;

    if (options.outputMode === "json") {
      printResult(
        JSON.stringify({ artifactHash: computedHash, envelope, valid }, null, 2),
        "human",
      );
    } else {
      printResult(`Artifact: ${artifactPath}`, "human");
      printResult(`  Size: ${Buffer.byteLength(artifactJson, "utf8")} bytes`, "human");
      printResult(`  SHA-256: ${computedHash}`, "human");
      printResult(`Envelope:`, "human");
      printResult(`  Algorithm: ${envelope.algorithm}`, "human");
      printResult(`  Kind: ${envelope.artifactKind}`, "human");
      printResult(`  Version: ${envelope.compatibilityVersion}`, "human");
      printResult(`  Body Hash: ${envelope.bodyHash}`, "human");
      printResult(`  Body Length: ${envelope.bodyLength}`, "human");
      printResult(`  Status: ${valid ? "VALID" : "INVALID - hash mismatch"}`, "human");
    }

    return valid ? "success" : "validation-error";
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    printResult(`Failed to inspect: ${message}`, "human");
    return "internal-error";
  }
}

export function runVerify(options: CliOptions): ExitCategory {
  return runInspect(options);
}

export function runCompare(options: CliOptions): ExitCategory {
  const artifactPath = resolve(options.outputDir, "artifact.json");
  const envelopePath = resolve(options.outputDir, "artifact.sig.json");

  if (!existsSync(artifactPath)) {
    printResult(`Artifact not found at ${artifactPath}`, "human");
    return "usage-error";
  }

  try {
    const artifactJson = readFileSync(artifactPath, "utf8");
    const envelopeJson = readFileSync(envelopePath, "utf8");
    const artifact = JSON.parse(artifactJson);
    const envelope = JSON.parse(envelopeJson);

    const computedHash = sha256Hex(artifactJson);
    const valid = verifyEnvelope(envelope, artifact);

    if (options.outputMode === "json") {
      printResult(
        JSON.stringify(
          {
            recomputedHash: computedHash,
            envelopeBodyHash: envelope.bodyHash,
            hashMatch: computedHash === envelope.bodyHash,
            envelopeValid: valid,
          },
          null,
          2,
        ),
        "human",
      );
    } else {
      printResult(`Comparison:`, "human");
      printResult(`  Re-computed SHA-256: ${computedHash}`, "human");
      printResult(`  Envelope bodyHash:   ${envelope.bodyHash}`, "human");
      printResult(
        `  Hash match:          ${computedHash === envelope.bodyHash ? "YES" : "NO"}`,
        "human",
      );
      printResult(`  Envelope valid:      ${valid ? "YES" : "NO"}`, "human");
    }

    return valid ? "success" : "validation-error";
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    printResult(`Failed to compare: ${message}`, "human");
    return "internal-error";
  }
}

function buildInput(
  options: CliOptions,
  collector: DiagnosticCollector,
): CompilerInput | undefined {
  const manifestPath = resolve(options.manifest);
  const contentDir = resolve(options.contentDir);

  if (!existsSync(manifestPath)) {
    collector.addError("USAGE", `Manifest not found: ${manifestPath}`);
    return undefined;
  }

  if (!existsSync(contentDir)) {
    collector.addError("USAGE", `Content directory not found: ${contentDir}`);
    return undefined;
  }

  let manifest: { files?: Record<string, string[]> };
  try {
    const manifestContent = readFileSync(manifestPath, "utf8");
    manifest = JSON.parse(manifestContent);
  } catch {
    collector.addError("USAGE", `Failed to parse manifest: ${manifestPath}`);
    return undefined;
  }

  const toAbsolute = (file: string) => resolve(contentDir, file);
  const files = manifest.files ?? {};

  return {
    manifestPath: "manifest",
    contentDir,
    rulesetFiles: (files.rulesets ?? []).map(toAbsolute).map(safePath),
    countryFiles: (files.countries ?? []).map(toAbsolute).map(safePath),
    areaFiles: (files.areas ?? []).map(toAbsolute).map(safePath),
    routeFiles: (files.routes ?? []).map(toAbsolute).map(safePath),
    possessionFiles: (files.possessions ?? []).map(toAbsolute).map(safePath),
    portFiles: (files.ports ?? []).map(toAbsolute).map(safePath),
    technologyFiles: (files.technologies ?? []).map(toAbsolute).map(safePath),
  };
}

function safePath(file: string): string {
  const normalized = normalize(file);
  if (normalized.includes(`..${sep}`)) {
    throw new Error(`Path traversal detected: ${file}`);
  }
  return normalized;
}

function printDiagnostics(collector: DiagnosticCollector, mode: OutputMode): void {
  if (mode === "json") {
    process.stdout.write(collector.toJSON() + "\n");
  } else {
    const text = collector.toHuman();
    if (text) process.stdout.write(text + "\n");
  }
}

function printResult(message: string, _mode: OutputMode): void {
  process.stdout.write(message + "\n");
}
