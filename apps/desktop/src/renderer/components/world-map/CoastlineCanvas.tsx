/**
 * Canvas coastline layer (ADR-0055). Sits behind the transparent SVG that
 * carries the interactive overlays. It follows the camera by subscribing to
 * its transform instead of living in React state, picks a simplified tier by
 * zoom, and culls whole landmasses by bounding box. The detail tiers are built
 * in the background in short time slices (coarsest first), and the best tier
 * that is ready is drawn meanwhile, so crossing a zoom threshold never stalls
 * a frame.
 */

import { useEffect, useRef, useState } from "react";
import {
  COASTLINE_TIER_TOLERANCES,
  coastlineTierFor,
  type CoastlineTier,
} from "../../lib/coastline-tiers.js";
import { simplifyPolygons, type FlatPolygon } from "../../lib/simplify-geometry.js";
import { runTimeSliced, type TimeSliceHandle } from "../../lib/time-slice.js";
import type { MapCamera } from "./useMapCamera.js";
import { WORLD_WRAP_TURNS, type Projection } from "./projection.js";

interface BuiltPolygon {
  readonly path: Path2D;
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
}

export interface CoastlineCanvasProps {
  readonly camera: MapCamera;
  readonly polygons: readonly FlatPolygon[];
  readonly projection: Projection;
  readonly centre: number;
  readonly fill: string;
  readonly stroke: string;
}

const TIERS: readonly CoastlineTier[] = [0, 1, 2];
/** Source polygons simplified per step. */
const BATCH = 8;
/** Points projected between yields, so one continent cannot stall a frame. */
const POINTS_PER_STEP = 4000;
const SLICE_BUDGET_MS = 6;

function* buildTier(
  source: readonly FlatPolygon[],
  tier: CoastlineTier,
  projection: Projection,
  centre: number,
): Generator<void, BuiltPolygon[]> {
  const tolerance = COASTLINE_TIER_TOLERANCES[tier] as number;
  const built: BuiltPolygon[] = [];
  let pending = 0;
  for (let i = 0; i < source.length; i += BATCH) {
    const slice = source.slice(i, i + BATCH);
    const polygons = tolerance === 0 ? slice : simplifyPolygons(slice, tolerance);
    yield;
    for (const rings of polygons) {
      const path = new Path2D();
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const flat of rings) {
        for (let k = 0; k < flat.length; k += 2) {
          const [x, y] = projection.project((flat[k] as number) - centre, flat[k + 1] as number);
          if (k === 0) path.moveTo(x, y);
          else path.lineTo(x, y);
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          if (++pending >= POINTS_PER_STEP) {
            pending = 0;
            yield;
          }
        }
        path.closePath();
      }
      built.push({ path, minX, maxX, minY, maxY });
    }
  }
  return built;
}

export function CoastlineCanvas({
  camera,
  polygons,
  projection,
  centre,
  fill,
  stroke,
}: CoastlineCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const builtRef = useRef(new Map<number, BuiltPolygon[]>());
  // `camera` is a fresh object every render; the effect must not restart (and
  // throw away the built tiers) each time the zoom band re-renders the chart.
  const cameraRef = useRef(camera);
  useEffect(() => {
    cameraRef.current = camera;
  });
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;
    const context = typeof Path2D === "undefined" ? null : canvas.getContext("2d");
    if (context === null) {
      setSupported(false);
      return;
    }
    setSupported(true);
    builtRef.current = new Map();
    const camera = cameraRef.current;
    let frame = 0;

    const draw = () => {
      frame = 0;
      const svg = camera.svgRef.current;
      const ctm = svg?.getScreenCTM?.();
      if (svg === null || ctm === null || ctm === undefined) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = Math.round(rect.width * dpr);
      const height = Math.round(rect.height * dpr);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      const transform = camera.getTransform();
      // Best tier that is ready, at or below the wanted detail.
      let built: BuiltPolygon[] | undefined;
      for (let tier = coastlineTierFor(transform.scale); tier >= 0 && built === undefined; tier--) {
        built = builtRef.current.get(tier);
      }

      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      if (built === undefined) return;
      const a = ctm.a * transform.scale;
      const d = ctm.d * transform.scale;
      const f = ctm.d * transform.y + ctm.f - rect.top;
      context.fillStyle = fill;
      context.strokeStyle = stroke;
      // Hairline stays ~1 screen pixel at every zoom.
      context.lineWidth = dpr / Math.min(a, d);
      context.lineJoin = "round";

      for (const turn of WORLD_WRAP_TURNS) {
        const e =
          ctm.a * (transform.x + transform.scale * turn * projection.width) + ctm.e - rect.left;
        context.setTransform(a * dpr, 0, 0, d * dpr, e * dpr, f * dpr);
        for (const polygon of built) {
          const left = a * polygon.minX + e;
          const right = a * polygon.maxX + e;
          const top = d * polygon.minY + f;
          const bottom = d * polygon.maxY + f;
          if (right < 0 || left > rect.width || bottom < 0 || top > rect.height) continue;
          context.fill(polygon.path, "evenodd");
          context.stroke(polygon.path);
        }
      }
    };

    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(draw);
    };
    const unsubscribe = camera.subscribe(schedule);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    observer?.observe(canvas);
    schedule();

    let building: TimeSliceHandle | null = null;
    const buildFrom = (index: number) => {
      const tier = TIERS[index];
      if (tier === undefined) return;
      building = runTimeSliced(
        buildTier(polygons, tier, projection, centre),
        {
          budgetMs: SLICE_BUDGET_MS,
          now: () => performance.now(),
          schedule: (resume) => {
            setTimeout(resume, 0);
          },
        },
        (result) => {
          builtRef.current.set(tier, result);
          schedule();
          buildFrom(index + 1);
        },
      );
    };
    buildFrom(0);

    return () => {
      building?.cancel();
      unsubscribe();
      observer?.disconnect();
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, [polygons, projection, centre, fill, stroke]);

  return (
    <>
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
      {!supported && (
        <div
          role="alert"
          className="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-md border px-2.5 py-1 text-xs"
          style={{
            background: "oklch(0.16 0.025 245 / 0.85)",
            borderColor: "oklch(0.55 0.15 25)",
            color: "oklch(0.92 0.01 240)",
          }}
        >
          Coastline unavailable: canvas drawing is not supported here.
        </div>
      )}
    </>
  );
}
