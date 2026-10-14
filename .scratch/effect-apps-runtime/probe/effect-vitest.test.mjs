import { it, expect, assert } from "@effect/vitest";
import { Context, Effect, Layer } from "effect";

class Counter extends Context.Service()("probe/Counter") {
  static layer = Layer.succeed(Counter)({ value: 41 });
}

it.effect("it.effect runs a scoped Effect program", () =>
  Effect.gen(function* () {
    const n = yield* Effect.succeed(1);
    expect(n).toBe(1);
  }));

it.effect("it.effect can yield a service from a provided layer", () =>
  Effect.gen(function* () {
    const c = yield* Counter;
    expect(c.value).toBe(41);
  }).pipe(Effect.provide(Counter.layer)));

it.live("it.live runs against the live environment", () =>
  Effect.gen(function* () {
    const now = yield* Effect.sync(() => 2);
    assert.strictEqual(now, 2);
  }));

it.effect("it.effect catches a typed failure by tag", () =>
  Effect.gen(function* () {
    const r = yield* Effect.fail({ _tag: "Boom" }).pipe(
      Effect.catchTag("Boom", () => Effect.succeed("ok")),
    );
    expect(r).toBe("ok");
  }));
