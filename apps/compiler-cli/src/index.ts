//apps/compiler-cli/src/index.ts
//
export {
  runValidate,
  runCompile,
  runInspect,
  runVerify,
  runCompare,
  runCampaignCompile,
  runCampaignSave,
  runCampaignLoad,
  runTurnExecute,
  runReplay,
  runBattleGenerate,
  runBattleAdvanceMinute,
  runGunneryResolveShot,
  safePath,
  buildInput,
  buildCampaignFiles,
  snapshotHash,
  persistedStateHash,
  reviveCampaignSnapshot,
  serializeCampaignSnapshot,
} from "./commands.js";
export type {
  CliOptions,
  CampaignCliOptions,
  BattleGenerateCliOptions,
  BattleAdvanceMinuteCliOptions,
  GunneryResolveShotCliOptions,
  OutputMode,
  ExitCategory,
} from "./commands.js";
export { reportBluewaveError, runCombatOperation } from "./combatDiagnostics.js";
export type { CombatOperationResult } from "./combatDiagnostics.js";
