/**
 * The chart's view model: every piece of data the SVG and chrome draw, derived
 * once from the interaction state, the live campaign overlay, the camera and
 * the palette. This is the one place that knows how to merge a campaign over
 * the fixture and how a marker/label ends up positioned, so `WorldMapChart`
 * itself stays a composition root rather than a second body of logic.
 */

import { useEffect, useMemo, useState } from "react";
import {
  AREAS,
  AREAS_BY_ID,
  EDGES,
  FLEETS,
  PASSAGES_BY_ID,
  POSSESSIONS,
  type AreaControl,
} from "./fixture-world.js";
import {
  EMPTY_LIVE_OVERLAY,
  campaignNationHue,
  campaignNationLabel,
  fixtureAnchor,
  type LiveWorldMapOverlay,
} from "./campaign-map-join.js";
import { buildOwnershipRows, describeArea, type AreaOwnershipRow } from "./map-a11y.js";
import { campaignTreeRows, type AreaTreeRow } from "./area-tree.js";
import { areaControl, summariseArea, nationFill, nationName, nationStroke } from "./map-state.js";
import type { MapPrototypeState, RouteReading } from "./map-state.js";
import {
  WORLD_WRAP_TURNS,
  projectAreas,
  type ProjectedArea,
  type Projection,
} from "./projection.js";
import {
  buildFleetMarks,
  buildPortMarks,
  fleetSingles,
  portSingles,
  type AreaAnchors,
  type FleetMark,
  type FleetPlacement,
  type PortMark,
  type PossessionPlacement,
} from "./map-markers.js";
import { layoutLabels, type PlacedLabel } from "./map-label-layout.js";
import { buildGraticule } from "./map-graticule.js";
import type { MapPalette } from "./map-palette.js";
import type { MapCamera } from "./useMapCamera.js";
import type { BorderSet } from "./CoastlineCanvas.js";
import { BORDERS_1880 } from "./borders-1880-data.js";

/** A passage badge and the edge it gates, projected for the current centre. */
export interface PassageMark {
  readonly id: string;
  readonly from: readonly [number, number];
  readonly to: readonly [number, number];
  readonly mid: readonly [number, number];
  readonly open: boolean;
  readonly kind: "canal" | "strait";
}

export interface WorldMapModel {
  readonly state: MapPrototypeState;
  readonly live: boolean;
  readonly playerNationId: string | null;
  readonly areas: readonly ProjectedArea[];
  readonly areasById: ReadonlyMap<string, ProjectedArea>;
  readonly control: ReadonlyMap<string, AreaControl>;
  readonly borderSets: readonly BorderSet[];
  readonly portMarks: readonly PortMark[];
  readonly fleetMarks: readonly FleetMark[];
  readonly passageMarks: readonly PassageMark[];
  readonly placedLabels: readonly PlacedLabel[];
  readonly graticule: string;
  readonly routePath: string;
  readonly routeSet: ReadonlySet<string>;
  readonly ownershipRows: readonly AreaOwnershipRow[];
  readonly rowById: ReadonlyMap<string, AreaOwnershipRow>;
  readonly treeRows: readonly AreaTreeRow[];
  readonly summary: ReturnType<typeof summariseArea>;
  readonly areaName: (id: string) => string;
  readonly fillFor: (nation: string | null, alpha: number) => string;
  readonly strokeFor: (nation: string) => string;
  readonly nameFor: (nation: string | null) => string;
  readonly describeAreaFor: (id: string) => string;
}

export interface WorldMapModelInput {
  readonly state: MapPrototypeState;
  readonly route: RouteReading | null;
  readonly overlay?: LiveWorldMapOverlay;
  readonly projection: Projection;
  readonly palette: MapPalette;
  readonly camera: MapCamera;
  /** The chart root, scanned for floating chrome that labels must avoid. */
  readonly rootRef: React.RefObject<HTMLDivElement | null>;
}

export function useWorldMapModel({
  state,
  route,
  overlay = EMPTY_LIVE_OVERLAY,
  projection,
  palette,
  camera,
  rootRef,
}: WorldMapModelInput): WorldMapModel {
  /** Ownership: live overlay overrides the fixture wherever the campaign maps one. */
  const control = useMemo(() => {
    const merged = new Map(areaControl());
    if (overlay.source !== "campaign") return merged;
    for (const [area, owner] of overlay.ownership) {
      merged.set(area, { owner, contested: false, possessions: 0 });
    }
    return merged;
  }, [overlay]);

  /** The possessions/ports to draw: live campaign ports when active, else fixture. */
  const drawnPorts = useMemo<PossessionPlacement[]>(() => {
    if (overlay.source !== "campaign") {
      return POSSESSIONS.map((possession) => ({
        id: possession.id,
        name: possession.name,
        at: possession.at,
        owner: possession.owner,
        base: possession.base,
      }));
    }
    return overlay.ports
      .map((port) => {
        const at = fixtureAnchor(port.area);
        if (at === null) return null;
        return {
          id: port.id,
          name: port.name,
          at,
          owner: port.nation,
          base: (port.level >= 7 ? "major" : "minor") as "major" | "minor",
        };
      })
      .filter((port): port is NonNullable<typeof port> => port !== null);
  }, [overlay]);

  /** The fleets to draw: live campaign fleets when active, else fixture. */
  const drawnFleets = useMemo<FleetPlacement[]>(() => {
    if (overlay.source !== "campaign") {
      return FLEETS.map((fleet) => ({
        id: fleet.id,
        area: fleet.area,
        ships: fleet.ships,
        owner: fleet.owner,
      }));
    }
    return overlay.fleets
      .map((fleet) => {
        if (fixtureAnchor(fleet.area) === null) return null;
        return {
          id: fleet.id,
          area: fleet.area,
          ships: fleet.ships,
          owner: fleet.nation,
        };
      })
      .filter((fleet): fleet is NonNullable<typeof fleet> => fleet !== null);
  }, [overlay]);

  const areas = useMemo(
    () => projectAreas(AREAS, projection, state.centre),
    [projection, state.centre],
  );
  const areasById = useMemo(() => new Map(areas.map((area) => [area.id, area])), [areas]);

  /** The playable nations' 1880 borders, tinted by nation and themed. */
  const borderSets = useMemo<BorderSet[]>(
    () =>
      state.layers.borders
        ? Object.entries(BORDERS_1880).map(([id, polygons]) => {
            const hue = campaignNationHue(id);
            return {
              id,
              polygons,
              tint: `oklch(${palette.borderTintLightness} 0.14 ${hue} / 0.16)`,
              edge: `oklch(${palette.borderEdgeLightness} 0.15 ${hue} / 0.9)`,
            };
          })
        : [],
    [palette, state.layers.borders],
  );

  // Bumped once the camera settles (and on mount), so label placement tracks
  // the real view without running per frame.
  const [viewVersion, setViewVersion] = useState(0);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const bump = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setViewVersion((version) => version + 1), 120);
    };
    const unsubscribe = camera.subscribe(bump);
    bump();
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [camera.subscribe]);

  const portMarks = useMemo<PortMark[]>(() => {
    const singles = portSingles(drawnPorts, projection, state.centre);
    const factor = camera.getTransform().scale * camera.getPixelsPerUnit();
    return buildPortMarks(singles, camera.zoomBand === 0, factor);
    // `viewVersion` is the settled-camera signal (see placedLabels).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera.zoomBand, drawnPorts, projection, state.centre, viewVersion]);

  const fleetMarks = useMemo<FleetMark[]>(() => {
    const anchors: AreaAnchors = new Map([...areasById].map(([id, area]) => [id, area.label]));
    const singles = fleetSingles(drawnFleets, anchors);
    const factor = camera.getTransform().scale * camera.getPixelsPerUnit();
    return buildFleetMarks(singles, camera.zoomBand === 0, factor, portMarks);
    // `viewVersion` is the settled-camera signal (see placedLabels).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areasById, camera.zoomBand, drawnFleets, portMarks, viewVersion]);

  const passageMarks = useMemo<PassageMark[]>(() => {
    const marks: PassageMark[] = [];
    for (const edge of EDGES) {
      if (edge.passage === undefined) continue;
      const from = areasById.get(edge.a)?.label;
      const to = areasById.get(edge.b)?.label;
      const passage = PASSAGES_BY_ID.get(edge.passage);
      if (from === undefined || to === undefined || passage === undefined) continue;
      marks.push({
        id: passage.id,
        from,
        to,
        mid: [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2],
        open: passage.open,
        kind: passage.kind,
      });
    }
    return marks;
  }, [areasById]);

  const placedLabels = useMemo<PlacedLabel[]>(() => {
    if (!state.layers.labels) return [];
    const svg = camera.svgRef.current;
    if (svg === null) return [];
    return layoutLabels({
      areas,
      areaName: (id) => AREAS_BY_ID.get(id)?.name,
      projection,
      centre: state.centre,
      flags: {
        possessions: state.layers.possessions,
        fleets: state.layers.fleets,
        passages: state.layers.passages,
      },
      portMarks,
      fleetMarks,
      passageAnchors: passageMarks.map((mark) => mark.mid),
      transform: camera.getTransform(),
      minScale: camera.getMinScale(),
      turns: camera.isWrapping() ? WORLD_WRAP_TURNS : [0],
      svg,
      root: rootRef.current,
    });
    // `viewVersion` is the settled-camera signal; the camera object itself is a stable bundle of refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    areas,
    fleetMarks,
    passageMarks,
    portMarks,
    projection,
    state.centre,
    state.layers,
    viewVersion,
  ]);

  /** Possessions (ports) per fixture area: the campaign's own ports when live, the fixture's otherwise. */
  const possessionsByArea = useMemo(() => {
    const counts = new Map<string, number>();
    if (overlay.source === "campaign") {
      for (const port of overlay.ports) counts.set(port.area, (counts.get(port.area) ?? 0) + 1);
    } else {
      for (const [id, held] of control) counts.set(id, held.possessions);
    }
    return counts;
  }, [overlay, control]);

  const ownershipRows = useMemo(
    () =>
      buildOwnershipRows(
        areas.map((area) => ({ id: area.id, name: AREAS_BY_ID.get(area.id)?.name ?? area.id })),
        (id) => {
          const owner = control.get(id)?.owner ?? null;
          if (owner === null) return null;
          return overlay.source === "campaign" ? campaignNationLabel(owner) : nationName(owner);
        },
        (id) => drawnFleets.filter((fleet) => fleet.area === id).length,
        (id) => possessionsByArea.get(id) ?? 0,
        state.selected,
      ),
    [areas, control, drawnFleets, overlay.source, possessionsByArea, state.selected],
  );
  const rowById = useMemo(
    () => new Map(ownershipRows.map((row) => [row.id, row])),
    [ownershipRows],
  );

  const graticule = useMemo(() => buildGraticule(projection), [projection]);

  const routeSet = useMemo(() => new Set(route?.path ?? []), [route]);

  /** Selected-area inspector: live overlay data when active, else the fixture. */
  const summary = useMemo(() => {
    if (state.selected === null) return null;
    const fixture = summariseArea(state.selected);
    if (fixture === null) return null;
    if (overlay.source !== "campaign") return fixture;
    const owner = overlay.ownership.get(state.selected) ?? null;
    const ports = overlay.ports.filter((port) => port.area === state.selected);
    const fleets = overlay.fleets.filter((fleet) => fleet.area === state.selected);
    return {
      id: state.selected,
      name: fixture.name,
      control: { owner, contested: false, possessions: 0 },
      possessions: ports.map((port) => ({ id: port.id, name: port.name, owner: port.nation })),
      fleets: fleets.map((fleet) => ({
        id: fleet.id,
        name: fleet.name,
        owner: fleet.nation,
        ships: fleet.ships,
      })),
      neighbours: fixture.neighbours,
    };
  }, [overlay, state.selected]);

  /** The area tree's rows: campaign areas when live, else the fixture areas (no regions). */
  const treeRows = useMemo<AreaTreeRow[]>(() => {
    if (overlay.source === "campaign") {
      return campaignTreeRows(
        overlay.campaignAreas,
        overlay.playerNationId,
        campaignNationLabel,
        state.selected,
      );
    }
    return ownershipRows.map((row) => ({
      id: row.id,
      name: row.name,
      owner: row.owner,
      ships: row.fleets,
      possessed: row.possessions > 0,
      mapAreaId: row.id,
      selected: row.selected,
    }));
  }, [overlay, ownershipRows, state.selected]);

  const routePath = useMemo(() => {
    if (route === null || !state.layers.routes) return "";
    return route.path
      .map((id, index) => {
        const point = areasById.get(id)?.label;
        if (point === undefined) return "";
        return `${index === 0 ? "M" : "L"}${point[0]} ${point[1]}`;
      })
      .join("");
  }, [areasById, route, state.layers.routes]);

  const areaName = useMemo(() => (id: string) => AREAS_BY_ID.get(id)?.name ?? id, []);

  return {
    state,
    live: overlay.source === "campaign",
    playerNationId: overlay.playerNationId,
    areas,
    areasById,
    control,
    borderSets,
    portMarks,
    fleetMarks,
    passageMarks,
    placedLabels,
    graticule,
    routePath,
    routeSet,
    ownershipRows,
    rowById,
    treeRows,
    summary,
    areaName,
    fillFor: (nation, alpha) => {
      if (nation === null) return `oklch(0.55 0 0 / ${alpha * 0.35})`;
      if (overlay.source === "campaign") {
        return `oklch(0.66 0.15 ${campaignNationHue(nation)} / ${alpha})`;
      }
      return nationFill(nation, alpha);
    },
    strokeFor: (nation) => {
      if (overlay.source === "campaign") {
        return `oklch(0.74 0.17 ${campaignNationHue(nation)})`;
      }
      return nationStroke(nation);
    },
    nameFor: (nation) => {
      if (nation === null) return "Unclaimed";
      if (overlay.source === "campaign") return campaignNationLabel(nation);
      return nationName(nation);
    },
    describeAreaFor: (id) => {
      const row = rowById.get(id);
      return row === undefined ? id : describeArea(row);
    },
  };
}
