import { useMemo } from "react";
import { DEBUG_MODE } from "../../shell/debug-flag.js";
import { Ship } from "lucide-react";
import { PageHeader } from "../../components/shared/PageHeader.js";
import { Badge } from "../../components/ui/badge.js";
import { Separator } from "../../components/ui/separator.js";
import { DEFERRED_SUBMARINE_ITEMS, pendingRouteFor } from "./fleet-screen-state.js";
import { useFleetScreen } from "./hooks/useFleetScreen.js";
import { DivisionPicker } from "./components/DivisionPicker.js";
import { GeographyCard } from "./components/GeographyCard.js";
import { OrderSection } from "./components/OrderSection.js";
import { humanizeId } from "../../lib/humanize-id.js";
import { DeferredFeaturesPanel } from "../../components/shared/DeferredFeaturesPanel.js";
import { WorldMapPanel } from "../../components/world-map/WorldMapPanel.js";
import { MovementCommandsTable } from "./components/MovementCommandsTable.js";
import { LoadErrorCard } from "./components/LoadErrorCard.js";
import { LoadingState } from "./components/LoadingState.js";

function FleetScreen({ sessionId }: { readonly sessionId: string }) {
  const {
    state,
    loadError,
    selectedDivisionId,
    destinationAreaId,
    request,
    loadScreen,
    setSelectedDivisionId,
    setDestinationAreaId,
    submit,
    replace,
    cancel,
  } = useFleetScreen(sessionId);

  const areaNameMap = useMemo(() => new Map(state.areas.map((a) => [a.id, a.name])), [state.areas]);

  const divisionNameMap = useMemo(
    () => new Map(state.divisions.map((d) => [d.divisionId, d.fleetName])),
    [state.divisions],
  );

  function divisionName(divisionId: string): string {
    return divisionNameMap.get(divisionId) ?? humanizeId(divisionId);
  }

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

  const busy = state.pendingRequest !== null || state.requiresRefresh;
  const selectedDivision =
    state.divisions.find((division) => division.divisionId === selectedDivisionId) ?? null;
  const pendingRoute =
    selectedDivision === null ? null : pendingRouteFor(state, selectedDivision.divisionId);

  return (
    <div data-guided-target="fleet" className="space-y-6">
      <PageHeader
        icon={Ship}
        title="Fleet Movement"
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
        <summary className="cursor-pointer text-sm font-medium">
          Reference: areas, routes and ports
        </summary>
        <div className="mt-3">
          <GeographyCard
            areas={state.areas}
            areaEdges={state.areaEdges}
            ports={state.ports}
            areaName={areaName}
          />
        </div>
      </details>
      <Separator />
      <OrderSection
        areas={state.areas}
        selectedDivision={selectedDivision}
        destinationAreaId={destinationAreaId}
        onDestinationChange={setDestinationAreaId}
        pendingRoute={pendingRoute}
        busy={busy}
        onSubmit={submit}
        onReplace={replace}
        onCancel={cancel}
        onRefresh={() => void loadScreen()}
        hasPendingRequest={request.outcomeUnknown}
        onRetry={request.retry}
        notice={state.notice}
        areaName={areaName}
      />
      <Separator />
      <DeferredFeaturesPanel
        items={DEFERRED_SUBMARINE_ITEMS}
        testId="submarines-deferred"
        title="Submarines — not yet modelled by the engine"
      />
      <MovementCommandsTable
        commands={state.movementCommands}
        areaName={areaName}
        divisionName={divisionName}
      />
    </div>
  );
}

export { FleetScreen };
