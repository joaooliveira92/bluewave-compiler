# 14: Retire dead paths

**Type:** implementation
**Status:** open
**Blocked by:** None (can start immediately)
**Frontier:** yes

**What to build:** Remove the dead content CLI flag and the legacy raw-input
compile path. The `--content-version` flag is parsed but unused by the content
commands; remove it (or wire it deliberately, recording the reason). The legacy
raw-input compile path is removed once its last caller is migrated to the artifact
path.

## Acceptance criteria

- [ ] The unused `--content-version` flag is removed from the content commands (or
      deliberately wired, with the reason recorded).
- [ ] The last caller of the legacy raw-input compile path is migrated to the
      artifact path.
- [ ] The legacy raw-input compile path is deleted.
- [ ] No runtime YAML is read by the campaign compile path.
- [ ] Existing saves and campaign compile tests stay green.
