import { resolve } from "node:path";

/**
 * Resolves `content/production/1880` relative to this file. Works whether
 * this module runs from source (`src/main/contentPack.ts`) or from the
 * electron-vite build output (`out/main/contentPack.js`) — both sit at the
 * same depth under the repo root (`apps/desktop/{src,out}/main`), so the
 * same four `..` segments reach the repo root either way.
 *
 * `pnpm dev` (no packaging) is the desktop-mvp map's agreed distribution
 * mechanism, so resolving relative to the repo root at dev-time is
 * sufficient — packaged-app path resolution is explicitly out of scope.
 */
export function resolveProductionPackDir(): string {
  return resolve(import.meta.dirname, "../../../..", "content", "production", "1880");
}

/**
 * Resolves the generated content artifact directory (`content/generated/1880`)
 * relative to this file, using the same repo-root depth as
 * `resolveProductionPackDir`. The artifact is produced by `content:build`
 * (ADR-0122) and consumed read-only by the main process (ticket 03); the
 * packaged-app resolution from application resources is ticket 05.
 */
export function resolveGeneratedContentDir(): string {
  return resolve(import.meta.dirname, "../../../..", "content", "generated", "1880");
}
