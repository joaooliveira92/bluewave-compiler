import { DeferredFeaturesPanel } from "../../../components/shared/DeferredFeaturesPanel.js";
import { useCampaignRevision } from "../../../shell/CampaignShellContext.js";
import { useBattleHistory } from "../../diplomacy/hooks/useBattleHistory.js";
import { useDivisionOrganization } from "../hooks/useDivisionOrganization.js";
import { DEFERRED_FLEET_ITEMS, playerLossRows } from "../fleet-sections-state.js";
import { CollapsibleSection } from "../../../components/shared/CollapsibleSection.js";
import { FleetLossesSection } from "./FleetLossesSection.js";
import { FleetOfficersSection } from "./FleetOfficersSection.js";

/**
 * Fleet's report sections (CC-8): Losses, Officers and the not-yet-modelled list. All collapsed by
 * default so Fleet stays a working screen, not a wall; each is one click from the Fleet screen.
 */
export function FleetReportSections({ sessionId }: { readonly sessionId: string }) {
  const revision = useCampaignRevision();
  const history = useBattleHistory(sessionId, revision ?? 0);
  const organization = useDivisionOrganization(sessionId);
  const lossCount =
    history.status === "ready" ? playerLossRows(history.history.battles).length : null;
  const divisions = organization.state.divisions;
  return (
    <div className="space-y-3" data-testid="fleet-report-sections">
      <CollapsibleSection
        title="Losses"
        testId="fleet-losses"
        summary={lossCount === null ? undefined : `${lossCount} sunk`}
      >
        <FleetLossesSection state={history} />
      </CollapsibleSection>
      <CollapsibleSection
        title="Officers"
        testId="fleet-officers"
        summary={`${divisions.length} divisions`}
      >
        <FleetOfficersSection divisions={divisions} />
      </CollapsibleSection>
      <CollapsibleSection
        title="Not yet modelled"
        testId="fleet-deferred"
        summary={`${DEFERRED_FLEET_ITEMS.length} items`}
      >
        <DeferredFeaturesPanel
          items={DEFERRED_FLEET_ITEMS}
          testId="submarines-deferred"
          title="Fleet features the engine cannot supply yet"
        />
      </CollapsibleSection>
    </div>
  );
}
