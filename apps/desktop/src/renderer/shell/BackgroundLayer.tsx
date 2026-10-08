import type { ReactNode } from "react";
import Auralis from "../components/backgrounds/auralis.js";
import Nebulore from "../components/backgrounds/nebulore.js";
import { StarsBackground } from "../components/backgrounds/starts.js";
import { ShaderBackground } from "../components/motion/shader-background.js";
import type { BackgroundStyle } from "./BackgroundContext.js";

export type ResolvedTheme = "light" | "dark";

export interface BackgroundLayerProps {
  readonly background: BackgroundStyle;
  readonly resolvedTheme: ResolvedTheme;
}

/**
 * One renderer per selectable background, keyed by the `BackgroundStyle` union.
 * Adding a background is a new map entry and a new `BackgroundStyle` member —
 * this component never changes. The theme is passed in so each renderer picks
 * its own light/dark palette rather than the component branching on style.
 */
type BackgroundRenderer = (resolvedTheme: ResolvedTheme) => ReactNode;

const BACKGROUND_RENDERERS: Record<BackgroundStyle, BackgroundRenderer> = {
  water: (theme) => (
    <ShaderBackground
      variant="water"
      className="fixed inset-0 -z-10"
      colorBack={theme === "dark" ? "#010101" : "#dbe9f4"}
      colorHighlight={theme === "dark" ? "#121212" : "#ffffff"}
      speed={0.125}
    />
  ),
  stars: () => <StarsBackground className="fixed inset-0 -z-10" />,
  "mesh-citrus": (theme) => (
    <ShaderBackground
      variant="mesh-gradient"
      className="fixed inset-0 -z-10"
      colors={
        theme === "dark"
          ? ["#020202", "#2b1400", "#0f1a05", "#402008"]
          : ["#fff8e8", "#ffd166", "#d4f0a0", "#ffb84d"]
      }
      distortion={0.8}
      swirl={0.4}
      speed={0.125}
    />
  ),
  "mesh-lagoon": (theme) => (
    <ShaderBackground
      variant="mesh-gradient"
      className="fixed inset-0 -z-10"
      colors={
        theme === "dark"
          ? ["#020a0a", "#0a2e2e", "#042a40", "#1a0a40"]
          : ["#f0fffa", "#5eead4", "#38bdf8", "#a78bfa"]
      }
      distortion={0.8}
      swirl={0.4}
      speed={0.15}
    />
  ),
  auralis: (theme) => (
    <Auralis
      className="fixed inset-0 -z-10"
      speed={0.03}
      colors={
        theme === "dark" ? ["#ef4444", "#dc2626", "#b91c1c"] : ["#ffb3b3", "#ff8a8a", "#ff6b6b"]
      }
    />
  ),
  nebulore: (theme) => (
    <Nebulore
      className="fixed inset-0 -z-10"
      speed={0.025}
      colors={
        theme === "dark" ? ["#312e81", "#9333ea", "#22d3ee"] : ["#c7d2fe", "#d8b4fe", "#a5f3fc"]
      }
    />
  ),
  none: () => null,
};

export function BackgroundLayer({ background, resolvedTheme }: BackgroundLayerProps) {
  return <>{BACKGROUND_RENDERERS[background](resolvedTheme)}</>;
}
