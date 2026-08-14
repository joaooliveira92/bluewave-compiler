import type { JSX } from "react";
import type { PlayableSlotCountryId } from "@/content/nationAssetManifest.js";
import { NATION_FLAVOR_TEXT } from "@/content/nationFlavorText.js";
import { cn } from "@/lib/utils.js";
import { DossierAccordion } from "./DossierAccordion/index.js";
import { DossierCover } from "./DossierCover.js";
import { DossierHeader } from "./DossierHeader.js";
import { useSlideVisibility } from "./useSlideVisibility.js";

export interface DossierSlidePanelProps {
  countryId: PlayableSlotCountryId;
  isOpen: boolean;
  onConfirm: (countryId: PlayableSlotCountryId) => void;
}

export function DossierSlidePanel({
  countryId,
  isOpen,
  onConfirm,
}: DossierSlidePanelProps): JSX.Element | null {
  const flavor = NATION_FLAVOR_TEXT[countryId];
  const { mounted, entered } = useSlideVisibility(isOpen);

  if (!mounted) return null;

  return (
    <section
      aria-labelledby={`nation-dossier-heading-${countryId}`}
      aria-hidden={!isOpen}
      className={cn(
        "absolute inset-x-0 bottom-0 z-30 max-h-[88dvh] origin-bottom ease-in overflow-y-auto overscroll-contain transition-[transform,opacity] duration-500 ease-&lsqb;cubic-bezier(0.22,1,0.36,1)&rsqb; motion-reduce:transition-none sm:max-h-[78dvh]",
        entered ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0",
      )}
    >
      <div className="relative isolate min-w-0 overflow-hidden border-t border-[#d4a359]/40 bg-[#070b12] shadow-[0_-24px_70px_rgba(0,0,0,0.72),0_0_0_1px_rgba(212,163,89,0.08)]">
        <DossierCover countryId={countryId} />
        <DossierHeader countryId={countryId} nationName={flavor.name} onConfirm={onConfirm} />
        <DossierAccordion
          economy={flavor.economy}
          military={flavor.military}
          diplomacy={flavor.diplomacy}
        />
      </div>
    </section>
  );
}
