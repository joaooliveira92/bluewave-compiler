# ADR-0133: Crash and error observability — a local-only support bundle

## Status

Accepted (2026-10-12).

## Context

Bluewave Desktop ships as an offline, single-player Electron application. Before
this decision a shipped crash was invisible: an uncaught exception in the main
process, an unhandled rejection, or an uncaught renderer error either produced a
blank window or disappeared into a console nobody reads. There was no artifact a
player could hand a maintainer to explain what went wrong, and no policy
governing whether — or how — a failure might ever leave the machine.

Two constraints shape the answer. First, the app is offline and processes the
player's own campaign: save data, nation choices, and play history are private by
default, so any failure report that could carry campaign data is a privacy
decision, not just an engineering one. Second, the repository already treats
"never hide a failure" as a shell principle: the window reload/quit recovery path
(ADR-0121) surfaces an unrecoverable failure with an error box rather than
leaving a blank window.

## Decision

Report failures **locally only**, with no network call, and make the report a
file the user can choose to share.

1. **Local support bundle.** On an uncaught main-process exception or unhandled
   rejection, or a renderer `error` / `unhandledrejection`, the application
   writes a small JSON bundle to `<userData>/support/`. The bundle carries the
   error message and stack, the app version, the platform and architecture, the
   process id, and a timestamp, plus a note stating that nothing is sent
   anywhere. It carries **no** save contents, campaign state, player
   identifiers, filesystem paths, or credentials.
2. **Main and renderer handlers that never hide a failure.** The main process
   installs `uncaughtException` and `unhandledRejection` handlers that write the
   bundle, print the failure to stderr, surface it in an error box naming the
   bundle path, and quit. The renderer installs `error` and
   `unhandledrejection` listeners that log the failure and forward a bounded
   payload to main over the existing `contextBridge`. A failure is always
   surfaced; it is never silently swallowed.
3. **Validated, opt-in network reporting.** No network call is made under this
   decision. Any future remote reporting is a separate, explicit decision and
   must be strictly opt-in, defaulting off, with the privacy stance restated;
   this ADR does not authorize it.
4. **The IPC boundary is validated.** The renderer payload is decoded against a
   strict schema at the main-process boundary (Electron boundary rule); a
   malformed payload is dropped rather than trusted, and the bundle write is
   best-effort so a crash handler cannot itself crash.

## Consequences

- A player can attach a single file to a bug report; a maintainer can read the
  failure without access to the player's machine.
- The bundle is deliberately thin: it explains the failure, not the campaign. If
  reproducing a bug needs campaign context, the player shares the save
  separately and knowingly.
- The main process stays runtime-free: the bundle module uses only Node builtins
  and the runtime-free schema subset, and it is unit-tested without launching
  Electron (the clock and log are injected).
- Adding hosted crash reporting later is additive: it consumes the same bundle
  and the same handlers, behind an explicit opt-in.

## Alternatives considered

- **Hosted crash service with default-on telemetry.** Rejected: the app is
  offline and single-player, and default-on reporting is a privacy regression
  the offline posture does not justify.
- **Local bundle plus automatic (opt-out) upload.** Rejected for the same
  reason; consent must be affirmative.
- **No capture at all.** Rejected: it leaves shipped failures invisible and
  contradicts the shell's existing "never leave a blank window" principle.

## Amended (2026-10-12)

Production hardening closed the gap between the decision's "no filesystem paths"
claim and the first implementation:

- **Redaction.** The crash context carries the user's home directory; message and
  stack are redacted (home directory → `~`, remaining `/Users|/home/<name>` →
  `[user]`) and truncated (8 KB message, 64 KB stack) before the bundle is
  written, so a shareable bundle does not leak a username.
- **Bounded writes.** A `CrashLimiter` caps writes per time window and dedups an
  identical crash; the support directory keeps the newest 20 bundles and prunes
  the rest, so a render loop cannot fill the disk.
- **Packaged proof.** `packaged-smoke.mjs` forces a real uncaught renderer error in
  the packaged binary and asserts the bundle is written and local-only.
