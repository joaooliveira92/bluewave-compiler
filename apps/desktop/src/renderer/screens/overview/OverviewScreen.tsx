import {
  Anchor,
  Banknote,
  Flag,
  FlaskConical,
  Hammer,
  LayoutDashboard,
  MapPin,
  Ship,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "../../components/shared/PageHeader.js";
import { Badge } from "../../components/ui/badge.js";
import { Button } from "../../components/ui/button.js";
import { CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card.js";
import { Skeleton } from "../../components/ui/skeleton.js";
import type { Screen } from "../../shell/AppSidebar.js";
import {
  applyLoadFailed,
  applyProjectionLoaded,
  initialOverviewScreenState,
  monthLabel,
  summarizeFleet,
  totalPortCapacity,
} from "./overview-screen-state.js";
import { GlassCard } from "@/components/ui/glass-card.js";

export interface OverviewScreenProps {
  readonly sessionId: string;
  readonly onNavigate: (screen: Screen) => void;
}

export function OverviewScreen({ sessionId, onNavigate }: OverviewScreenProps) {
  const bridge = window.bluewave;
  const [state, setState] = useState(initialOverviewScreenState);

  const loadScreen = useCallback(async () => {
    if (bridge === undefined) {
      setState((current) => applyLoadFailed(current, "Bluewave bridge not available"));
      return;
    }
    const result = await bridge.campaign.execute("inspectCampaign", sessionId);
    if (result.outcome !== "success") {
      setState((current) => applyLoadFailed(current, result.reason));
      return;
    }
    setState((current) => applyProjectionLoaded(current, result.value.projection));
  }, [bridge, sessionId]);

  useEffect(() => {
    void loadScreen();
  }, [loadScreen]);

  const { projection, loadError } = state;

  if (loadError !== null) {
    return (
      <GlassCard glassVariant="liquid-refract" className="border-destructive/50">
        <CardContent className="p-4 text-destructive">
          Failed to load campaign overview: {loadError}
        </CardContent>
      </GlassCard>
    );
  }

  if (projection === null) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((idx) => (
          <Skeleton key={idx} className="h-28" />
        ))}
      </div>
    );
  }

  const fleetSummary = summarizeFleet(projection);

  return (
    <div className="space-y-8">
      <PageHeader
        icon={LayoutDashboard}
        title="Campaign Overview"
        description={
          <>
            {monthLabel(projection.month)} · Revision {projection.revision} · Session{" "}
            <span className="font-mono">{sessionId}</span>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <GlassCard glassVariant="liquid-refract">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-1.5 text-sm font-medium">
              <Banknote className="h-4 w-4 text-muted-foreground" />
              Treasury
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-semibold tracking-tight">
              {projection.economy.treasury.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              +{projection.economy.monthlyAppropriation.toLocaleString()} / month
            </p>
          </CardContent>
        </GlassCard>

        <GlassCard glassVariant="liquid-refract">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-1.5 text-sm font-medium">
              <Ship className="h-4 w-4 text-muted-foreground" />
              Fleet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-semibold tracking-tight">{fleetSummary.totalShips}</p>
            <p className="text-xs text-muted-foreground">
              {fleetSummary.divisionCount} division
              {fleetSummary.divisionCount === 1 ? "" : "s"} across {fleetSummary.fleetCount} fleet
              {fleetSummary.fleetCount === 1 ? "" : "s"}
            </p>
          </CardContent>
        </GlassCard>

        <GlassCard glassVariant="liquid-refract">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-1.5 text-sm font-medium">
              <Hammer className="h-4 w-4 text-muted-foreground" />
              Shipyard Capacity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-semibold tracking-tight">
              {projection.economy.shipyardCapacity}
            </p>
            <p className="text-xs text-muted-foreground">capacity units available</p>
          </CardContent>
        </GlassCard>

        <GlassCard glassVariant="liquid-refract">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-1.5 text-sm font-medium">
              <FlaskConical className="h-4 w-4 text-muted-foreground" />
              Research
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-semibold tracking-tight">
              {projection.knownTechnologyIds.length}
            </p>
            <p className="text-xs text-muted-foreground">technologies known</p>
          </CardContent>
        </GlassCard>

        <GlassCard glassVariant="liquid-refract">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-1.5 text-sm font-medium">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Strategic Presence
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-semibold tracking-tight">{projection.ports.length}</p>
            <p className="text-xs text-muted-foreground">
              ports · {totalPortCapacity(projection)} capacity · {projection.strategicAreas.length}{" "}
              areas
            </p>
          </CardContent>
        </GlassCard>

        <GlassCard glassVariant="liquid-refract">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-1.5 text-sm font-medium">
              <Flag className="h-4 w-4 text-muted-foreground" />
              Diplomacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-semibold tracking-tight">
              {projection.knownEnemyNations.length}
            </p>
            <p className="text-xs text-muted-foreground">
              {projection.knownEnemyNations.length === 0
                ? "no known enemies"
                : projection.knownEnemyNations.join(", ")}
            </p>
          </CardContent>
        </GlassCard>
      </div>

      <GlassCard glassVariant="liquid-refract">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          <CardDescription>Jump straight to the relevant desk.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => onNavigate("construction")}>
            <Hammer className="h-3.5 w-3.5" />
            Construction
          </Button>
          <Button variant="outline" size="sm" onClick={() => onNavigate("fleet")}>
            <Ship className="h-3.5 w-3.5" />
            Fleet
          </Button>
          <Button variant="outline" size="sm" onClick={() => onNavigate("simulation")}>
            <Anchor className="h-3.5 w-3.5" />
            Simulation & Turn
          </Button>
        </CardContent>
      </GlassCard>

      <GlassCard glassVariant="liquid-refract">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Campaign Identity</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 font-mono text-xs">
          <div>
            <p className="text-[12px] uppercase tracking-wider text-muted-foreground">
              Campaign ID
            </p>
            <p className="mt-0.5">{projection.campaignIdentity}</p>
          </div>
          <div>
            <p className="text-[12px] uppercase tracking-wider text-muted-foreground">
              Snapshot Hash
            </p>
            <Badge variant="outline" className="mt-0.5 font-mono">
              {projection.snapshotHash.slice(0, 16)}…
            </Badge>
          </div>
        </CardContent>
      </GlassCard>
    </div>
  );
}
