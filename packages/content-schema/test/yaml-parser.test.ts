import { DiagnosticCollector } from "@bluewave/diagnostics";
import { describe, expect, it } from "vite-plus/test";
import { parseYamlSafe } from "../src/index.js";

describe("parseYamlSafe", () => {
  it("parses valid YAML", () => {
    const collector = new DiagnosticCollector();
    const result = parseYamlSafe("key: value\nnum: 42", "test.yaml", collector);
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ key: "value", num: 42 });
  });

  it("rejects malformed YAML", () => {
    const collector = new DiagnosticCollector();
    const result = parseYamlSafe("{ invalid: ", "test.yaml", collector);
    expect(result.success).toBe(false);
    expect(collector.hasErrors).toBe(true);
  });

  it("rejects excessive size", () => {
    const collector = new DiagnosticCollector();
    const largeContent = "key: " + "x".repeat(12 * 1024 * 1024);
    const result = parseYamlSafe(largeContent, "big.yaml", collector);
    expect(result.success).toBe(false);
    expect(collector.errors[0]?.code).toBe("YAML-SIZE");
  });
});
