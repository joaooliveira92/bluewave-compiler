// apps/desktop/src/renderer/zodJitless.ts
// Force Zod into its jitless (non-`new Function`) parser *before* any schema is
// parsed in the renderer.
//
// Why this exists: Zod v4 detects eval support by running
// `try { new Function(""); return true; } catch { return false; }`
// (zod/src/v4/core/util.ts, `allowsEval`). The production renderer runs under a
// strict Content-Security-Policy (`default-src 'self'`, no 'unsafe-eval' —
// src/main/csp.ts), so that probe throws. Zod catches the throw and falls back
// to the jitless parser, but Chromium still logs the blocked `new Function` as
// an `error`-level console message. That false positive failed the packaged
// release smoke (`scripts/packaged-smoke.mjs` -> "no renderer errors").
//
// Setting `jitless` makes Zod skip the probe entirely. This is not a behaviour
// change in production — the strict CSP already forced the jitless path there;
// it only removes the console noise. Zod's config object lives on `globalThis`,
// so this applies to every Zod instance in the bundle regardless of how many
// modules import it.
import { z } from "zod";

z.config({ jitless: true });
