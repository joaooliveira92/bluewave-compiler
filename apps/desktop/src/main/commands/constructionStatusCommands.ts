import type {
  AuthorizeDockExpansionCommand,
  CancelConstructionProjectCommand,
  HaltConstructionCommand,
  OrderConstructionCommand,
  OrderForeignConstructionCommand,
  ResumeConstructionCommand,
  SetAccelerationCommand,
} from "@bluewave/commands";
import type { BridgeResult } from "../../shared/bridge-contract.js";
import type {
  AuthorizeDockExpansionCommandPayload,
  CancelConstructionProjectCommandPayload,
  ConstructionCommandQueuedOutcome,
  HaltConstructionCommandPayload,
  OrderConstructionBatchCommandPayload,
  PlaceForeignConstructionCommandPayload,
  ResumeConstructionCommandPayload,
  SetAccelerationCommandPayload,
} from "../../shared/construction-contract.js";
import { submitPlayerCommand, type PlayerCommandRequest } from "./playerCommandSupport.js";

/**
 * The Construction screen's steering commands (DESIGN-23 sections 3-8; SB3-R5/R8/R11/R16): halt, resume, accelerate,
 * the class-order batch and the dock-expansion authorization.
 *
 * These are the reachability wiring for the engine entry points that previously had no production caller. Each queues
 * a real engine command envelope through the shared `submitPlayerCommand` seam (issue-time validation is the engine's
 * own `CommandLifecycle.validate`), so the engine's `command_collection` phase — not the desktop — is the sole
 * mutator of authoritative state. `commitMonth` drains the queue and applies the commands.
 */

export async function haltConstructionCommand(
  payload: HaltConstructionCommandPayload,
): Promise<BridgeResult<ConstructionCommandQueuedOutcome>> {
  const request: PlayerCommandRequest<HaltConstructionCommand> = {
    sessionId: payload.sessionId,
    expectedRevision: payload.expectedRevision,
    transportRequestId: payload.transportRequestId,
    build: (record) => ({
      body: {
        type: "HaltConstruction",
        nationId: record.playerSlotId,
        projectId: payload.projectId,
      },
      discriminator: payload.projectId,
    }),
  };
  return await submitPlayerCommand(request);
}

export async function resumeConstructionCommand(
  payload: ResumeConstructionCommandPayload,
): Promise<BridgeResult<ConstructionCommandQueuedOutcome>> {
  const request: PlayerCommandRequest<ResumeConstructionCommand> = {
    sessionId: payload.sessionId,
    expectedRevision: payload.expectedRevision,
    transportRequestId: payload.transportRequestId,
    build: (record) => ({
      body: {
        type: "ResumeConstruction",
        nationId: record.playerSlotId,
        projectId: payload.projectId,
      },
      discriminator: payload.projectId,
    }),
  };
  return await submitPlayerCommand(request);
}

export async function setAccelerationCommand(
  payload: SetAccelerationCommandPayload,
): Promise<BridgeResult<ConstructionCommandQueuedOutcome>> {
  const request: PlayerCommandRequest<SetAccelerationCommand> = {
    sessionId: payload.sessionId,
    expectedRevision: payload.expectedRevision,
    transportRequestId: payload.transportRequestId,
    build: (record) => ({
      body: {
        type: "SetAcceleration",
        nationId: record.playerSlotId,
        projectId: payload.projectId,
        accelerated: payload.accelerated,
      },
      discriminator: `${payload.projectId}:${String(payload.accelerated)}`,
    }),
  };
  return await submitPlayerCommand(request);
}

export async function cancelConstructionProjectCommand(
  payload: CancelConstructionProjectCommandPayload,
): Promise<BridgeResult<ConstructionCommandQueuedOutcome>> {
  const request: PlayerCommandRequest<CancelConstructionProjectCommand> = {
    sessionId: payload.sessionId,
    expectedRevision: payload.expectedRevision,
    transportRequestId: payload.transportRequestId,
    build: (record) => ({
      body: {
        type: "CancelConstructionProject",
        nationId: record.playerSlotId,
        projectId: payload.projectId,
      },
      discriminator: payload.projectId,
    }),
  };
  return await submitPlayerCommand(request);
}

export async function orderConstructionBatchCommand(
  payload: OrderConstructionBatchCommandPayload,
): Promise<BridgeResult<ConstructionCommandQueuedOutcome>> {
  const request: PlayerCommandRequest<OrderConstructionCommand> = {
    sessionId: payload.sessionId,
    expectedRevision: payload.expectedRevision,
    transportRequestId: payload.transportRequestId,
    build: (record) => ({
      body: {
        type: "OrderConstruction",
        nationId: record.playerSlotId,
        designVersionId: payload.designVersionId,
        quantity: payload.quantity,
      },
      discriminator: `${payload.designVersionId}:${String(payload.quantity)}`,
    }),
  };
  return await submitPlayerCommand(request);
}

export async function authorizeDockExpansionCommand(
  payload: AuthorizeDockExpansionCommandPayload,
): Promise<BridgeResult<ConstructionCommandQueuedOutcome>> {
  const request: PlayerCommandRequest<AuthorizeDockExpansionCommand> = {
    sessionId: payload.sessionId,
    expectedRevision: payload.expectedRevision,
    transportRequestId: payload.transportRequestId,
    build: (record) => ({
      body: {
        type: "AuthorizeDockExpansion",
        nationId: record.playerSlotId,
        possessionId: payload.possessionId,
      },
      discriminator: payload.possessionId,
    }),
  };
  return await submitPlayerCommand(request);
}

export async function placeForeignConstructionCommand(
  payload: PlaceForeignConstructionCommandPayload,
): Promise<BridgeResult<ConstructionCommandQueuedOutcome>> {
  const request: PlayerCommandRequest<OrderForeignConstructionCommand> = {
    sessionId: payload.sessionId,
    expectedRevision: payload.expectedRevision,
    transportRequestId: payload.transportRequestId,
    build: (record) => ({
      body: {
        type: "OrderForeignConstruction",
        nationId: record.playerSlotId,
        designVersionId: payload.designVersionId,
        builderNationId: payload.builderNationId,
        quantity: payload.quantity,
        ...(payload.plannedDeliveryMonth === undefined
          ? {}
          : { plannedDeliveryMonth: payload.plannedDeliveryMonth }),
      },
      discriminator: `${payload.designVersionId}:${payload.builderNationId}`,
    }),
  };
  return await submitPlayerCommand(request);
}
