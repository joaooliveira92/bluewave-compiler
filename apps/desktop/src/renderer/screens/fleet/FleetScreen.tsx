import { useMemo } from "react";
import { DEBUG_MODE } from "../../shell/debug-flag.js";
import { Ship } from "lucide-react";
import { PageHeader } from "../../components/shared/PageHeader.js";
import { Badge } from "../../components/ui/badge.js";
import { Separator } from "../../components/ui/separator.js";
import { buildAreaOverview, pendingRouteFor } from "./fleet-screen-state.js";
import { FleetReportSections } from "./components/FleetReportSections.js";
import { MovementCommandsTable } from "./components/MovementCommandsTable.js";
import { OrderSection } from "./components/OrderSection.js";
import { FleetOrganizationSection } from "./organization/FleetOrganizationSection.js";
import { AreaOverviewTable } from "./components/AreaOverviewTable.js";
import { useFleetScreen } from "./hooks/useFleetScreen.js";
import { DivisionPicker } from "./components/DivisionPicker.js";
import { WorldMapPanel } from "../../components/world-map/WorldMapPanel.js";
import { LoadErrorCard } from "./components/LoadErrorCard.js";
import { LoadingState } from "./components/LoadingState.js";

function FleetScreen({ sessionId }: { readonly sessionId: string }) {
  const {
    state,
    loadError,
    selectedDivisionId,
    destinationAreaId,
    reachableAreas,
    request,
    loadScreen,
    setSelectedDivisionId,
    setDestinationAreaId,
    submit,
    replace,
    cancel,
  } = useFleetScreen(sessionId);

  const areaNameMap = useMemo(() => new Map(state.areas.map((a) => [a.id, a.name])), [state.areas]);

  const areaOverview = useMemo(
    () => buildAreaOverview(state.areas, state.areaEdges, state.ports, state.divisions),
    [state.areas, state.areaEdges, state.ports, state.divisions],
  );

  function areaName(areaId: string): string {
    return areaNameMap.get(areaId) ?? areaId;
  }

  if (loadError !== null) {
    return (
      <div data-guided-target="fleet">
        <LoadErrorCard message={loadError} onReload={() => void loadScreen()} />
      </div>
    );
  }

  if (state.playerNationId === null) {
    return (
      <div data-guided-target="fleet">
        <LoadingState />
      </div>
    );
  }

  const selectedDivision =
    state.divisions.find((division) => division.divisionId === selectedDivisionId) ?? null;

  return (
    <div data-guided-target="fleet" className="space-y-6">
      <PageHeader
        icon={Ship}
        title="Fleet"
        description={
          DEBUG_MODE && state.month !== null
            ? `${state.month.month}/${state.month.year}`
            : undefined
        }
        actions={
          DEBUG_MODE ? (
            <Badge variant="outline" className="font-mono text-xs">
              Rev {state.revision}
            </Badge>
          ) : undefined
        }
      />
      <DivisionPicker
        divisions={state.divisions}
        selectedDivisionId={selectedDivisionId}
        onSelectDivision={setSelectedDivisionId}
        areaName={areaName}
      />
      <Separator />
      <WorldMapPanel
        sessionId={sessionId}
        title="Fleet positions"
        focusAreaId={selectedDivision?.areaId ?? null}
        testId="fleet-map-panel"
      />
      <details className="group rounded-md border px-4 py-3">
        <summary className="cursor-pointer text-sm font-medium">Area overview</summary>
        <div className="mt-3">
          <AreaOverviewTable rows={areaOverview} />
        </div>
      </details>
      <Separator />
      <FleetOrganizationSection sessionId={sessionId} />
      <Separator />
      <OrderSection
        areas={reachableAreas}
        selectedDivision={selectedDivision}
        destinationAreaId={destinationAreaId}
        onDestinationChange={setDestinationAreaId}
        pendingRoute={
          selectedDivisionId === null ? null : pendingRouteFor(state, selectedDivisionId)
        }
        busy={state.pendingRequest !== null || state.requiresRefresh}
        onSubmit={submit}
        onReplace={replace}
        onCancel={cancel}
        onRefresh={() => void loadScreen()}
        hasPendingRequest={request.outcomeUnknown}
        onRetry={request.retry}
        notice={state.notice}
        areaName={areaName}
      />
      <MovementCommandsTable
        commands={state.movementCommands}
        areaName={areaName}
        divisionName={(divisionId) =>
          state.divisions.find((d) => d.divisionId === divisionId)?.fleetName ?? divisionId
        }
      />
      <Separator />
      <FleetReportSections sessionId={sessionId} />
    </div>
  );
}

export { FleetScreen };
