import { describe, it, expect } from "vite-plus/test";
import { DiagnosticCollector } from "../src/index.js";

describe("DiagnosticCollector", () => {
  it("starts empty", () => {
    const c = new DiagnosticCollector();
    expect(c.all).toHaveLength(0);
    expect(c.hasErrors).toBe(false);
  });

  it("collects errors", () => {
    const c = new DiagnosticCollector();
    c.addError("TEST-ERR", "Something went wrong", { stage: "test" });
    expect(c.all).toHaveLength(1);
    expect(c.hasErrors).toBe(true);
    expect(c.errors).toHaveLength(1);
    expect(c.warnings).toHaveLength(0);
  });

  it("collects warnings", () => {
    const c = new DiagnosticCollector();
    c.addWarning("TEST-WARN", "Be careful", { stage: "test" });
    expect(c.all).toHaveLength(1);
    expect(c.hasErrors).toBe(false);
    expect(c.warnings).toHaveLength(1);
  });

  it("collects info", () => {
    const c = new DiagnosticCollector();
    c.addInfo("TEST-INFO", "FYI", { stage: "test" });
    expect(c.all).toHaveLength(1);
  });

  it("generates human-readable output", () => {
    const c = new DiagnosticCollector();
    c.addError("TEST-ERR", "failure", {
      stage: "check",
      sourceLocation: { path: "file.yaml", line: 5 },
    });
    const output = c.toHuman();
    expect(output).toContain("TEST-ERR");
    expect(output).toContain("file.yaml:5");
  });

  it("generates JSON output", () => {
    const c = new DiagnosticCollector();
    c.addError("TEST-ERR", "failure", { stage: "check" });
    const json = c.toJSON();
    const parsed = JSON.parse(json);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].code).toBe("TEST-ERR");
  });

  it("clears diagnostics", () => {
    const c = new DiagnosticCollector();
    c.addError("TEST-ERR", "failure", { stage: "test" });
    c.clear();
    expect(c.all).toHaveLength(0);
  });
});
