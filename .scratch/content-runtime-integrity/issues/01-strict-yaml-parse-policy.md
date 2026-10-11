# 01 — Explicit, versioned strict-YAML parse policy

**Type:** implementation
**Status:** resolved
**Blocked by:** None (can start immediately)
**Frontier:** no

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
      parser is the single parse entry point for the **compiler** today. The
      runtime loaders (desktop main + renderer) still parse raw YAML until they
      switch to the compiled artifact — that adoption is **ticket 03**
      (`CRI-MAIN-*`), a recorded deferral, not a silent gap.

## Notes

- Grounds on the content-parsing ADR (safe YAML, strict-by-default, no
  executable tags). This ticket strengthens it with an explicit, owned policy.
- Prefactor: "make the change easy" — every later ticket inherits this trust
  boundary. It is infrastructure-shaped (parser + tests), not end-to-end UI.
- Do not change any accepted-content bytes; this only tightens rejection of
  malformed input.

## Comments

**Resolved.** `parseYamlSafe` now owns a versioned strict policy
(`YAML_POLICY_VERSION = 1`): core schema, `uniqueKeys`, `resolveKnownTags:
false`, a core-tag allowlist, duplicate-key rejection, and a message-independent
alias-node cap. New diagnostics: `YAML-DUPLICATE-KEY`, `YAML-UNSUPPORTED-TAG`,
`YAML-ALIAS-LIMIT`; existing `YAML-SIZE`/`YAML-NESTING`/`YAML-PARSE`/`YAML-ROOT`
retained.

Adversarial review (read-only) verdict was NEEDS_REWORK on two items, both
closed before landing:
- **B1 — ADR not amended:** ADR-0005 gained a dated "strict-YAML parse policy v1"
  section naming the constants, the new codes, the `resolveKnownTags: false`
  decision, and the alias-cap semantics.
- **M2 — single runtime parse entry point:** corrected. The parser is the single
  entry point for the compiler today; runtime loaders adopt it via ticket 03
  (recorded deferral above), not this ticket.
- **M1 (recommended):** alias-cap detection was made message-independent (explicit
  `Alias`-node count) so a `yaml` upgrade cannot silently demote
  `YAML-ALIAS-LIMIT`.

Accepted trade-off (recorded in ADR-0005): a nested alias-expansion bomb using
≤100 alias nodes surfaces as `YAML-PARSE`, not `YAML-ALIAS-LIMIT`.