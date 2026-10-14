import { describe, expect as vpExpect } from "vite-plus/test";
import { it, expect } from "@effect/vitest";
import { Effect } from "effect";

describe("coexistence of vite-plus/test and @effect/vitest", () => {
  it.effect("effect test inside a vite-plus describe", () =>
    Effect.gen(function* () {
      const v = yield* Effect.succeed(2);
      expect(v).toBe(2);
      vpExpect(v).toBe(2);
    }));

  it("plain vitest test from @effect/vitest re-export", () => {
    expect(1 + 1).toBe(2);
  });
});
