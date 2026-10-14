// Probe 2: layer-scoped resource lifecycle + dispose; Runtime.makeRunMain for a CLI edge.
import { Context, Effect, Exit, Layer, ManagedRuntime, Runtime } from "effect";

const events = [];

// A resource-owning service: acquired with acquireRelease, released on dispose.
class Db extends Context.Service()("probe/Db") {
  static layer = Layer.effect(
    Db,
    Effect.acquireRelease(
      Effect.sync(() => {
        events.push("acquire");
        return { query: (sql) => Effect.succeed(`rows:${sql}`) };
      }),
      () =>
        Effect.sync(() => {
          events.push("release");
        }),
    ),
  );
}

// A dependent service composed via Layer.provide.
class Repo extends Context.Service()("probe/Repo") {
  static layer = Layer.effect(
    Repo,
    Effect.gen(function* () {
      const db = yield* Db;
      return Repo.of({ all: () => db.query("all") });
    }),
  ).pipe(Layer.provide(Db.layer));
}

const runtime = ManagedRuntime.make(Repo.layer);

const program = Effect.gen(function* () {
  const repo = yield* Repo;
  return yield* repo.all();
});

console.log("1. run ->", await runtime.runPromise(program));
console.log("2. events before dispose:", JSON.stringify(events));
await runtime.dispose();
console.log("3. events after dispose:", JSON.stringify(events));
console.log("4. second dispose is safe:", await runtime.dispose().then(() => "ok", (e) => `threw:${e}`));

// ---- CLI-style entrypoint via Runtime.makeRunMain ----------------------
const mainEvents = [];
class CliError extends Error {
  constructor(msg) {
    super(msg);
    this._tag = "CliError";
    this[Runtime.errorExitCode] = 3;
  }
}
const runMain = Runtime.makeRunMain(({ fiber, teardown }) => {
  fiber.addObserver((exit) => teardown(exit, (code) => mainEvents.push(`exit:${code}`)));
});
runMain(Effect.succeed("done"), { disableErrorReporting: true });
runMain(Effect.fail(new CliError("bad")), { disableErrorReporting: true });
await new Promise((r) => setTimeout(r, 20));
console.log("5. runMain exit codes:", JSON.stringify(mainEvents));
console.log("6. Exit.isSuccess(Exit.succeed(1)):", Exit.isSuccess(Exit.succeed(1)));
