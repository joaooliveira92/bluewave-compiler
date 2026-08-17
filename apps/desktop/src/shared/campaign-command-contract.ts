import type {
  BattleManifest,
  BattleResolution,
  CampaignConfiguration,
  CommitMonthResponse,
  OpeningBriefingProjection,
  PlayerProjection,
  RandomDecisionRecord,
  RawScriptedForceOrder,
  ReplayBattleBoundaryResponse,
  TacticalBattleOutcome,
} from "@bluewave/campaign-engine";
import type { WorldMapView } from "@bluewave/campaign-engine";
import type { BridgeResult, CommandEnvelope } from "./bridge-contract.js";
import type {
  LoadCampaignResponse,
  RecoverCampaignResponse,
  ReplayCampaignResponse,
  VerifyCampaignResponse,
} from "./continuity-contract.js";
import type { NewGameOptions } from "./new-game-contract.js";
import type {
  CancelConstructionCommandPayload,
  ConstructionCommandOutcome,
  ConstructionScreenProjection,
  ReplaceConstructionCommandPayload,
  SubmitConstructionCommandPayload,
} from "./construction-contract.js";
import type {
  CancelMovementCommandPayload,
  FleetScreenProjection,
  MovementCommandOutcome,
  ReplaceMovementCommandPayload,
  SubmitMovementCommandPayload,
} from "./fleet-contract.js";
import type {
  DiplomacyCommandOutcome,
  DiplomacyScreenProjection,
  SubmitDiplomacyCommandPayload,
} from "./diplomacy-contract.js";
import type {
  ResearchPriorityOutcome,
  ResearchScreenProjection,
  SetResearchPriorityCommandPayload,
} from "./research-contract.js";

/**
 * Request payloads for the simulation domain (battle-related types live in
 * `@bluewave/campaign-engine` alongside their results, grounded in real
 * screen usage per ticket 09's addendum).
 */

export type CommitMonthPayload = CommandEnvelope;

export interface GenerateBattlePayload {
  readonly sessionId: string;
  readonly warId: string;
}

export interface GenerateBattleResult {
  readonly manifest: BattleManifest;
  readonly randomDecisions: readonly RandomDecisionRecord[];
}

export interface ResolveBattlePayload {
  readonly sessionId: string;
  readonly battleId: string;
}

export interface ResolveBattleResult {
  readonly resolution: BattleResolution;
}

export interface ResolveTacticalBattlePayload {
  readonly sessionId: string;
  readonly battleId: string;
  readonly turnCount: number;
  readonly scriptedOrders: readonly RawScriptedForceOrder[];
}

export interface ResolveTacticalBattleResult {
  readonly outcome: TacticalBattleOutcome;
  readonly randomDecisions?: readonly RandomDecisionRecord[];
}

export interface ReplayBattleBoundaryPayload {
  readonly sessionId: string;
  readonly battleId: string;
}

export interface CompileCampaignResult {
  readonly sessionId: string;
}

export interface InspectCampaignResult {
  readonly projection: PlayerProjection;
}

export interface InspectOpeningBriefingResult {
  readonly projection: OpeningBriefingProjection;
}

export interface InspectMapResult {
  readonly revision: number;
  readonly month: { readonly month: number; readonly year: number };
  readonly world: WorldMapView;
}

export interface SaveCampaignResult {
  readonly revision: number;
}

/**
 * Single source of truth for the command name set — `campaignBridge.ts`'s
 * runtime registry derives from this instead of hand-duplicating the list.
 * TypeScript can't generate overload signatures from a runtime tuple, so
 * `CampaignCommandClient` below must still list each command by hand; keep
 * the two in sync when adding a command (a mismatch fails
 * `campaignBridge.test.ts`).
 */
export const CAMPAIGN_COMMAND_NAMES = [
  "listNewGameOptions",
  "compileCampaign",
  "inspectCampaign",
  "inspectOpeningBriefing",
  "inspectMap",
  "closeCampaign",
  "saveCampaign",
  "commitMonth",
  "generateBattle",
  "resolveBattle",
  "resolveTacticalBattle",
  "replayBattleBoundary",
  "loadCampaign",
  "verifyCampaign",
  "replayCampaign",
  "recoverCampaign",
  "inspectConstructionScreen",
  "submitConstructionCommand",
  "replaceConstructionCommand",
  "cancelConstructionCommand",
  "inspectFleetScreen",
  "submitMovementCommand",
  "replaceMovementCommand",
  "cancelMovementCommand",
  "inspectResearchScreen",
  "setResearchPriorityCommand",
  "inspectDiplomacyScreen",
  "submitDiplomacyCommand",
] as const;

/**
 * The full `bridge.campaign` surface — one overload per command, grounded
 * in every real call site across the screens (desktop-mvp map tickets
 * 07-10). Overloaded (not a single generic `execute<Value>`) so call sites
 * get the correct result type from the command's literal string alone,
 * matching how every screen already calls it.
 */
export interface CampaignCommandClient {
  execute(command: "listNewGameOptions", payload: undefined): Promise<BridgeResult<NewGameOptions>>;
  execute(
    command: "compileCampaign",
    payload: CampaignConfiguration,
  ): Promise<BridgeResult<CompileCampaignResult>>;
  execute(
    command: "inspectCampaign",
    payload: string,
  ): Promise<BridgeResult<InspectCampaignResult>>;
  execute(
    command: "inspectOpeningBriefing",
    payload: string,
  ): Promise<BridgeResult<InspectOpeningBriefingResult>>;
  execute(command: "inspectMap", payload: string): Promise<BridgeResult<InspectMapResult>>;
  execute(command: "closeCampaign", payload: string): Promise<BridgeResult<unknown>>;
  execute(command: "saveCampaign", payload: string): Promise<BridgeResult<SaveCampaignResult>>;
  execute(
    command: "commitMonth",
    payload: CommitMonthPayload,
  ): Promise<BridgeResult<CommitMonthResponse>>;
  execute(
    command: "generateBattle",
    payload: GenerateBattlePayload,
  ): Promise<BridgeResult<GenerateBattleResult>>;
  execute(
    command: "resolveBattle",
    payload: ResolveBattlePayload,
  ): Promise<BridgeResult<ResolveBattleResult>>;
  execute(
    command: "resolveTacticalBattle",
    payload: ResolveTacticalBattlePayload,
  ): Promise<BridgeResult<ResolveTacticalBattleResult>>;
  execute(
    command: "replayBattleBoundary",
    payload: ReplayBattleBoundaryPayload,
  ): Promise<BridgeResult<ReplayBattleBoundaryResponse>>;
  execute(command: "loadCampaign", payload: undefined): Promise<BridgeResult<LoadCampaignResponse>>;
  execute(
    command: "verifyCampaign",
    payload: undefined,
  ): Promise<BridgeResult<VerifyCampaignResponse>>;
  execute(
    command: "replayCampaign",
    payload: undefined,
  ): Promise<BridgeResult<ReplayCampaignResponse>>;
  execute(
    command: "recoverCampaign",
    payload: undefined,
  ): Promise<BridgeResult<RecoverCampaignResponse>>;
  execute(
    command: "inspectConstructionScreen",
    payload: string,
  ): Promise<BridgeResult<ConstructionScreenProjection>>;
  execute(
    command: "submitConstructionCommand",
    payload: SubmitConstructionCommandPayload,
  ): Promise<BridgeResult<ConstructionCommandOutcome>>;
  execute(
    command: "replaceConstructionCommand",
    payload: ReplaceConstructionCommandPayload,
  ): Promise<BridgeResult<ConstructionCommandOutcome>>;
  execute(
    command: "cancelConstructionCommand",
    payload: CancelConstructionCommandPayload,
  ): Promise<BridgeResult<ConstructionCommandOutcome>>;
  execute(
    command: "inspectFleetScreen",
    payload: string,
  ): Promise<BridgeResult<FleetScreenProjection>>;
  execute(
    command: "submitMovementCommand",
    payload: SubmitMovementCommandPayload,
  ): Promise<BridgeResult<MovementCommandOutcome>>;
  execute(
    command: "replaceMovementCommand",
    payload: ReplaceMovementCommandPayload,
  ): Promise<BridgeResult<MovementCommandOutcome>>;
  execute(
    command: "cancelMovementCommand",
    payload: CancelMovementCommandPayload,
  ): Promise<BridgeResult<MovementCommandOutcome>>;
  execute(
    command: "inspectResearchScreen",
    payload: string,
  ): Promise<BridgeResult<ResearchScreenProjection>>;
  execute(
    command: "setResearchPriorityCommand",
    payload: SetResearchPriorityCommandPayload,
  ): Promise<BridgeResult<ResearchPriorityOutcome>>;
  execute(
    command: "inspectDiplomacyScreen",
    payload: string,
  ): Promise<BridgeResult<DiplomacyScreenProjection>>;
  execute(
    command: "submitDiplomacyCommand",
    payload: SubmitDiplomacyCommandPayload,
  ): Promise<BridgeResult<DiplomacyCommandOutcome>>;
}
