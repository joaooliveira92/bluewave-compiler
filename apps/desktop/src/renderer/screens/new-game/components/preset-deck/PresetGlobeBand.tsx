import { memo } from "react";
import { DecorativeGlobe } from "@/components/globe/index.js";

/**
 * The hero band at the top of the preset detail column: the shared globe as pure
 * atmosphere. It is inert and hidden from assistive technology, takes no props,
 * and offers no nation to pick — nation selection happened on the previous step
 * (ADR-0127).
 */
export const PresetGlobeBand = memo(function PresetGlobeBand() {
  return (
    <div
      data-testid="preset-globe-band"
      aria-hidden="true"
      className="relative h-48 w-full flex-none overflow-hidden border-b border-admiralty-border bg-admiralty-surface sm:h-60"
    >
      <DecorativeGlobe />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-6 top-4 h-6 w-6 border-l border-t border-admiralty-signal/25" />
        <div className="absolute right-6 top-4 h-6 w-6 border-r border-t border-admiralty-signal/25" />
        <div className="absolute bottom-4 left-6 h-6 w-6 border-b border-l border-admiralty-signal/25" />
        <div className="absolute bottom-4 right-6 h-6 w-6 border-b border-r border-admiralty-signal/25" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-admiralty-surface to-transparent" />
      </div>
    </div>
  );
});
