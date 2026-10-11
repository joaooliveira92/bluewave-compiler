# 01 — Explicit, versioned strict-YAML parse policy

**Type:** implementation
**Status:** open
**Blocked by:** None (can start immediately)
**Frontier:** yes

## What to build

Content parsing enforces a documented, versioned strict policy so no authored
file is silently accepted with ambiguous structure. Duplicate mapping keys are
rejected, non-standard/custom YAML tags are rejected (no tag can construct
arbitrary or executable values), and anchor/alias use is capped by a documented
constant. Failures surface as precise `YAML-*` diagnostics carrying the file and
the offending field path.

Both the compiler and the runtime content loaders use this one parser, so the
policy cannot drift between "what CI validated" and "what the app loads." Today
only the alias cap is configured; the rest is inherited library default.

## Acceptance criteria

- [ ] A duplicate mapping key within one mapping is rejected with a diagnostic
      naming the file and the duplicated key.
- [ ] Custom/unsupported YAML tags are rejected (no tag can construct an
      arbitrary or executable value).
- [ ] Anchor/alias use is capped by a documented constant; exceeding it produces
      a diagnostic.
- [ ] The existing size and nesting caps are preserved.
- [ ] Existing valid production content and the full compiler fixture corpus
      parse unchanged (no false rejections).
- [ ] The policy is documented and linked from the content-parsing ADR; the
      parser remains the single parse entry point for compiler and runtime
      loaders.

## Notes

- Grounds on the content-parsing ADR (safe YAML, strict-by-default, no
  executable tags). This ticket strengthens it with an explicit, owned policy.
- Prefactor: "make the change easy" — every later ticket inherits this trust
  boundary. It is infrastructure-shaped (parser + tests), not end-to-end UI.
- Do not change any accepted-content bytes; this only tightens rejection of
  malformed input.