import { useCallback, useEffect, useMemo, useState } from "react";
import { resolvePlayerNationId } from "./area-tree.js";
import { EMPTY_LIVE_OVERLAY, joinWorldMap, type LiveWorldMapOverlay } from "./campaign-map-join.js";
import {
  initialMapPrototypeState,
  pushRuler,
  readRoute,
  selectArea,
  toggleLayer,
  type LayerId,
  type MapPrototypeState,
  type RouteReading,
} from "./map-state.js";
import type { ProjectionId } from "./projection.js";
import type { AreaId } from "./fixture-world.js";

export interface WorldMapController {
  readonly state: MapPrototypeState;
  readonly route: RouteReading | null;
  readonly overlay: LiveWorldMapOverlay;
  readonly onSelect: (area: AreaId | null) => void;
  readonly onRuler: (area: AreaId) => void;
  readonly onToggleLayer: (layer: LayerId) => void;
  readonly onSetProjection: (projection: ProjectionId) => void;
  readonly onSetCentre: (centre: number) => void;
  readonly onToggleClosedPassages: () => void;
}

/**
 * Everything a world-map host needs: the interaction state, the route reading,
 * and the live campaign overlay. Shared by the F1 sheet and the Overview panel
 * so both draw the same world the same way. Falls back to the static fixture
 * when there is no session (or the bridge/inspection fails) so the map still
 * renders.
 */
export function useWorldMapController(sessionId: string | null): WorldMapController {
  const [state, setState] = useState(initialMapPrototypeState);
  const [baseOverlay, setOverlay] = useState<LiveWorldMapOverlay>(EMPTY_LIVE_OVERLAY);
  const [playerNationId, setPlayerNationId] = useState<string | null>(null);

  useEffect(() => {
    const bridge = window.bluewave;
    if (bridge === undefined || sessionId === null) {
      setOverlay(EMPTY_LIVE_OVERLAY);
      return;
    }
    let active = true;
    bridge.campaign
      .execute("inspectMap", sessionId)
      .then((result) => {
        if (!active) return;
        if (result.outcome !== "success") {
          setOverlay(EMPTY_LIVE_OVERLAY);
          setPlayerNationId(null);
          return;
        }
        setOverlay(joinWorldMap(result.value.world));
        // The tree's Ships / Possessions lenses are the player's: resolve who that is.
        return Promise.resolve(bridge.campaign.execute("inspectCampaign", sessionId))
          .then((campaign) => {
            if (!active) return;
            setPlayerNationId(
              campaign?.outcome === "success"
                ? resolvePlayerNationId(result.value.world, campaign.value.projection.nationName)
                : null,
            );
          })
          .catch(() => {
            if (active) setPlayerNationId(null);
          });
      })
      .catch(() => {
        if (active) setOverlay(EMPTY_LIVE_OVERLAY);
      });
    return () => {
      active = false;
    };
  }, [sessionId]);

  const overlay = useMemo(
    () => (baseOverlay.source === "campaign" ? { ...baseOverlay, playerNationId } : baseOverlay),
    [baseOverlay, playerNationId],
  );

  const onSelect = useCallback(
    (area: AreaId | null) => setState((current) => selectArea(current, area)),
    [],
  );
  const onRuler = useCallback(
    (area: AreaId) => setState((current) => pushRuler(current, area)),
    [],
  );
  const onToggleLayer = useCallback(
    (layer: LayerId) => setState((current) => toggleLayer(current, layer)),
    [],
  );
  const onSetProjection = useCallback(
    (projection: ProjectionId) => setState((current) => ({ ...current, projection })),
    [],
  );
  const onSetCentre = useCallback(
    (centre: number) => setState((current) => ({ ...current, centre })),
    [],
  );
  const onToggleClosedPassages = useCallback(
    () =>
      setState((current) => ({
        ...current,
        respectClosedPassages: !current.respectClosedPassages,
      })),
    [],
  );

  return {
    state,
    route: readRoute(state),
    overlay,
    onSelect,
    onRuler,
    onToggleLayer,
    onSetProjection,
    onSetCentre,
    onToggleClosedPassages,
  };
}
