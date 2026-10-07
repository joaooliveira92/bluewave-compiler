/**
 * Whether debug-only main-process commands (the Tactical Sandbox battle
 * commands, ADR-0055) are available. `__BLUEWAVE_DEBUG__` is replaced at build
 * time by `electron.vite.config.ts` from the same `VITE_BLUEWAVE_DEBUG=true`
 * flag that gates the debug screens in the renderer (ADR-0029), so a normal
 * build contains the constant `false` and rejects these commands.
 */
declare const __BLUEWAVE_DEBUG__: boolean | undefined;

export function isBattleSandboxEnabled(): boolean {
  return typeof __BLUEWAVE_DEBUG__ !== "undefined" && __BLUEWAVE_DEBUG__ === true;
}
