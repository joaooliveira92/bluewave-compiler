# 03 — Contract: switch every consumer to Nation and delete Country

**What to build:** The clean rename completes with no compat aliases. The compiled
content pack exposes Nations (`ContentPack.nations`), the content-compiler validate
stage validates the Nations collection against `NationSchema` under the "Nation" label,
and every consumer — the campaign compiler, apps/desktop, apps/compiler-cli,
test-support, cross-process-test, and all test fixtures — reads Nations with the
canonical shape. The `CountrySchema`, the `Country` type, and the country schema module
are deleted, and the package exports are updated. The on-disk / input surface for the
collection (the YAML file name, the manifest key, and the compiler input field) keeps
its current "countries" naming by decision. In-repo docs and README references to
"country" are swept to Nation / `nationId` vocabulary, and the glossary entries are
finalized. The repo is green across all packages.

**Blocked by:** 02 — production content must be Nation-shaped before the strict schema
is wired into validation.

**Status:** ready-for-agent

- [ ] Compiled content packs expose Nations; nothing exposes Country at the type or
      schema level.
- [ ] The content-compiler validate stage validates the Nations collection against
      `NationSchema` with the "Nation" label.
- [ ] The campaign compiler and all other consumers (apps, test-support,
      cross-process-test) read Nations; test fixtures reflect the canonical shape.
- [ ] `CountrySchema`, the `Country` type, and the country schema module are gone with
      no compat aliases; grep for Country type references in source comes up empty
      (docs/README excepted).
- [ ] The file / manifest / input naming for the collection is unchanged (kept as
      "countries").
- [ ] Docs and README use Nation / `nationId` vocabulary; `CONTEXT.md` glossary entries
      are final.
- [ ] Repo-wide typecheck, tests, and lint pass.
