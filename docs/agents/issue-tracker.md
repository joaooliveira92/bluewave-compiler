# Issue tracker: Local Markdown

Issues and specs for this repo live as markdown files in `.scratch/`.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`
- The spec is `.scratch/<feature-slug>/spec.md`
- Implementation issues are one file per ticket at
  `.scratch/<feature-slug>/issues/<NN>-<slug>.md` (or `INC-<N>-<slug>.issue.md`
  when sliced by `to-tickets`), numbered from `01` — never a single combined
  tickets file
- Every ticket file carries the same inline fields near the top (bold keys):
  - `**Type:**` — `decision` (wayfinder) or `task` / `implementation`
  - `**Status:**` — `open` (not started), `claimed` (being worked), or
    `resolved` (answer/implementation landed)
  - `**Blocked by:**` — comma-separated ticket references; `none` when unblocked
  - `**Frontier:**` — `yes` or `no`, present on implementation tickets only
- Comments and conversation history append to the bottom of the file under a
  `## Comments` heading

> `.ai/specs/` is a **pointer index only** — canonical specs live here under
> `.scratch/<feature-slug>/spec.md`. New specs are produced by the **spec-creator**
> role with the **`to-spec`** skill and sliced into implementation tickets by
> **`to-tickets`** (frontier-ordered vertical slices with blocking edges).

## When a skill says "publish to the issue tracker"

Create a new file under `.scratch/<feature-slug>/` (creating the directory if needed).

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path or the issue number directly.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a file with one **child** file per ticket.

- **Map**: `.scratch/<effort>/map.md` — the Notes / Decisions-so-far / Fog body.
- **Child ticket**: `.scratch/<effort>/issues/NN-<slug>.md`, numbered from `01`, with the question in the body. A `Type:` line records the ticket type (`research`/`prototype`/`grilling`/`task`); a `Status:` line records `claimed`/`resolved`.
- **Blocking**: a `Blocked by: NN, NN` line near the top. A ticket is unblocked when every file it lists is `resolved`.
- **Frontier**: scan `.scratch/<effort>/issues/` for files that are open, unblocked, and unclaimed; first by number wins. For implementation tickets the same scan reads `Status: open` + `Frontier: yes`.
- **Claim**: set `Status: claimed` and save before any work.
- **Resolve**: append the answer under an `## Answer` heading, set `Status: resolved`, then append a context pointer (gist + link) to the map's Decisions-so-far in `map.md`.