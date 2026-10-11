import { Anchor, ShipWheel } from "lucide-react";
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
    <header className="relative flex items-center gap-3 border-b border-admiralty-accent/25 bg-gradient-to-b from-admiralty-surface-raised/65 via-admiralty-surface/35 to-transparent px-4 py-3 backdrop-blur-md sm:gap-4 sm:px-5">
      <NationEmblem countryId={countryId} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <h3
            id={`nation-dossier-heading-${countryId}`}
            className="truncate font-display text-lg font-black uppercase tracking-[0.1em] text-admiralty-ink drop-shadow-[0_1px_0_rgba(0,0,0,0.25)] sm:text-2xl sm:tracking-[0.12em]"
          >
            {nationName}
          </h3>
          <span className="inline-flex shrink-0 items-center rounded-sm border border-admiralty-accent/40 bg-admiralty-accent/10 px-1.5 py-0.5 font-display text-[0.55rem] font-black uppercase tracking-[0.2em] text-admiralty-accent">
            {getCountryCode(countryId)}
          </span>
          <p className="ml-auto hidden shrink-0 items-center gap-1.5 font-display text-[0.55rem] uppercase tracking-[0.18em] text-admiralty-accent/80 sm:flex sm:text-[0.6rem]">
            <Anchor className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Fleet record
          </p>
        </div>
        <span className="inline-flex w-fit min-w-0 items-center gap-1.5 rounded-full border border-admiralty-accent/20 bg-admiralty-accent/[0.06] px-2.5 py-1">
          <ShipWheel className="h-3.5 w-3.5 shrink-0 text-admiralty-accent" aria-hidden="true" />
          <p className="truncate font-display text-[0.55rem] uppercase tracking-[0.18em] text-admiralty-ink-muted sm:text-[0.6rem] sm:tracking-[0.22em]">
            You have been appointed {appointmentTitle}
          </p>
        </span>
      </div>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-admiralty-accent/60 to-transparent"
      />
    </header>
  );
}
