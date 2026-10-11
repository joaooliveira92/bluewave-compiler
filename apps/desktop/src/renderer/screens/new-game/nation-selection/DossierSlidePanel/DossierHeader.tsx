import { ShipWheel } from "lucide-react";
import type { JSX } from "react";
import type { PlayableSlotCountryId } from "@/content/nationAssetManifest.js";
import { NationEmblem } from "./NationEmblem.js";
import { getCountryCode } from "./nationArtwork.js";

interface DossierHeaderProps {
  countryId: PlayableSlotCountryId;
  nationName: string;
  appointmentTitle: string;
}

export function DossierHeader({
  countryId,
  nationName,
  appointmentTitle,
}: DossierHeaderProps): JSX.Element {
  return (
    <header className="flex items-center gap-3 border-b border-admiralty-accent/20 bg-admiralty-surface/25 px-4 py-2.5 backdrop-blur-md sm:gap-4 sm:px-5">
      <NationEmblem countryId={countryId} />
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 sm:flex-nowrap">
        <h3
          id={`nation-dossier-heading-${countryId}`}
          className="truncate font-display text-base font-black uppercase tracking-[0.1em] text-admiralty-ink sm:text-xl sm:tracking-[0.12em]"
        >
          {nationName}
        </h3>
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <ShipWheel className="h-3.5 w-3.5 shrink-0 text-admiralty-accent" aria-hidden="true" />
          <p className="truncate font-display text-[0.55rem] uppercase tracking-[0.18em] text-admiralty-ink-muted sm:text-[0.6rem] sm:tracking-[0.24em]">
            You have been appointed {appointmentTitle}
          </p>
        </span>
        <p className="ml-auto hidden shrink-0 font-display text-[0.55rem] uppercase tracking-[0.18em] text-admiralty-accent/80 sm:block sm:text-[0.6rem]">
          Fleet record · {getCountryCode(countryId)}
        </p>
      </div>
    </header>
  );
}
