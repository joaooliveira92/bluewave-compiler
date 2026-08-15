# Desktop E2E Coverage — 02: E2E Harness Shape

Type: prototype
Status: open
Blocked by: 01

## Question

What should the E2E-suite shared harness look like — the `@playwright/test`
fixture(s) every spec builds on?

Candidate shape to react to (raise fidelity, don't finalize):

- A `test` extension in `apps/desktop/e2e/fixtures.ts` that, per test:
  - builds nothing (build is a CI/manual prerequisite — hermetic run) but
    launches the built app via the pattern from ticket 01;
  - provisions a per-test scratch `userData` dir + scratch save-dir,
  - installs the `dialog.showOpenDialog` stub wired to a per-test
    fixture/save-dir,
  - returns the page + typed helpers (wait-for-route assertions, the shell's
    "primary action" button, etc.);
  - tears down in `finally` (close app, empty scratch dirs, kill orphans).
- A tiny `e2e/fixtures` tree: the production package
  (`content/production/1880/bluewave-austria_hungary-scen_1880/`) copied to a
  writable location so `Load/Verify/Replay/Recover` never mutate the shipped
  package.
- A `test.describe` per MVP flow, sharing one compiled campaign where the
  specs within a file are order-dependent, opposed to the strict per-test
  isolation of `worker: 1`.

Decide the harness contract precisely enough that the follow-up
implementation effort can build the suite to it without re-litigating:
exact helper names/shapes, how a spec expresses "boot a fresh campaign",
"open save X", and where teardown lives. Link the prototype/stub outline as
an asset from this ticket.