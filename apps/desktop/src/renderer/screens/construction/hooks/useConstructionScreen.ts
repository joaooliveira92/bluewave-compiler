import { useCallback, useState } from "react";
import { useBridge } from "../../../lib/bridge-context.js";
import type {
  ConstructionCommandOutcome,
  ConstructionCommandQueuedOutcome,
  ConstructionScreenProjection,
} from "../../../../shared/construction-contract.js";
import { useCommandScreenWorkflow } from "../../../lib/command-screen-workflow.js";
import { useCampaignRevision } from "../../../shell/CampaignShellContext.js";
import type { ConstructionScreenState } from "../construction-screen-state.js";
import {
  acceptConstructionCommand,
  initialConstructionScreenState,
  nextDesignSelection,
  projectConstructionScreen,
} from "../construction-screen-state.js";

export interface UseConstructionScreenReturn {
  readonly state: ConstructionScreenState;
  readonly loadError: string | null;
  readonly selectedDesignId: string | null;
  readonly request: {
    readonly outcomeUnknown: boolean;
    readonly retry: () => void;
  };
  readonly loadScreen: () => Promise<void>;
  readonly setSelectedDesignId: React.Dispatch<React.SetStateAction<string | null>>;
  readonly submit: () => void;
  readonly replace: (commandId: string) => void;
  readonly cancel: (commandId: string) => void;
  readonly halt: (projectId: string) => void;
  readonly resume: (projectId: string) => void;
  readonly setAcceleration: (projectId: string, accelerated: boolean) => void;
}

export function useConstructionScreen(sessionId: string): UseConstructionScreenReturn {
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);
  const bridge = useBridge();
  const campaignRevision = useCampaignRevision();
  const workflow = useCommandScreenWorkflow<
    ConstructionScreenState,
    ConstructionScreenProjection,
    ConstructionCommandOutcome | ConstructionCommandQueuedOutcome
  >(
    {
      initialState: initialConstructionScreenState,
      load: () =>
        bridge
          ? bridge.campaign.execute("inspectConstructionScreen", sessionId)
          : Promise.reject(new Error("Bluewave bridge not available")),
      project: projectConstructionScreen,
      accept: acceptConstructionCommand,
      onProjection: (projection) =>
        setSelectedDesignId((current) => nextDesignSelection(current, projection.designs)),
    },
    { refreshKey: campaignRevision },
  );
  const { execute } = workflow;

  const submit = useCallback(() => {
    if (!bridge || selectedDesignId === null) return;
    void execute("submit", ({ expectedRevision, transportRequestId }) =>
      bridge.campaign.execute("submitConstructionCommand", {
        sessionId,
        designId: selectedDesignId,
        expectedRevision,
        transportRequestId,
      }),
    );
  }, [bridge, execute, sessionId, selectedDesignId]);

  const replace = useCallback(
    (commandId: string) => {
      if (!bridge || selectedDesignId === null) return;
      void execute("replace", ({ expectedRevision, transportRequestId }) =>
        bridge.campaign.execute("replaceConstructionCommand", {
          sessionId,
          commandId,
          designId: selectedDesignId,
          expectedRevision,
          transportRequestId,
        }),
      );
    },
    [bridge, execute, sessionId, selectedDesignId],
  );

  const cancel = useCallback(
    (commandId: string) => {
      if (!bridge) return;
      void execute("cancel", ({ expectedRevision, transportRequestId }) =>
        bridge.campaign.execute("cancelConstructionCommand", {
          sessionId,
          commandId,
          expectedRevision,
          transportRequestId,
        }),
      );
    },
    [bridge, execute, sessionId],
  );

  // DESIGN-23 sections 7-8: halt, resume and the acceleration toggle queue a real engine envelope that applies on the
  // next `commitMonth`; the current month's readouts stay the engine's own compiled values until then.
  const halt = useCallback(
    (projectId: string) => {
      if (!bridge) return;
      void execute("halt", ({ expectedRevision, transportRequestId }) =>
        bridge.campaign.execute("haltConstructionCommand", {
          sessionId,
          projectId,
          expectedRevision,
          transportRequestId,
        }),
      );
    },
    [bridge, execute, sessionId],
  );

  const resume = useCallback(
    (projectId: string) => {
      if (!bridge) return;
      void execute("resume", ({ expectedRevision, transportRequestId }) =>
        bridge.campaign.execute("resumeConstructionCommand", {
          sessionId,
          projectId,
          expectedRevision,
          transportRequestId,
        }),
      );
    },
    [bridge, execute, sessionId],
  );

  const setAcceleration = useCallback(
    (projectId: string, accelerated: boolean) => {
      if (!bridge) return;
      void execute("accelerate", ({ expectedRevision, transportRequestId }) =>
        bridge.campaign.execute("setAccelerationCommand", {
          sessionId,
          projectId,
          accelerated,
          expectedRevision,
          transportRequestId,
        }),
      );
    },
    [bridge, execute, sessionId],
  );

  return {
    state: workflow.state,
    loadError: workflow.loadError,
    selectedDesignId,
    request: workflow.request,
    loadScreen: workflow.loadScreen,
    setSelectedDesignId,
    submit,
    replace,
    cancel,
    halt,
    resume,
    setAcceleration,
  };
}
