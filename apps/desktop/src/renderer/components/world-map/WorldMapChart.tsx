/**
 * The Admiralty-chart world map — real coastlines, areas as translucent
 * ownership washes over them. The ocean is transparent, so the map surface
 * follows the app theme (see map-palette.ts).
 *
 * Promoted out of `screens/map-prototype/variants/VariantAChart.tsx` (ticket
 * 06's three-way comparison) once "Admiralty chart" was chosen as the design.
 * The world fixture, projection math, coastline geometry, and camera hook it
 * depends on still live under `screens/map-prototype/` because variants B and
 * C — kept deliberately, see that folder's README — still use them; this
 * component is the one consumer of that data that is not itself throwaway.
 */

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button } from "../ui/button.js";
import { CoastlineCanvas } from "./CoastlineCanvas.js";
import { MapMinimap } from "./MapMinimap.js";
import { MapScaleBar } from "./MapScaleBar.js";
import { buildOwnershipRows, describeArea } from "./map-a11y.js";
import { CollapsiblePanel } from "../shared/CollapsiblePanel.js";
import { AreaTreePanel } from "./AreaTreePanel.js";
import { campaignTreeRows, type AreaTreeRow } from "./area-tree.js";
import { AREAS, AREAS_BY_ID, EDGES, FLEETS, PASSAGES_BY_ID, POSSESSIONS } from "./fixture-world.js";
import { useCoastline } from "./useCoastline.js";
import {
  PROJECTIONS,
  projectAreas,
  projectPoint,
  projectionById,
  WORLD_WRAP_TURNS,
} from "./projection.js";
import {
  LAYERS,
  areaControl,
  nationFill,
  nationName,
  nationStroke,
  summariseArea,
} from "./map-state.js";
import {
  EMPTY_LIVE_OVERLAY,
  campaignNationHue,
  campaignNationLabel,
  fixtureAnchor,
  type LiveWorldMapOverlay,
} from "./campaign-map-join.js";
import { useMapCamera } from "./useMapCamera.js";
import { useMapPalette } from "./map-palette.js";
import { BORDERS_1880 } from "./borders-1880-data.js";
import type { BorderSet } from "./CoastlineCanvas.js";
import {
  CONTINENTS,
  COUNTRIES,
  LABEL_RANK,
  labelPresentation,
  type LabelKind,
  type LabelTraits,
} from "./map-labels.js";
import type { MapViewProps } from "./map-contract.js";
import { cn } from "../../lib/utils.js";

const CHART = {
  ocean: "oklch(0.19 0.035 245)",
  land: "oklch(0.30 0.018 250)",
  landEdge: "oklch(0.42 0.02 250)",
  graticule: "oklch(0.30 0.02 245)",
  ink: "oklch(0.92 0.01 240)",
  inkDim: "oklch(0.70 0.015 240)",
};

/** Pins a child to a world point at constant screen size (see camera `--map-inv`). */
function pinned(x: number, y: number) {
  return { transform: `translate(${x}px, ${y}px) scale(var(--map-inv, 1))` };
}

/** Text for a pinned group: `--map-inv` already makes one user unit one screen pixel. */
function screenText(px: number, strokePx: number) {
  return { fontSize: px, strokeWidth: strokePx, strokeLinejoin: "round" as const };
}

/**
 * Pushes fleet badges down, a few pixels at a time, until none sits on a port
 * dot (`factor` is screen pixels per user unit).
 */
function clearOfPorts(
  fleets: readonly FleetMark[],
  ports: readonly PortMark[],
  factor: number,
): FleetMark[] {
  return fleets.map((fleet) => {
    const halfWidth = fleet.count > 1 ? 15 : 11;
    const moved = { ...fleet };
    for (let attempt = 0; attempt < 4; attempt++) {
      const hit = ports.some((port) => {
        const radius = port.count > 1 ? 9 : port.major ? 5 : 3.5;
        return (
          Math.abs(port.ux - moved.ux) * factor < radius + halfWidth &&
          Math.abs(port.uy - moved.uy) * factor < radius + 8
        );
      });
      if (!hit) break;
      moved.uy += 14 / factor;
    }
    return moved;
  });
}

/** Label nudges to try, in screen pixels, nearest to the anchor first. */
const NUDGES: readonly (readonly [number, number])[] = [
  [0, 0],
  [0, -18],
  [0, 18],
  [0, -36],
  [0, 36],
  [-48, 0],
  [48, 0],
  [-48, -18],
  [48, -18],
  [-48, 18],
  [48, 18],
];

interface LabelSpec {
  readonly key: string;
  readonly kind: LabelKind;
  readonly text: string;
  /** World user units. */
  readonly ux: number;
  readonly uy: number;
  /** Tie-break within a rank: bigger first. */
  readonly weight: number;
  readonly anchor: "middle" | "start";
  readonly px: number;
  readonly opacity: number;
  readonly rank: number;
}

interface PlacedLabel {
  readonly id: string;
  readonly turn: number;
  readonly spec: LabelSpec;
  readonly dx: number;
  readonly dy: number;
}

interface PortMark {
  readonly id: string;
  readonly name: string;
  ux: number;
  uy: number;
  owner: string | null;
  major: boolean;
  count: number;
}

interface FleetMark {
  readonly id: string;
  ux: number;
  uy: number;
  ships: number;
  owner: string | null;
  count: number;
}

interface Box {
  readonly x0: number;
  readonly x1: number;
  readonly y0: number;
  readonly y1: number;
}

function boxesOverlap(a: Box, b: Box): boolean {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
}

export interface WorldMapChartProps extends MapViewProps {
  readonly className?: string;
  /** Optional live campaign overlay; defaults to the static prototype fixture. */
  readonly overlay?: LiveWorldMapOverlay;
  /**
   * "full" shows every control (the F1 map). "panel" is the embedded variant for
   * the Overview: layer controls collapse behind a Layers button and the idle
   * hint cards stay out of the way, so the chart gets the space. "command" is the full-bleed
   * campaign home (CC-2): no frame, and the controls, area tree, inspector and the host's panels
   * float over the chart in left and right docks that let pointer events through to the map.
   */
  readonly variant?: "full" | "panel" | "command";
  readonly showMinimap?: boolean;
  /** "command" only: panels stacked under the area tree in the left dock. */
  readonly leftPanels?: ReactNode;
  /** "command" only: panels stacked above the inspector in the right dock. */
  readonly rightPanels?: ReactNode;
  /** "command" only: whether the area tree starts open (compact density passes false). */
  readonly treeDefaultOpen?: boolean;
}

export function WorldMapChart({
  state,
  route,
  onSelect,
  onRuler,
  onToggleLayer,
  onSetProjection,
  onSetCentre,
  onToggleClosedPassages,
  overlay = EMPTY_LIVE_OVERLAY,
  className,
  variant = "full",
  showMinimap = true,
  leftPanels,
  rightPanels,
  treeDefaultOpen = true,
}: WorldMapChartProps) {
  const isCommand = variant === "command";
  /** Both embedded variants keep idle hints and the layer controls out of the way. */
  const isPanel = variant !== "full";
  const [toolsOpen, setToolsOpen] = useState(false);
  const projection = projectionById(state.projection);
  const camera = useMapCamera(projection.width, projection.height);
  const palette = useMapPalette();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const live = overlay.source === "campaign";
  const coastline = useCoastline();

  /** Ownership: live overlay overrides the fixture wherever the campaign maps one. */
  const control = useMemo(() => {
    const merged = new Map(areaControl());
    if (!live) return merged;
    for (const [area, owner] of overlay.ownership) {
      merged.set(area, {
        owner,
        contested: false,
        possessions: 0,
      });
    }
    return merged;
  }, [live, overlay]);

  /** The possessions/ports to draw: live campaign ports when active, else fixture. */
  const drawnPorts = useMemo(() => {
    if (!live) return POSSESSIONS;
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
      .filter((p): p is NonNullable<typeof p> => p !== null);
  }, [live, overlay]);

  /** The fleets to draw: live campaign fleets when active, else fixture. */
  const drawnFleets = useMemo(() => {
    if (!live) return FLEETS;
    return overlay.fleets
      .map((fleet) => {
        const anchor = fixtureAnchor(fleet.area);
        if (anchor === null) return null;
        return {
          id: fleet.id,
          name: fleet.name,
          area: fleet.area,
          owner: fleet.nation,
          ships: fleet.ships,
        };
      })
      .filter((f): f is NonNullable<typeof f> => f !== null);
  }, [live, overlay]);

  const areas = useMemo(
    () => projectAreas(AREAS, projection, state.centre),
    [projection, state.centre],
  );
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
  const areasById = useMemo(() => new Map(areas.map((area) => [area.id, area])), [areas]);

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

  /**
   * Port dots to draw. Like fleets, ports within a dot's width of each other
   * merge into one counted dot at the home zoom and separate as you zoom in.
   */
  const portMarks = useMemo<PortMark[]>(() => {
    const singles: PortMark[] = drawnPorts.map((possession) => {
      const [ux, uy] = projectPoint(possession.at, projection, state.centre);
      return {
        id: possession.id,
        name: possession.name,
        ux,
        uy,
        owner: possession.owner,
        major: possession.base === "major",
        count: 1,
      };
    });
    if (camera.zoomBand > 0) return singles;
    const radius = 14 / (camera.getTransform().scale * camera.getPixelsPerUnit());
    const clusters: PortMark[] = [];
    for (const mark of singles) {
      const near = clusters.find(
        (cluster) => Math.hypot(cluster.ux - mark.ux, cluster.uy - mark.uy) < radius,
      );
      if (near === undefined) {
        clusters.push({ ...mark });
        continue;
      }
      const total = near.count + 1;
      near.ux = (near.ux * near.count + mark.ux) / total;
      near.uy = (near.uy * near.count + mark.uy) / total;
      near.owner = near.owner === mark.owner ? near.owner : null;
      near.major = near.major || mark.major;
      near.count = total;
    }
    return clusters;
    // `viewVersion` is the settled-camera signal (see visibleLabels).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera.zoomBand, drawnPorts, projection, state.centre, viewVersion]);

  /**
   * Fleet badges to draw. At the home zoom, fleets that would sit within a
   * badge's width of each other collapse into one badge showing the total, so
   * a crowded sea reads as a single mark; zooming in spreads them out again.
   */
  const fleetMarks = useMemo<FleetMark[]>(() => {
    const singles: FleetMark[] = [];
    drawnFleets.forEach((fleet, index) => {
      const anchor = areasById.get(fleet.area)?.label;
      if (anchor === undefined) return;
      singles.push({
        id: fleet.id,
        ux: anchor[0] + ((index % 3) * 16 - 16),
        uy: anchor[1] + 18,
        ships: fleet.ships,
        owner: fleet.owner,
        count: 1,
      });
    });
    const factor = camera.getTransform().scale * camera.getPixelsPerUnit();
    if (camera.zoomBand > 0) return clearOfPorts(singles, portMarks, factor);
    const radius = 34 / (camera.getTransform().scale * camera.getPixelsPerUnit());
    const clusters: FleetMark[] = [];
    for (const mark of singles) {
      const near = clusters.find(
        (cluster) => Math.hypot(cluster.ux - mark.ux, cluster.uy - mark.uy) < radius,
      );
      if (near === undefined) {
        clusters.push({ ...mark });
        continue;
      }
      const total = near.count + 1;
      near.ux = (near.ux * near.count + mark.ux) / total;
      near.uy = (near.uy * near.count + mark.uy) / total;
      near.ships += mark.ships;
      near.owner = near.owner === mark.owner ? near.owner : null;
      near.count = total;
    }
    return clearOfPorts(clusters, portMarks, factor);
    // `viewVersion` is the settled-camera signal (see visibleLabels).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areasById, camera.zoomBand, drawnFleets, portMarks, viewVersion]);

  /**
   * The place names to draw, laid out in screen pixels from the settled camera.
   * What is eligible depends on zoom (see `labelPresentation`): big names when
   * zoomed out, smaller ones as you close in. Eligible names are placed in
   * priority order, and one is dropped if it would leave the view, sit under a
   * floating panel, cover a marker, or overlap one already placed; it is first
   * nudged to nearby spots.
   */
  const placedLabels = useMemo<PlacedLabel[]>(() => {
    const placedOut: PlacedLabel[] = [];
    if (!state.layers.labels) return placedOut;
    const svg = camera.svgRef.current;
    const ctm = svg?.getScreenCTM?.();
    if (svg == null || ctm == null || svg.clientWidth === 0) return placedOut;
    const frame = svg.getBoundingClientRect();
    const transform = camera.getTransform();
    const zoom = transform.scale / camera.getMinScale();
    const turns = camera.isWrapping() ? WORLD_WRAP_TURNS : [0];

    // Everything that could be named, with its zoom-dependent look.
    const specs: LabelSpec[] = [];
    const consider = (
      spec: Omit<LabelSpec, "px" | "opacity" | "rank">,
      traits: LabelTraits = {},
    ) => {
      const look = labelPresentation(spec.kind, zoom, traits);
      if (look !== null) specs.push({ ...spec, ...look, rank: LABEL_RANK[spec.kind] });
    };
    for (const country of COUNTRIES) {
      const [ux, uy] = projectPoint(country.at, projection, state.centre);
      consider({
        key: `country:${country.name}`,
        kind: "country",
        text: country.name,
        ux,
        uy,
        weight: 0,
        anchor: "middle",
      });
    }
    for (const area of areas) {
      const definition = AREAS_BY_ID.get(area.id);
      if (definition === undefined) continue;
      const size = area.bounds.width * area.bounds.height;
      consider(
        {
          key: `sea:${area.id}`,
          kind: "sea",
          text: definition.name,
          ux: area.label[0],
          uy: area.label[1],
          weight: size,
          anchor: "middle",
        },
        { big: size > 26000 },
      );
    }
    for (const continent of CONTINENTS) {
      const [ux, uy] = projectPoint(continent.at, projection, state.centre);
      consider({
        key: `continent:${continent.name}`,
        kind: "continent",
        text: continent.name,
        ux,
        uy,
        weight: 0,
        anchor: "middle",
      });
    }
    // A clustered port dot has no single name to show; singles do.
    const singles = new Set(portMarks.filter((mark) => mark.count === 1).map((mark) => mark.id));
    for (const mark of portMarks) {
      if (mark.count !== 1 || !singles.has(mark.id)) continue;
      consider(
        {
          key: `port:${mark.id}`,
          kind: "port",
          text: mark.name,
          ux: mark.ux,
          uy: mark.uy,
          weight: mark.major ? 1 : 0,
          anchor: "start",
        },
        { major: mark.major },
      );
    }
    specs.sort((a, b) => a.rank - b.rank || b.weight - a.weight);

    // Things a label must not sit on: floating panels, then markers.
    const obstacles: Box[] = [];
    if (rootRef.current !== null) {
      for (const element of rootRef.current.querySelectorAll(
        "[data-map-obstacle], .pointer-events-auto",
      )) {
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        obstacles.push({
          x0: rect.left - frame.left,
          x1: rect.right - frame.left,
          y0: rect.top - frame.top,
          y1: rect.bottom - frame.top,
        });
      }
    }
    const markers: { ux: number; uy: number; hw: number; hh: number }[] = [];
    if (state.layers.possessions) {
      for (const mark of portMarks) {
        const half = mark.count > 1 ? 11 : 8;
        markers.push({ ux: mark.ux, uy: mark.uy, hw: half, hh: half });
      }
    }
    if (state.layers.fleets) {
      for (const mark of fleetMarks) {
        markers.push({ ux: mark.ux, uy: mark.uy, hw: mark.count > 1 ? 17 : 13, hh: 10 });
      }
    }
    if (state.layers.passages) {
      for (const edge of EDGES) {
        if (edge.passage === undefined) continue;
        const from = areasById.get(edge.a)?.label;
        const to = areasById.get(edge.b)?.label;
        if (from === undefined || to === undefined) continue;
        markers.push({ ux: (from[0] + to[0]) / 2, uy: (from[1] + to[1]) / 2, hw: 9, hh: 9 });
      }
    }

    const toScreen = (ux: number, uy: number, turn: number) => ({
      x:
        ctm.a * (transform.x + transform.scale * (ux + turn * projection.width)) +
        ctm.e -
        frame.left,
      y: ctm.d * (transform.y + transform.scale * uy) + ctm.f - frame.top,
    });
    const placed: Box[] = [];
    for (const spec of specs) {
      const upper = spec.kind === "sea" || spec.kind === "continent";
      const width = spec.text.length * (spec.px * (upper ? 0.62 : 0.56) + (upper ? 1.2 : 0)) + 8;
      for (const turn of turns) {
        const at = toScreen(spec.ux, spec.uy, turn);
        // A port's own dot is not an obstacle to its own name.
        const markerBoxes: Box[] = markers
          .filter(
            (marker) => !(spec.kind === "port" && marker.ux === spec.ux && marker.uy === spec.uy),
          )
          .map((marker) => {
            const m = toScreen(marker.ux, marker.uy, turn);
            return {
              x0: m.x - marker.hw,
              x1: m.x + marker.hw,
              y0: m.y - marker.hh,
              y1: m.y + marker.hh,
            };
          });
        for (const [dx, dy] of NUDGES) {
          const left = spec.anchor === "start" ? at.x + dx + 8 : at.x + dx - width / 2;
          const box = {
            x0: left,
            x1: left + width,
            y0: at.y + dy - spec.px * 1.1,
            y1: at.y + dy + spec.px * 0.5,
          };
          if (box.x0 < 6 || box.y0 < 6 || box.x1 > frame.width - 6 || box.y1 > frame.height - 6)
            continue;
          if (obstacles.some((other) => boxesOverlap(box, other))) continue;
          if (markerBoxes.some((other) => boxesOverlap(box, other))) continue;
          if (placed.some((other) => boxesOverlap(box, other))) continue;
          placed.push(box);
          placedOut.push({ id: `${turn}:${spec.key}`, turn, spec, dx, dy });
          break;
        }
      }
    }
    return placedOut;
    // `viewVersion` is the settled-camera signal; the camera object itself is a stable bundle of refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    areas,
    areasById,
    fleetMarks,
    portMarks,
    projection,
    state.centre,
    state.layers,
    viewVersion,
  ]);

  /** Possessions (ports) per fixture area: the campaign's own ports when live, the fixture's otherwise. */
  const possessionsByArea = useMemo(() => {
    const counts = new Map<string, number>();
    if (live) {
      // The joined overlay's ports already sit on fixture areas (see joinWorldMap).
      for (const port of overlay.ports) counts.set(port.area, (counts.get(port.area) ?? 0) + 1);
    } else {
      for (const [id, held] of control) counts.set(id, held.possessions);
    }
    return counts;
  }, [live, overlay, control]);

  const ownershipRows = useMemo(
    () =>
      buildOwnershipRows(
        areas.map((area) => ({ id: area.id, name: AREAS_BY_ID.get(area.id)?.name ?? area.id })),
        (id) => {
          const owner = control.get(id)?.owner ?? null;
          if (owner === null) return null;
          return live ? campaignNationLabel(owner) : nationName(owner);
        },
        (id) => drawnFleets.filter((fleet) => fleet.area === id).length,
        (id) => possessionsByArea.get(id) ?? 0,
        state.selected,
      ),
    [areas, control, drawnFleets, live, possessionsByArea, state.selected],
  );
  const rowById = useMemo(
    () => new Map(ownershipRows.map((row) => [row.id, row])),
    [ownershipRows],
  );

  const graticule = useMemo(() => {
    const lines: string[] = [];
    for (let lat = -60; lat <= 60; lat += 30) {
      const [x1, y] = projection.project(0, lat);
      lines.push(`M${-projection.width} ${y}L${projection.width * 2} ${y}`);
      void x1;
    }
    for (let lon = -180; lon < 180; lon += 30) {
      const [x] = projection.project(lon, 0);
      lines.push(`M${x} 0L${x} ${projection.height}`);
    }
    return lines.join("");
  }, [projection]);

  const routeSet = new Set(route?.path ?? []);

  /** Selected-area inspector: live overlay data when active, else the fixture. */
  const summary = useMemo(() => {
    if (state.selected === null) return null;
    const fixture = summariseArea(state.selected);
    if (fixture === null) return null;
    if (!live) return fixture;

    const owner = overlay.ownership.get(state.selected) ?? null;
    const ports = overlay.ports.filter((p) => p.area === state.selected);
    const fleets = overlay.fleets.filter((f) => f.area === state.selected);
    return {
      id: state.selected,
      name: fixture.name,
      control: { owner, contested: false, possessions: 0 },
      possessions: ports.map((p) => ({ id: p.id, name: p.name, owner: p.nation })),
      fleets: fleets.map((f) => ({ id: f.id, name: f.name, owner: f.nation, ships: f.ships })),
      neighbours: fixture.neighbours,
    };
  }, [live, overlay, state.selected]);

  /** Keyboard parity for pan/zoom (wheel and drag stay the pointer path). */
  function handleMapKey(event: React.KeyboardEvent<SVGSVGElement>): void {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const step = event.shiftKey ? 240 : 80;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [step, 0],
      ArrowRight: [-step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    };
    const move = moves[event.key];
    if (move !== undefined) camera.panBy(move[0], move[1]);
    else if (event.key === "+" || event.key === "=") camera.zoomBy(1.4);
    else if (event.key === "-" || event.key === "_") camera.zoomBy(1 / 1.4);
    else if (event.key === "0") camera.reset();
    else return;
    event.preventDefault();
  }

  /** Colour a nation (campaign id or fixture id) for the wash. */
  function fillFor(nation: string | null, alpha: number): string {
    if (nation === null) return `oklch(0.55 0 0 / ${alpha * 0.35})`;
    if (live) return `oklch(0.66 0.15 ${campaignNationHue(nation)} / ${alpha})`;
    return nationFill(nation, alpha);
  }

  /** Colour a nation's marker stroke (campaign id or fixture id). */
  function strokeFor(nation: string): string {
    if (live) return `oklch(0.74 0.17 ${campaignNationHue(nation)})`;
    return nationStroke(nation);
  }

  /** The area tree's rows: campaign areas when live, else the fixture areas (no regions). */
  const treeRows = useMemo<AreaTreeRow[]>(() => {
    if (live) {
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
  }, [live, overlay, ownershipRows, state.selected]);

  /** Select an area and bring it into view (the area list's job). */
  function focusArea(id: string): void {
    onSelect(id);
    const point = areasById.get(id)?.label;
    if (point !== undefined) camera.focusOn(point[0], point[1], 3.5);
  }

  /** A tree row was chosen: select its map area (which opens the inspector) and zoom to it. */
  function focusTreeRow(row: AreaTreeRow): void {
    if (row.mapAreaId !== null) focusArea(row.mapAreaId);
  }

  function describeAreaFor(id: string): string {
    const row = rowById.get(id);
    return row === undefined ? id : describeArea(row);
  }

  /** Display name for a nation (campaign id or fixture id). */
  function nameFor(nation: string | null): string {
    if (nation === null) return "Unclaimed";
    if (live) return campaignNationLabel(nation);
    return nationName(nation);
  }

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

  function handleAreaClick(id: string, shiftKey: boolean) {
    if (camera.isDraggingRef.current) return;
    if (shiftKey) onRuler(id);
    else onSelect(id);
  }

  return (
    <div
      ref={rootRef}
      style={{ ["--map-focus" as string]: palette.selectedEdge }}
      className={cn(
        "relative h-full w-full overflow-hidden",
        !isCommand && "rounded-lg border shadow-sm",
        className,
      )}
    >
      {coastline.status === "ready" && (
        <CoastlineCanvas
          camera={camera}
          polygons={coastline.polygons}
          projection={projection}
          centre={state.centre}
          fill={palette.land}
          stroke={palette.landEdge}
          borders={borderSets}
        />
      )}
      {coastline.status !== "ready" && (
        <div
          role="status"
          className="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-md border px-2.5 py-1 text-xs"
          style={{
            background: "oklch(0.16 0.025 245 / 0.85)",
            borderColor: "oklch(0.4 0.02 245)",
            color: CHART.ink,
          }}
        >
          {coastline.status === "loading"
            ? "Loading coastline…"
            : `Coastline unavailable: ${coastline.message}`}
        </div>
      )}
      <svg
        ref={camera.svgRef}
        // `relative` lifts the SVG above the (positioned) coastline canvas, so labels
        // and markers draw over land instead of vanishing under it.
        className="relative h-full w-full cursor-grab touch-none active:cursor-grabbing"
        viewBox={`0 0 ${projection.width} ${projection.height}`}
        preserveAspectRatio="xMidYMid meet"
        role="application"
        aria-label="World map. Arrow keys pan, plus and minus zoom, zero resets."
        tabIndex={0}
        onKeyDown={handleMapKey}
      >
        <g ref={camera.worldRef}>
          {/* Every layer, three times: one turn west, home, one turn east.
              That is the entire antimeridian strategy — no clipping, no ring
              splitting, and markers wrap with the polygons they belong to. */}
          {WORLD_WRAP_TURNS.map((turn) => (
            <g
              key={turn}
              transform={`translate(${turn * projection.width} 0)`}
              style={turn === 0 ? undefined : { display: "var(--map-copies, inline)" }}
            >
              <path
                d={graticule}
                stroke={palette.graticule}
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
                fill="none"
              />

              {/* Layer: areas + ownership wash. */}
              {areas.map((area) => {
                const held = control.get(area.id);
                const selected = state.selected === area.id;
                const onRouteLeg = routeSet.has(area.id);
                return (
                  <path
                    key={area.id}
                    d={area.path}
                    fill={
                      state.layers.ownership
                        ? fillFor(held?.owner ?? null, selected ? 0.42 : 0.2)
                        : selected
                          ? palette.areaWashSelected
                          : palette.areaWash
                    }
                    stroke={
                      selected
                        ? palette.selectedEdge
                        : onRouteLeg
                          ? palette.route
                          : palette.areaEdge
                    }
                    strokeWidth={selected ? 2.5 : onRouteLeg ? 2 : 0.9}
                    vectorEffect="non-scaling-stroke"
                    strokeDasharray={held?.contested === true ? "6 4" : undefined}
                    className="cursor-pointer outline-none transition-[fill] duration-150 focus-visible:[stroke:var(--map-focus)] focus-visible:stroke-[3]"
                    // The map draws every layer three times to wrap seamlessly;
                    // only the home copy is exposed to keyboard and screen readers.
                    role={turn === 0 ? "button" : undefined}
                    tabIndex={turn === 0 ? 0 : undefined}
                    aria-hidden={turn === 0 ? undefined : true}
                    aria-pressed={turn === 0 ? selected : undefined}
                    aria-label={turn === 0 ? describeAreaFor(area.id) : undefined}
                    onClick={(event) => handleAreaClick(area.id, event.shiftKey)}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== " ") return;
                      event.preventDefault();
                      event.stopPropagation();
                      handleAreaClick(area.id, event.shiftKey);
                    }}
                  >
                    {/* Hover name, so an area whose label was thinned out stays identifiable. */}
                    {turn === 0 && <title>{AREAS_BY_ID.get(area.id)?.name ?? area.id}</title>}
                  </path>
                );
              })}

              {/* Layer: routes. */}
              {routePath !== "" && (
                <>
                  <path
                    d={routePath}
                    fill="none"
                    stroke="oklch(0.2 0 0 / 0.6)"
                    strokeWidth={6}
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                  />
                  <path
                    d={routePath}
                    fill="none"
                    stroke={palette.route}
                    strokeWidth={2.5}
                    vectorEffect="non-scaling-stroke"
                    strokeDasharray="10 6"
                    strokeLinecap="round"
                  />
                </>
              )}

              {/* Layer: passages. Drawn at the midpoint of the edge they gate. */}
              {state.layers.passages &&
                EDGES.filter((edge) => edge.passage !== undefined).map((edge) => {
                  const from = areasById.get(edge.a)?.label;
                  const to = areasById.get(edge.b)?.label;
                  const passage = PASSAGES_BY_ID.get(edge.passage as string);
                  if (from === undefined || to === undefined || passage === undefined) return null;
                  const mx = (from[0] + to[0]) / 2;
                  const my = (from[1] + to[1]) / 2;
                  return (
                    <g key={passage.id}>
                      <line
                        x1={from[0]}
                        y1={from[1]}
                        x2={to[0]}
                        y2={to[1]}
                        stroke={
                          passage.open ? "oklch(0.75 0.02 240 / 0.3)" : "oklch(0.65 0.2 25 / 0.55)"
                        }
                        strokeWidth={1.5}
                        vectorEffect="non-scaling-stroke"
                        strokeDasharray={passage.open ? undefined : "5 4"}
                      />
                      <g style={pinned(mx, my)}>
                        <circle
                          cx={0}
                          cy={0}
                          r={passage.open ? 5.5 : 7}
                          opacity={passage.open ? 0.85 : 1}
                          fill={passage.open ? "oklch(0.28 0.03 245)" : "oklch(0.36 0.11 25)"}
                          stroke={passage.open ? "oklch(0.8 0.02 240)" : "oklch(0.72 0.2 25)"}
                          strokeWidth={1.6}
                        />
                        <text
                          x={0}
                          y={3.2}
                          textAnchor="middle"
                          fontSize={8}
                          fill="oklch(0.92 0.01 240)"
                          style={{ pointerEvents: "none" }}
                        >
                          {passage.kind === "canal" ? "C" : "S"}
                        </text>
                      </g>
                    </g>
                  );
                })}

              {/* Layer: possessions. */}
              {state.layers.possessions &&
                portMarks.map((mark) => {
                  const grouped = mark.count > 1;
                  return (
                    <g key={mark.id} style={pinned(mark.ux, mark.uy)}>
                      {grouped && <title>{`${mark.count} ports`}</title>}
                      <circle
                        cx={0}
                        cy={0}
                        r={grouped ? 9 : mark.major ? 5 : 3.5}
                        fill={mark.owner === null ? "oklch(0.78 0.02 240)" : strokeFor(mark.owner)}
                        stroke="oklch(0.15 0.02 245)"
                        strokeWidth={grouped ? 2 : 1.4}
                      />
                      {grouped && (
                        <text
                          y={3.5}
                          textAnchor="middle"
                          fontSize={10}
                          fontWeight={600}
                          fill="oklch(0.15 0.02 245)"
                          style={{ pointerEvents: "none" }}
                        >
                          {mark.count}
                        </text>
                      )}
                    </g>
                  );
                })}

              {/* Layer: fleets. */}
              {state.layers.fleets &&
                fleetMarks.map((mark) => {
                  const grouped = mark.count > 1;
                  const half = grouped ? 15 : 11;
                  return (
                    <g
                      key={mark.id}
                      style={pinned(mark.ux, mark.uy)}
                      opacity={grouped || !live || mark.owner === overlay.playerNationId ? 1 : 0.72}
                    >
                      {grouped && <title>{`${mark.count} fleets · ${mark.ships} ships`}</title>}
                      <rect
                        x={-half}
                        y={-8}
                        width={half * 2}
                        height={16}
                        rx={3}
                        fill={mark.owner === null ? "oklch(0.78 0.02 240)" : strokeFor(mark.owner)}
                        stroke="oklch(0.15 0.02 245)"
                        strokeWidth={grouped ? 2 : 1.4}
                      />
                      <text
                        y={4}
                        textAnchor="middle"
                        fontSize={10}
                        fontWeight={600}
                        fill="oklch(0.15 0.02 245)"
                        style={{ pointerEvents: "none" }}
                      >
                        {mark.ships}
                      </text>
                    </g>
                  );
                })}

              {/* Layer: place names, zoom-aware (see placedLabels). */}
              {placedLabels
                .filter((label) => label.turn === turn)
                .map(({ id, spec, dx, dy }) => (
                  <text
                    key={id}
                    x={0}
                    y={0}
                    aria-hidden="true"
                    textAnchor={spec.anchor}
                    letterSpacing={spec.kind === "sea" || spec.kind === "continent" ? 1.2 : 0.2}
                    fill={palette.labelInk}
                    stroke={palette.labelHalo}
                    paintOrder="stroke"
                    opacity={spec.opacity * (spec.kind === "continent" ? 0.8 : 1)}
                    style={{
                      transform: `${pinned(spec.ux, spec.uy).transform} translate(${dx}px, ${dy}px)`,
                      ...screenText(spec.px, 3),
                      fontWeight: spec.kind === "continent" ? 500 : 600,
                      fontStyle: spec.kind === "port" ? "normal" : undefined,
                      pointerEvents: "none",
                      textTransform:
                        spec.kind === "sea" || spec.kind === "continent" ? "uppercase" : undefined,
                    }}
                  >
                    {spec.text}
                  </text>
                ))}
            </g>
          ))}
        </g>
      </svg>

      <table className="sr-only">
        <caption>Area control</caption>
        <thead>
          <tr>
            <th scope="col">Area</th>
            <th scope="col">Controlled by</th>
            <th scope="col">Fleets</th>
          </tr>
        </thead>
        <tbody>
          {ownershipRows.map((row) => (
            <tr key={row.id} aria-selected={row.selected}>
              <th scope="row">{row.name}</th>
              <td>{row.owner ?? "Unclaimed"}</td>
              <td>{row.fleets}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div data-map-obstacle className="absolute bottom-3 right-3 flex flex-col items-end gap-2">
        {coastline.status === "ready" && showMinimap && (
          <MapMinimap
            camera={camera}
            projection={projection}
            centre={state.centre}
            polygons={coastline.polygons}
            land={palette.minimapLand}
            ocean={palette.minimapOcean}
            ink={palette.minimapInk}
            borderColor={palette.minimapBorder}
          />
        )}
        <div
          className="pointer-events-none rounded-md border px-2.5 py-1.5 backdrop-blur"
          style={{
            background: "oklch(0.16 0.025 245 / 0.85)",
            borderColor: "oklch(0.4 0.02 245)",
            color: CHART.ink,
          }}
        >
          {(state.layers.possessions || state.layers.fleets) && (
            <div
              aria-hidden="true"
              className="mb-1.5 flex items-center gap-3 text-xs"
              style={{ color: CHART.inkDim }}
            >
              {state.layers.possessions && (
                <span className="flex items-center gap-1">
                  <span
                    className="inline-block size-2.5 rounded-full border"
                    style={{ background: CHART.inkDim, borderColor: CHART.ink }}
                  />
                  Ports
                </span>
              )}
              {state.layers.fleets && (
                <span className="flex items-center gap-1">
                  <span
                    className="inline-block h-2.5 w-3 rounded-[2px] border"
                    style={{ background: CHART.inkDim, borderColor: CHART.ink }}
                  />
                  Fleets
                </span>
              )}
            </div>
          )}
          <MapScaleBar camera={camera} worldWidth={projection.width} />
        </div>
      </div>

      {/* Chrome: a floating toolbar, chart-styled rather than app-styled — a
          deliberate choice, so the chart reads as a chart rather than another
          panel of the shell. */}
      <div
        className={cn(
          isCommand
            ? "pointer-events-none absolute bottom-16 left-3 top-3 z-10 flex w-72 flex-col gap-2 overflow-y-auto"
            : "contents",
        )}
        data-testid={isCommand ? "map-left-dock" : undefined}
      >
        {isPanel && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className={cn(
              "bg-background/80 backdrop-blur",
              isCommand ? "pointer-events-auto self-start" : "absolute left-3 top-3 z-10",
            )}
            aria-expanded={toolsOpen}
            title="Layers, projection and centre. Click an area to inspect it; shift-click two areas for a route reading."
            onClick={() => setToolsOpen((open) => !open)}
          >
            Layers &amp; areas
          </Button>
        )}
        <div
          className={cn(
            "flex flex-col gap-2 overflow-y-auto rounded-lg border p-2.5 text-xs shadow-lg backdrop-blur",
            isCommand
              ? "pointer-events-auto"
              : cn(
                  "absolute left-3",
                  // Never taller than the chart: leave room for the route readout along the bottom edge.
                  isPanel ? "top-14 max-h-[calc(100%-8rem)]" : "top-3 max-h-[calc(100%-7.5rem)]",
                ),
            isPanel && !toolsOpen && "hidden",
          )}
          style={{
            background: "oklch(0.16 0.025 245 / 0.85)",
            borderColor: "oklch(0.4 0.02 245)",
            color: CHART.ink,
          }}
        >
          <div className="flex gap-1">
            {PROJECTIONS.map((option) => (
              <Button
                key={option.id}
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => onSetProjection(option.id)}
                title={option.note}
                className="h-7 px-2 text-xs hover:bg-white/10"
                style={{
                  background:
                    state.projection === option.id ? "oklch(0.7 0.12 240)" : "transparent",
                  color: state.projection === option.id ? "oklch(0.15 0.02 245)" : CHART.inkDim,
                }}
              >
                {option.name}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1" style={{ maxWidth: 220 }}>
            {LAYERS.map((layer) => (
              <Button
                key={layer.id}
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onToggleLayer(layer.id)}
                className="h-7 border px-2 text-xs hover:bg-white/10"
                style={{
                  background: state.layers[layer.id] ? "oklch(0.35 0.03 245)" : "transparent",
                  color: state.layers[layer.id] ? CHART.ink : CHART.inkDim,
                  borderColor: "oklch(0.4 0.02 245)",
                }}
              >
                {layer.label}
              </Button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs" style={{ color: CHART.inkDim }}>
            Centre
            <input
              type="range"
              min={-180}
              max={180}
              step={10}
              value={state.centre}
              onChange={(event) => onSetCentre(Number(event.target.value))}
              className="w-28"
            />
            <span className="tabular-nums">{state.centre}°</span>
          </label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={camera.reset}
              className="h-7 border px-2 text-xs hover:bg-white/10"
              style={{ borderColor: "oklch(0.4 0.02 245)", color: CHART.inkDim }}
            >
              Reset view
            </Button>
            <span
              ref={camera.meterRef}
              className="font-mono text-xs tabular-nums"
              style={{ color: CHART.inkDim }}
            />
          </div>
          {!isCommand && (
            <details className="group" data-testid="area-list">
              <summary
                className="cursor-pointer select-none text-xs"
                style={{ color: CHART.inkDim }}
              >
                Areas ({treeRows.length})
              </summary>
              <div className="mt-2" style={{ width: 220, color: CHART.ink }}>
                <AreaTreePanel rows={treeRows} onSelectArea={focusTreeRow} />
              </div>
            </details>
          )}
        </div>
        {isCommand && (
          <CollapsiblePanel
            panelId="map-areas"
            title="Areas"
            badge={`(${treeRows.length})`}
            defaultOpen={treeDefaultOpen}
            testId="area-list"
          >
            <AreaTreePanel rows={treeRows} onSelectArea={focusTreeRow} />
          </CollapsiblePanel>
        )}
        {isCommand && leftPanels}
      </div>

      <div
        className={cn(
          isCommand
            ? "pointer-events-none absolute bottom-16 right-3 top-3 z-10 flex w-72 flex-col items-stretch gap-2 overflow-y-auto"
            : "contents",
        )}
        data-testid={isCommand ? "map-right-dock" : undefined}
      >
        {isCommand && rightPanels}

        {/* Chrome: inspector floats over the chart rather than taking layout. */}
        <div
          data-map-obstacle
          className={cn(
            "rounded-lg border p-3 text-xs shadow-lg backdrop-blur",
            isCommand ? "pointer-events-auto" : "absolute right-3 top-3 w-72",
            isPanel && summary === null && "hidden",
          )}
          style={{
            background: "oklch(0.16 0.025 245 / 0.9)",
            borderColor: "oklch(0.4 0.02 245)",
            color: CHART.ink,
          }}
        >
          {summary === null ? (
            <p style={{ color: CHART.inkDim }}>
              Click an area to inspect. Shift-click two areas to lay the ruler.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium tracking-wide uppercase">{summary.name}</span>
                <button
                  type="button"
                  onClick={() => onSelect(null)}
                  className="leading-none opacity-70 transition-opacity hover:opacity-100"
                  style={{ color: CHART.inkDim }}
                  aria-label="Clear selection"
                >
                  ×
                </button>
              </div>
              <div style={{ color: CHART.inkDim }}>
                {nameFor(summary.control.owner)}
                {summary.control.contested ? " · contested" : ""} · {summary.possessions.length}{" "}
                possessions · {summary.fleets.length} fleets
              </div>
              {summary.fleets.length > 0 && (
                <ul className="m-0 list-none p-0">
                  {summary.fleets.map((fleet) => (
                    <li key={fleet.id} className="flex justify-between">
                      <span>{fleet.name}</span>
                      <span className="tabular-nums" style={{ color: CHART.inkDim }}>
                        {fleet.ships}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <div style={{ color: CHART.inkDim }}>Adjacent</div>
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {summary.neighbours.map((neighbour) => (
                  <li key={neighbour.id}>
                    <button
                      type="button"
                      className="w-full text-left transition-opacity hover:opacity-80"
                      onClick={() => onSelect(neighbour.id)}
                    >
                      {neighbour.name}
                      {neighbour.passage !== null && (
                        <span
                          style={{
                            color: neighbour.open ? CHART.inkDim : "oklch(0.72 0.2 25)",
                          }}
                        >
                          {" "}
                          via {neighbour.passage}
                          {neighbour.open ? "" : " (closed)"}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Chrome: the ruler readout. */}
      <div
        data-map-obstacle
        className={cn(
          "absolute bottom-3 left-3 rounded-lg border px-3 py-2 text-xs shadow-lg backdrop-blur",
          isPanel && route === null && "hidden",
        )}
        style={{
          background: "oklch(0.16 0.025 245 / 0.9)",
          borderColor: "oklch(0.4 0.02 245)",
          color: CHART.ink,
        }}
      >
        {route === null ? (
          <span style={{ color: CHART.inkDim }}>Shift-click two areas for a route reading</span>
        ) : (
          <div className="flex items-center gap-4">
            <span>
              <strong className="tabular-nums">{route.hops}</strong> hops
            </span>
            <span className="tabular-nums" style={{ color: CHART.inkDim }}>
              {route.nauticalMiles.toLocaleString()} nm
            </span>
            <span className="tabular-nums" style={{ color: CHART.inkDim }}>
              {route.perHop.toLocaleString()} nm/hop
            </span>
            <span className="tabular-nums" style={{ color: CHART.inkDim }}>
              ≈{route.months} months
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onToggleClosedPassages}
              className="h-6 border px-2 text-xs hover:bg-white/10"
              style={{ borderColor: "oklch(0.4 0.02 245)", color: CHART.ink }}
            >
              {state.respectClosedPassages ? "avoiding closures" : "ignoring closures"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
