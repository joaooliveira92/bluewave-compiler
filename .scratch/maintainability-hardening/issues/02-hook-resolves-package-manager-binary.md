# 02: Hook resolves the package-manager binary

**Type:** implementation
**Status:** open
**Blocked by:** None (can start immediately)
**Frontier:** yes

**What to build:** The `pre-commit` hook works when git runs it from a GUI or
non-login shell whose `PATH` lacks the package manager — today the hook restores
`PATH` only well enough to find `node`, then the staged-format step shells out to
`pnpm` and fails. The staged-format step must resolve the package manager the
same way the hook resolves node (or invoke the tool directly), so a valid staged
commit is never rejected with a misleading "not formatted" error.

- [ ] From a shell whose `PATH` lacks the package manager but has `node`,
  `pre-commit` still runs the staged format check end-to-end.
- [ ] The existing behaviour (package manager already on `PATH`) is unchanged.
- [ ] A fixture or a documented manual reproduction proves the `PATH`-less case.
