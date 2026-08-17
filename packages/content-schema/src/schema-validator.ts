import type { DiagnosticCollector } from "@bluewave/diagnostics";
import type { z } from "zod";

export function validateAgainstSchema<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  label: string,
  sourcePath: string,
  collector: DiagnosticCollector,
): T | undefined {
  const result = schema.safeParse(data);
  if (!result.success) {
    for (const issue of result.error.issues) {
      const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
      collector.addError("SCHEMA", `Validation failed for ${label}.${path}: ${issue.message}`, {
        stage: "validate",
        sourceLocation: { path: sourcePath, line: 1 },
        remediation: issue.message.includes("required") ? `Add missing field '${path}'` : undefined,
      });
    }
    return undefined;
  }
  return result.data;
}
