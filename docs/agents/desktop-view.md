# Viewing and driving the desktop app

Agents can see and manipulate the Electron renderer through Playwright, reusing the hermetic
harness in `apps/desktop/e2e/fixtures.ts` (temp user-data dir, stubbed file dialogs).

```bash
pnpm --filter @bluewave/desktop build   # required: runs the built app in out/
cd apps/desktop
pnpm run snap                                         # capture the landing screen
pnpm run snap --click "New Campaign"                  # click, then capture
pnpm run snap --click "New Campaign" --press Enter    # actions run in the order given
pnpm run snap --fill "Name=Test" --eval "document.title"
pnpm run snap --selector "main"                       # screenshot one element only
pnpm run snap --make-save /tmp/bw-save                # run the new-game flow, write a campaign package
pnpm run snap --save /tmp/bw-save                     # start from that package (opens on Overview)
pnpm run snap --save /tmp/bw-save --advance 3         # ...then advance three months (Jan -> Apr 1880)
```

Typical agent loop: `--make-save` once (about 10 s), then reuse it with `--save` for every screen you
want to look at. Other flags: `--settle MS` (one extra wait before capture; `--wait` is per action),
`--tour` (keep the first-month guided tour, which is dismissed by default).

From the repo root, `pnpm snap <flags>` rebuilds the desktop app first (so you never view a stale
`out/`) and then runs the same command. Relative `--out`/`--save` paths resolve from `apps/desktop`.

`--save` copies the package to a temp dir (the source is never modified), clicks "Open Campaign",
then runs your actions. The new-game, advance-month and tour-dismiss flows live in
`apps/desktop/e2e/flows.ts`, shared with the e2e specs; fix them there when the UI changes.

The script is named `snap` because `pnpm view` is a built-in pnpm command.

Output goes to `apps/desktop/.dev-data/view/` (git-ignored; override with `--out`):

- `screenshot.png` — read it with the Read tool to look at the UI
- `aria.yaml` — accessibility tree; the best source for control names to pass to `--click`
- `text.txt` — visible text
- `console.log` — renderer console output and uncaught page errors

`--click TEXT` matches a button/link by accessible name first, then falls back to visible text.
Each run is a fresh app instance, so state does not persist between runs; chain every step in
one invocation (the new-game flow takes ~10 clicks/fills; see `aria.yaml` after each step for the
next control name). For multi-step flows that need real logic, write a spec in `apps/desktop/e2e/`.
