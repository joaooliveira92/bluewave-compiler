import { useReducedMotion } from "motion/react";
import type { JSX } from "react";
import { GlobeShell } from "./GlobeShell.js";
import { useSvgGlobe } from "./useSvgGlobe.js";

/**
 * A decorative globe: the shared orthographic sphere with none of the nation
 * globe's behaviour. No pins, no selection ring, no drag/zoom/click, no props
 * that name a nation — it is hidden from assistive technology and must never
 * imply that a nation (or anything else) can be picked from it.
 *
 * It reads only the static world topology and the theme's CSS variables, and it
 * idles slowly unless the player prefers reduced motion. It fills its nearest
 * positioned ancestor, so the consumer supplies the box (ADR-0127).
 */
export function DecorativeGlobe(): JSX.Element {
  const reduceMotion = useReducedMotion();
  const globe = useSvgGlobe({ autorotate: !reduceMotion });
  return <GlobeShell refs={globe} decorative />;
}
