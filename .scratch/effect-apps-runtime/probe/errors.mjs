// Probe 3: what does runPromise reject with? Exit/Cause at the edge.
import { Cause, Data, Effect, Exit } from "effect";

class Boom extends Data.TaggedError("Boom") {}
const err = new Boom({});
const rejected = await Effect.runPromise(Effect.fail(err)).then(
  () => "resolved",
  (e) => e,
);
console.log("1. runPromise rejects with same instance:", rejected === err, "tag:", rejected?._tag, "is Error:", rejected instanceof Error);

const exit = await Effect.runPromiseExit(Effect.fail(err));
console.log("2. runPromiseExit isFailure:", Exit.isFailure(exit));
console.log("3. squash identity:", Exit.isFailure(exit) && Cause.squash(exit.cause) === err);
console.log("4. prettyErrors len:", Cause.prettyErrors(exit.cause).length);

const defects = await Effect.runPromiseExit(Effect.die(new Error("kaboom")));
console.log("5. die -> isFailure:", Exit.isFailure(defects), "squash msg:", Exit.isFailure(defects) ? Cause.squash(defects.cause).message : "-");
console.log("6. hasInterruptsOnly(defect):", Cause.hasInterruptsOnly(defects.cause));

// Exit.match at the edge
const label = Exit.match(exit, {
  onFailure: (cause) => `fail:${Cause.squash(cause)._tag}`,
  onSuccess: () => "ok",
});
console.log("7. Exit.match:", label);

// Data.TaggedError vs Schema.TaggedError yieldable in gen
const { Schema } = await import("effect");
class Wire extends Schema.TaggedError()("Wire", { path: Schema.String }) {}
const w = await Effect.runPromise(Effect.flip(Effect.gen(function* () {
  return yield* new Wire({ path: "/x" });
})));
console.log("8. Schema.TaggedError yielded:", w._tag, w.path, "has .fields:", typeof Wire.fields);
