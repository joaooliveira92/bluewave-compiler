# Change scope

`scripts/change-scope.mjs` (`pnpm change-scope --base <ref> [--head <ref>]`)
prints a versioned JSON report of the paths a change touches, relative to the
merge base of `--base` and `--head` (default `HEAD`):

```jsonc
{
  "formatVersion": 1,
  "resolved": { "baseSha": "…", "headSha": "…", "mergeBaseSha": "…" },
  "paths": {
    "committed": ["packages/…"],   // merge-base → head
    "staged": ["…"],               // git diff --cached
    "unstaged": ["…"],             // git diff (worktree)
    "untracked": ["…"]             // ls-files --others --exclude-standard
  }
}
```

It is the canonical way to compute a change set for change-based filtering —
e.g. a CI step that skips heavy jobs when nothing outside `docs/` and `*.md`
changed. The `quality.yml` `Change scope` step runs it for visibility only;
gating required checks on it is intentionally deferred (D-4) until the
docs-only detection is proven, so a scope bug can never skip a real gate.

Local use:

```sh
pnpm change-scope --base origin/dev
pnpm change-scope --base "$(git merge-base origin/dev HEAD)"
```
