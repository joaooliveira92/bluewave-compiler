import { Map as MapIcon } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { Button } from "../../components/ui/button.js";
import { CardContent, CardHeader, CardTitle } from "../../components/ui/card.js";
import { GlassCard } from "@/components/ui/glass-card.js";
import { Skeleton } from "../../components/ui/skeleton.js";
import { useWorldMapController } from "../../components/world-map/useWorldMapController.js";
import { cn } from "../../lib/utils.js";

// The map (Canvas renderer + 2 MB coastline) is the heaviest thing on the home
// screen, so it loads lazily and never delays the rest of Overview.
const WorldMapChart = lazy(() =>
  import("../../components/world-map/WorldMapChart.js").then((module) => ({
    default: module.WorldMapChart,
  })),
);

export const MAP_PANEL_SIZES = [
  { id: "compact", label: "Compact", className: "h-80" },
  { id: "large", label: "Large", className: "h-[34rem]" },
  { id: "fill", label: "Fill", className: "h-[calc(100vh-14rem)] min-h-[28rem]" },
] as const;

export type MapPanelSize = (typeof MAP_PANEL_SIZES)[number]["id"];

/**
 * The world map as the Overview's primary panel (spec M-1): live ownership,
 * fleets and routes for the active campaign, sized to taste. F1 still opens the
 * same map full-screen from any screen.
 */
export function OverviewMapPanel({ sessionId }: { readonly sessionId: string }) {
  const [size, setSize] = useState<MapPanelSize>("compact");
  const map = useWorldMapController(sessionId);
  const active = MAP_PANEL_SIZES.find((option) => option.id === size) ?? MAP_PANEL_SIZES[0];

  return (
    <GlassCard glassVariant="liquid-refract" data-testid="overview-map-panel">
      <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
        <CardTitle className="flex items-center gap-1.5 text-sm font-medium">
          <MapIcon className="h-4 w-4 text-muted-foreground" />
          World map
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            F1 opens it full-screen
          </span>
          <div role="group" aria-label="Map size" className="flex gap-1">
            {MAP_PANEL_SIZES.map((option) => (
              <Button
                key={option.id}
                type="button"
                size="sm"
                variant={option.id === size ? "default" : "outline"}
                aria-pressed={option.id === size}
                onClick={() => setSize(option.id)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn("transition-[height] duration-200", active.className)}>
          <Suspense fallback={<Skeleton className="h-full w-full rounded-lg" />}>
            <WorldMapChart
              className="h-full"
              variant="panel"
              showMinimap={size !== "compact"}
              {...map}
            />
          </Suspense>
        </div>
      </CardContent>
    </GlassCard>
  );
}
