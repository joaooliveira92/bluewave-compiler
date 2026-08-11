import { describe, it, expect } from "vitest";
import { createRequire } from "node:module";

const _require = createRequire(import.meta.url);

let hasElectron = false;
try {
  _require.resolve("electron");
  hasElectron = true;
} catch {
  hasElectron = false;
}

const describeIf = hasElectron ? describe : describe.skip;

describeIf("Desktop smoke test", () => {
  it("Electron resolves successfully", () => {
    const electronPath = _require.resolve("electron");
    expect(electronPath).toBeTruthy();
    expect(typeof electronPath).toBe("string");
  });
});