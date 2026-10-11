/**
 * Vitest global setup: build the compiled content artifact once before the
 * desktop suite runs, so main-process content loaders (which now consume the
 * artifact, not raw YAML) have exactly the content the compiler validated.
 */
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

export default function globalSetup() {
  const script = resolve(import.meta.dirname, "build-content.mjs");
  execFileSync(process.execPath, [script], { stdio: "inherit" });
}
