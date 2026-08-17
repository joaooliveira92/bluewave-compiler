import type { DiagnosticCollector } from "@bluewave/diagnostics";
import { parse } from "yaml";

export interface SafeParseResult {
  success: boolean;
  data: unknown;
}

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_NESTING = 64;

export function parseYamlSafe(
  content: string,
  sourcePath: string,
  collector: DiagnosticCollector,
): SafeParseResult {
  if (Buffer.byteLength(content, "utf8") > MAX_BYTES) {
    collector.addError("YAML-SIZE", `File exceeds maximum size of ${MAX_BYTES} bytes`, {
      stage: "parse",
      sourceLocation: { path: sourcePath, line: 1 },
      remediation: "Reduce file size or split into multiple files",
    });
    return { success: false, data: undefined };
  }

  try {
    const doc = parse(content, {
      maxAliasCount: 100,
    });

    if (typeof doc !== "object" || doc === null) {
      collector.addError("YAML-ROOT", "YAML root must be an object", {
        stage: "parse",
        sourceLocation: { path: sourcePath, line: 1 },
      });
      return { success: false, data: undefined };
    }

    const depth = calculateDepth(doc as Record<string, unknown>);
    if (depth > MAX_NESTING) {
      collector.addError(
        "YAML-NESTING",
        `YAML nesting depth ${depth} exceeds maximum ${MAX_NESTING}`,
        {
          stage: "parse",
          sourceLocation: { path: sourcePath, line: 1 },
        },
      );
      return { success: false, data: undefined };
    }

    return { success: true, data: doc };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    collector.addError("YAML-PARSE", `Failed to parse YAML: ${message}`, {
      stage: "parse",
      sourceLocation: { path: sourcePath, line: 1 },
      remediation: "Check YAML syntax",
    });
    return { success: false, data: undefined };
  }
}

function calculateDepth(obj: Record<string, unknown>): number {
  let maxDepth = 1;
  for (const value of Object.values(obj)) {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      const d = 1 + calculateDepth(value as Record<string, unknown>);
      if (d > maxDepth) maxDepth = d;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "object" && item !== null) {
          const d = 1 + calculateDepth(item as Record<string, unknown>);
          if (d > maxDepth) maxDepth = d;
        }
      }
    }
  }
  return maxDepth;
}
