# Golden re-pin — release-readiness blocker

**Date:** 2026-10-12 · **Branch:** `dev` · **Trigger:** `determinism.yml` CI gate red on `dev`

## Symptom

`node scripts/verify-golden-hashes.cjs` failed on a clean `dev` checkout with four
mismatches. `golden/hashes.json` had not been updated since `bccfb2a1`
(2026-10-08, officer corps); 350 commits landed after it, **92** of them touching
authoritative packages, so the reference hashes were stale rather than flaky.

## Determinism proof (ADR-0007)

Two fresh child-process runs on the same build are byte-identical, and the
repinned reference is reproduced exactly:

```
node packages/cross-process-test/dist/run-child.js   # twice -> identical JSON
node scripts/verify-golden-hashes.cjs                # All 10 hashes match
```

## Old -> new hash pairs

| Hash                     | Old                                                                | New                                                                |
| ------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `initialSnapshotHash`    | `16708259cc8018447fbe3c88c2ddfb737a27c3e51e8892c9b5fa112f6be896a5` | `081cce36fc73cd53364c95b90dc9d0338ec65109ec5d03234848df5a3e80cf92` |
| `closingSnapshotHash`    | `bdc8d346ad7662be2911ffc839826f25a29eed937218351dd6e15de6a9c0efe5` | `5539aa54cd6abd841db043875b5b8e3fcb5c8cf7e9dd5390752edc6b6be0b099` |
| `commandLedgerHash`      | `48fa215feeaea217c0f3906ebf99c3deddb8697eb6090dd6ae3fa84ea3841a20` | `fed751490b0dae0eec86380c8685fb3b5099258c2d6ff1996fb29146c250b130` |
| `replayVerificationHash` | `097f992919bdcf70707c8e549a43d008a8169aa90ca67245fcc5d0cdee14b711` | `fa8aa3893d79653c2e1e8be6290767e761bcfc9c0f45ed7cbf9dac6ef3a4d288` |

`contentArtifactHash`, `eventLedgerHash`, `financialLedgerHash`,
`randomDecisionLedgerHash`, `battleGenerationHash` and `success` are **unchanged**.
Only the snapshot, command-ledger and replay-verification hashes moved — the
signature of serializer / compatibility-envelope changes, not altered battle
outcomes.

## Cause

Accumulated authoritative changes since `bccfb2a1` that were not re-pinned with
their originating commits, chiefly:

- `bde40845` — bump the save-compatibility version (`ADR-0129`); compatibility
  versions are part of the domain-separated hash envelopes, so this changes the
  snapshot/command/replay hashes without changing behaviour.
- the Effect v4 Schema migration of the persistence and content boundaries
  (`8a789b91`, `d51eada3`, `5df46569`, `652da67e`, `248cd6ed`) and the content
  profiling commit (`4fac57ea`).

This is a **deliberate repin** per `docs/agents/golden-repinning.md`, not a
regression masking. Behaviour is unchanged; the determinism reference is
re-baselined to the current serializer/compatibility version.

## Follow-up

Re-run `node scripts/verify-golden-hashes.cjs` at the release freeze: any further
authoritative change on `dev` must carry its own re-pin in the same commit
(`docs/agents/golden-repinning.md`).
