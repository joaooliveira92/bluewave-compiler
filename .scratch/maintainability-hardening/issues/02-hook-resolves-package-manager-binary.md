# 02: Hook resolves the package-manager binary

**Type:** implementation
**Status:** resolved
**Blocked by:** None (can start immediately)
**Frontier:** yes

**What to build:** The `pre-commit` hook works when git runs it from a GUI or
non-login shell whose `PATH` lacks the package manager — today the hook restores
`PATH` only well enough to find `node`, then the staged-format step shells out to
`pnpm` and fails. The staged-format step must resolve the package manager the
same way the hook resolves node (or invoke the tool directly), so a valid staged
commit is never rejected with a misleading "not formatted" error.

- [x] From a shell whose `PATH` lacks the package manager but has `node`,
  `pre-commit` still runs the staged format check end-to-end.
- [x] The existing behaviour (package manager already on `PATH`) is unchanged.
- [x] A fixture or a documented manual reproduction proves the `PATH`-less case.

## Comments

- `scripts/precommit-staged.mjs` no longer shells out to `pnpm exec vp`; it
  resolves the workspace formatter directly (`node_modules/vite-plus/bin/vp`)
  and runs it under the running `node`, falling back to `vp` on `PATH`. This
  removes the `pnpm`-on-`PATH` dependency from the staged-format step entirely.
- The catch now distinguishes a formatter that could not be *spawned*
  (`error.status === null` — missing binary, permissions) from a genuine
  formatting failure ("staged files are not formatted"), so a setup problem can
  never masquerade as a "not formatted" rejection.
- `.githooks/pre-commit` and `.githooks/pre-push` now restore the login-shell
  `PATH` when *either* `node` **or** `pnpm` is missing (previously only `node`),
  so the hook also resolves the package-manager binary for `pnpm preflight` /
  `pnpm lint:effect` in a GUI/non-login shell.
- Fixture `scripts/test/precommit-staged.test.mjs` (4 tests, under
  `pnpm test:scripts`) builds a git repo with a fake workspace formatter and runs
  the script on a `PATH` with every `pnpm`-providing directory removed: the
  PATH-less happy path, the unchanged behaviour with `pnpm` on `PATH`, the
  "not formatted" path, and the missing-formatter path asserting the accurate
  error and the absence of "not formatted". The fake formatter's path is read
  from vite-plus' own package `bin`, so the fixture cannot agree with a wrong
  hardcoded path in the script.
- Manual reproduction (real repo, `PATH` stripped of `pnpm`): staged an
  unformatted file, ran `node scripts/precommit-staged.mjs` → it invoked the
  formatter directly and reported the file unformatted (exit 1), i.e. the check
  ran end-to-end with no `pnpm`.
- Validation: `node --test scripts/test/precommit-staged.test.mjs` (4/4),
  `pnpm test:scripts` (183/183), `pnpm preflight`, `vp fmt --check`,
  `vp lint` on the changed files.
- `pnpm preflight` at the default gate concurrency is intermittently red for a
  pre-existing, unrelated reason: `packages/content-codemod` `test/determinism`
  and `test/publish` exceed their 5s per-test timeout under concurrent gate load
  (they pass alone, 13/13, and the suite passes with
  `VP_RUN_CONCURRENCY_LIMIT=2 pnpm preflight`). It reproduces without this change.

