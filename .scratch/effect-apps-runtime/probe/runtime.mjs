// Probe 1: v4 runtime lifecycle, services/layers, error channels, Exit/Cause.
import { readFileSync } from "node:fs";
import {
  Cause,
  Clock,
  Context,
  Data,
  Effect,
  Exit,
  Layer,
  ManagedRuntime,
  Random,
  Schema,
} from "effect";

const log = (...a) => console.log(...a);

// ---- 1. Service + Layer over raw node:fs (sync) -------------------------
class FileStore extends Context.Service()("probe/FileStore") {
  static layer = Layer.effect(
    FileStore,
    Effect.sync(() =>
      FileStore.of({
        read: Effect.fn("FileStore.read")(function* (p) {
          return yield* Effect.try({
            try: () => readFileSync(p, "utf8"),
            catch: (cause) => new ReadFailed({ path: p, cause }),
          });
        }),
      })
    ),
  );
}

class ReadFailed extends Data.TaggedError("ReadFailed") {}

// ---- 2. Schema.TaggedError ---------------------------------------------
class WireError extends Schema.TaggedError()("WireError", { path: Schema.String, code: Schema.Int }) {}

// ---- 3. ManagedRuntime lifecycle ---------------------------------------
const runtime = ManagedRuntime.make(FileStore.layer);

const program = Effect.gen(function* () {
  const store = yield* FileStore;
  yield* Effect.log("reading...");
  return yield* store.read("/etc/hosts");
});

log("A. service key/of/use:", FileStore.key, typeof FileStore.of, typeof FileStore.use);
try { log("B. runPromise ->", JSON.stringify((await runtime.runPromise(program)).slice(0, 12))); } catch (e) { log("B. runPromise rejected:", e._tag); }
log("C. context cached:", runtime.cachedContext !== undefined);

// runPromiseExit on a failure
const failed = Effect.gen(function* () {
  return yield* new ReadFailed({ path: "/nope", cause: new Error("ENOENT") });
});
const exit = await runtime.runPromiseExit(failed);
log("D. Exit.isFailure:", Exit.isFailure(exit), "squash tag:", Exit.isFailure(exit) ? Cause.squash(exit.cause)._tag : "-");
log("E. Cause.pretty head:\n" + Cause.pretty(exit.cause).split("\n").slice(0, 4).join("\n"));
log("F. Cause.hasInterruptsOnly:", Cause.hasInterruptsOnly(exit.cause));

// ---- 4. catchTag (pipeable + array + data-first) -----------------------
const recoveredPipe = failed.pipe(Effect.catchTag("ReadFailed", (e) => Effect.succeed(`recovered:${e.path}`)));
log("G. catchTag pipe:", await runtime.runPromise(recoveredPipe));

const multi = Effect.fail(new WireError({ path: "/a", code: 7 }));
const recoveredArr = multi.pipe(Effect.catchTag(["WireError", "Other"], () => Effect.succeed("arr-ok")));
log("H. catchTag array:", await runtime.runPromise(recoveredArr));

const recoveredTags = multi.pipe(Effect.catchTags({ WireError: (e) => Effect.succeed(`tags:${e.code}`) }));
log("I. catchTags:", await runtime.runPromise(recoveredTags));

// data-first form from LLMS.md
const dataFirst = Effect.catchTag(multi, "WireError", (e) => Effect.succeed(`df:${e.path}`));
log("I2. catchTag data-first:", await runtime.runPromise(dataFirst));

// ---- 5. Schema.TaggedError is yieldable + Error subclass ---------------
const wire = new WireError({ path: "/z", code: 1 });
log("J. Schema.TaggedError _tag:", wire._tag, "instanceof Error:", wire instanceof Error);

// ---- 6. runSync sync vs async ------------------------------------------
log("K. runSync sync ok:", Effect.runSync(Effect.succeed(41)));
try {
  Effect.runSync(Effect.promise(() => Promise.resolve(1)));
  log("K2. runSync async: no throw (!)");
} catch (e) {
  log("K2. runSync async throws:", e?.constructor?.name, String(e).slice(0, 50));
}

// ---- 7. determinism facilities ----------------------------------------
const clockProg = Effect.gen(function* () {
  const ms = yield* Clock.currentTimeMillis;
  const r = yield* Random.next;
  return { ms: typeof ms, r: typeof r };
});
log("L. Clock/Random default-available:", JSON.stringify(await runtime.runPromise(clockProg)));

// ---- 8. dispose --------------------------------------------------------
await runtime.dispose();
try {
  await runtime.runPromise(Effect.succeed(1));
  log("M. after dispose: ran (!)");
} catch (e) {
  log("M. after dispose throws:", String(e).slice(0, 40));
}
log("N. disposeEffect isEffect:", Effect.isEffect(runtime.disposeEffect));
