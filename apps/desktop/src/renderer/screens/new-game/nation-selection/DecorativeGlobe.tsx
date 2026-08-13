import type { JSX } from "react";

import { GlobeShell } from "./GlobeShell.tsx";
import { useSvgGlobe } from "./useSvgGlobe.ts";

// The menu/launch backdrop globe — a spinning sphere with zero pointer
// interaction. Identical output to the old decorative mode: no pins, no
// selection ring, no drag/zoom/click.
export function DecorativeGlobe(): JSX.Element {
  const globe = useSvgGlobe();
  return <GlobeShell refs={globe} />;
}
