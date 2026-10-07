/**
 * Canvas coastline layer (ADR-0055). Sits behind the transparent SVG that
 * carries the interactive overlays. It follows the camera by subscribing to
 * its transform instead of living in React state, picks a simplified tier by
 * zoom, and culls whole landmasses by bounding box.
 */

import { useEffect, useRef } from "react";
import { coastlineForTier, coastlineTierFor } from "../../lib/coastline-tiers.js";
import type { FlatPolygon } from "../../lib/simplify-geometry.js";
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

function buildPolygons(
  polygons: readonly FlatPolygon[],
  projection: Projection,
  centre: number,
): BuiltPolygon[] {
  return polygons.map((rings) => {
    const path = new Path2D();
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const flat of rings) {
      for (let i = 0; i < flat.length; i += 2) {
        const [x, y] = projection.project((flat[i] as number) - centre, flat[i + 1] as number);
        if (i === 0) path.moveTo(x, y);
        else path.lineTo(x, y);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      path.closePath();
    }
    return { path, minX, maxX, minY, maxY };
  });
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null || typeof Path2D === "undefined") return;
    const context = canvas.getContext("2d");
    if (context === null) return;
    builtRef.current = new Map();
    let frame = 0;

    const draw = () => {
      frame = 0;
      const svg = camera.svgRef.current;
      const ctm = svg?.getScreenCTM();
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
      const tier = coastlineTierFor(transform.scale);
      let built = builtRef.current.get(tier);
      if (built === undefined) {
        built = buildPolygons(coastlineForTier(polygons, tier), projection, centre);
        builtRef.current.set(tier, built);
      }

      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
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
    const observer = new ResizeObserver(schedule);
    observer.observe(canvas);
    schedule();
    return () => {
      unsubscribe();
      observer.disconnect();
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, [camera, polygons, projection, centre, fill, stroke]);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />;
}
