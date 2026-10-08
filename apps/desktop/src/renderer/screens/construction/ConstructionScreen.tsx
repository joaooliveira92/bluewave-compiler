import { useState } from "react";
import { Hammer } from "lucide-react";
import { PageHeader } from "../../components/shared/PageHeader.js";
import { Badge } from "../../components/ui/badge.js";
import { debugRevisionActions } from "../../components/shared/debugRevisionActions.js";
import { Skeleton } from "../../components/ui/skeleton.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs.js";
import { StatsPanel } from "./components/StatsPanel.js";
import { ConstructionWizard } from "./components/ConstructionWizard.js";
import { DesignPicker } from "./components/DesignPicker.js";
import { CommandTable } from "./components/CommandTable.js";
import { LoadErrorCard } from "./components/LoadErrorCard.js";
import { useConstructionScreen } from "./hooks/useConstructionScreen.js";
import { CollapsibleSection } from "../../components/shared/CollapsibleSection.js";
import { DeferredFeaturesPanel } from "../../components/shared/DeferredFeaturesPanel.js";
import { DEFERRED_CONSTRUCTION_ITEMS } from "./construction-screen-state.js";
import { DrawingBoard } from "./drawing-board/DrawingBoard.js";

export function ConstructionScreen({ sessionId }: { readonly sessionId: string }) {
  const {
    state,
    loadError,
    selectedDesignId,
    request,
    loadScreen,
    setSelectedDesignId,
    submit,
    replace,
    cancel,
  } = useConstructionScreen(sessionId);
  const [activeTab, setActiveTab] = useState("overview");
  const [wizardOpen, setWizardOpen] = useState(false);
  const selectedDesign = state.designs.find((d) => d.designId === selectedDesignId) ?? null;

  if (loadError !== null) {
    return (
      <div data-guided-target="construction">
        <LoadErrorCard message={loadError} onReload={() => void loadScreen()} />
      </div>
    );
  }

  if (state.workspace === null || state.economy === null) {
    return (
      <div data-guided-target="construction" className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[0, 1, 2].map((idx) => (
          <Skeleton key={idx} className="h-24" />
        ))}
      </div>
    );
  }

  const busy = state.pendingRequest !== null || state.requiresRefresh;
  const submittedCount = state.workspace.commands.filter(
    (command) => command.status === "submitted",
  ).length;

  return (
    <div data-guided-target="construction" className="space-y-6">
      <PageHeader
        icon={Hammer}
        title="Construction Commands"
        description="Drydock procurement and shipyard queue management."
        actions={debugRevisionActions(state.month, state.revision)}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Shipyard Ledger</TabsTrigger>
          <TabsTrigger value="catalog">Design Catalog</TabsTrigger>
          <TabsTrigger value="drawing-board">Drawing Board</TabsTrigger>
          <TabsTrigger value="commands">
            Command Ledger
            {submittedCount > 0 && (
              <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs">
                {submittedCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <StatsPanel economy={state.economy} workspace={state.workspace} />
        </TabsContent>

        <TabsContent value="catalog">
          {!wizardOpen ? (
            <DesignPicker
              designs={state.designs}
              selectedDesignId={selectedDesignId}
              onSelectDesign={setSelectedDesignId}
              onSubmit={() => setWizardOpen(true)}
              onRefresh={() => void loadScreen()}
              busy={busy}
              hasPendingRequest={request.outcomeUnknown}
              onRetry={request.outcomeUnknown ? request.retry : undefined}
              notice={state.notice}
            />
          ) : (
            <ConstructionWizard
              design={selectedDesign}
              economy={state.economy}
              workspace={state.workspace}
              busy={busy}
              notice={state.notice}
              onConfirm={() => {
                submit();
                setWizardOpen(false);
              }}
              onCancelWizard={() => setWizardOpen(false)}
            />
          )}
        </TabsContent>

        <TabsContent value="drawing-board">
          <DrawingBoard sessionId={sessionId} />
        </TabsContent>

        <TabsContent value="commands">
          <CommandTable
            commands={state.workspace.commands}
            busy={busy}
            selectedDesignId={selectedDesignId}
            onReplace={replace}
            onCancel={cancel}
          />
        </TabsContent>
      </Tabs>

      <CollapsibleSection
        title="Not yet modelled"
        testId="construction-deferred-section"
        summary={`${DEFERRED_CONSTRUCTION_ITEMS.length} items`}
      >
        <DeferredFeaturesPanel
          items={DEFERRED_CONSTRUCTION_ITEMS}
          testId="construction-deferred"
          title="Construction features the engine cannot supply yet"
        />
      </CollapsibleSection>
    </div>
  );
}
