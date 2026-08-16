import { describe, expect, it } from "vite-plus/test";
import { isDebugMode } from "./debug-mode.js";

describe("isDebugMode", () => {
  it("is enabled by a `true` flag in a production build", () => {
    expect(isDebugMode({ dev: false, flag: "true" })).toBe(true);
  });

  it("is disabled when no flag is present in a production build", () => {
    expect(isDebugMode({ dev: false, flag: undefined })).toBe(false);
  });

  it("is disabled for flag values other than exactly `true`", () => {
    expect(isDebugMode({ dev: false, flag: "1" })).toBe(false);
    expect(isDebugMode({ dev: false, flag: "TRUE" })).toBe(false);
    expect(isDebugMode({ dev: false, flag: "" })).toBe(false);
  });

  it("is enabled in a dev build regardless of the flag", () => {
    expect(isDebugMode({ dev: true, flag: undefined })).toBe(true);
    expect(isDebugMode({ dev: true, flag: "false" })).toBe(true);
  });
});
