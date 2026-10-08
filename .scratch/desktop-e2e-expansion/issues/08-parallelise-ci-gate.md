# Desktop E2E Expansion — 08: Parallelise / split the CI gate as the suite grows

Type: grilling
Status: open
Blocked by: 04 — Scope & Coverage Matrix v2: which flows graduate

## Question

The prior config decision was `workers: 1`, serial, with an explicit note that
**parallelising is "a deliberate later unlock after isolation is proven."**
The isolation story has since existed (per-test `--user-data-dir` scratch +
file-scoped scratch save dirs, teardown always cleans) — but the suite also
went red (ticket 03) and is about to grow (tickets 04–07). This is that "later"
moment.

Should the expansion **unlock parallelism** (`workers: >1`, per-file isolation,
possibly `project`-split smoke vs full), **stay serial**, or **split the gate**
(fast smoke job + full suite job, or a sharded matrix of files) as the coverage
grows? Weigh the real failure modes: Electron apps in Playwright can run
multi-worker, but the suite's cross-file save-sharing (mvp-loop's `sharedSaveDir`)
and the continuance master fixtures make some specs intrinsically serial —
identify which and how to isolate them; also weigh macOS CI runner budget and
flake-retry behaviour (`retries: 2` + `trace: on-first-retry` is safe only if
isolation genuinely holds). Record the decided CI topology.