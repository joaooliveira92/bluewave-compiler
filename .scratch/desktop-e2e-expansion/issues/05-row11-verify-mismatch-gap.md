# Desktop E2E Expansion — 05: Row-11 verify-mismatch honesty gap: fix inside this effort or defer

Type: grilling
Status: open
Blocked by: 04 — Scope & Coverage Matrix v2: which flows graduate

## Question

The continuance suite deliberately skipped row 11 ("tamper → Verify surfaces a
mismatch") because the renderer has an **honesty gap**: `verificationResultFromBridge`
(screens/campaign-file/utils/package-operations.ts) maps every
`outcome:"success"` VerifyCampaignResponse — including `{ valid: false,
issues: [...] }` — to the "verify" result kind, and `OperationStatus.tsx`'s
verify branch renders "Package verified — …" unconditionally without reading
`response.valid`/`issues`. Asserting today's copy would enshrine the gap as
expected behavior.

Should the expansion effort **fix that renderer branch and then add row 11's
e2e spec** (accepting a small source change inside an otherwise test-focused
effort, with the fix unit-tested in the renderer suite), **or keep the gap
deferred** (row 11 stays unit-covered in `packages/persistence`, e2e covers
only the recover path)?

The prior suite effort was contractually test-only. Weigh whether this map's
destination (expand e2e to the honest user-visible surface) authorizes the
coupled source fix, or whether the fix should be a scoped source ticket the map
coordinates rather than owns. Record the decision + the row-11 spec shape (or
its deferral reason).