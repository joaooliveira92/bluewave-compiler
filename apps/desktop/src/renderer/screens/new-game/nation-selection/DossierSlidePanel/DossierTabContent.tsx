import type { JSX, ReactNode } from "react";
import type { PlayableSlotCountryId } from "@/content/nationAssetManifest.js";
import { NATION_DOSSIER_FIELDS } from "@/content/nationDossierFields.js";
import type { NationFlavorText } from "@/content/nationFlavorText.js";

interface DossierFieldRowProps {
  label: string;
  value: string;
}

function DossierFieldRow({ label, value }: DossierFieldRowProps): JSX.Element {
  return (
    <div className="grid grid-cols-[minmax(6.5rem,auto)_1fr] items-baseline gap-x-3 gap-y-0.5 border-t border-admiralty-border/40 py-1.5 first:border-t-0 first:pt-0">
      <dt className="font-display text-[0.6rem] font-black uppercase tracking-[0.12em] text-admiralty-accent">
        {label}
      </dt>
      <dd className="text-[0.74rem] leading-relaxed text-admiralty-ink-muted">{value}</dd>
    </div>
  );
}

export interface DossierTabs {
  readonly economy: ReactNode;
  readonly military: ReactNode;
  readonly diplomacy: ReactNode;
}

/**
 * Composes the existing per-nation flavor paragraph (`nationFlavorText.ts`)
 * with INC-2's new hand-authored dossier fields (`nationDossierFields.ts`)
 * into the existing three-section accordion (spec §1) — no 4th section.
 */
export function buildDossierTabs(
  countryId: PlayableSlotCountryId,
  flavor: NationFlavorText,
): DossierTabs {
  const fields = NATION_DOSSIER_FIELDS[countryId];

  return {
    economy: (
      <div>
        <p className="font-display text-[.85rem] leading-relaxed">{flavor.economy}</p>
        <dl className="mt-3">
          <DossierFieldRow label="Budget category" value={fields.budgetCategory} />
          <DossierFieldRow label="Shipbuilding capacity" value={fields.shipbuildingCapacity} />
          <DossierFieldRow label="Research strengths" value={fields.researchStrengths} />
          <DossierFieldRow label="Research weaknesses" value={fields.researchWeaknesses} />
        </dl>
      </div>
    ),
    military: (
      <div>
        <p className="font-display text-[.85rem] leading-relaxed">{flavor.military}</p>
        <dl className="mt-3">
          <DossierFieldRow label="Doctrine" value={fields.doctrine} />
          <DossierFieldRow label="Difficulty" value={`${fields.difficulty} / 5`} />
          <DossierFieldRow label="Likely rivals" value={fields.likelyRivals.join(", ")} />
        </dl>
      </div>
    ),
    diplomacy: (
      <div>
        <p className="font-display text-[.85rem] leading-relaxed">{flavor.diplomacy}</p>
        <dl className="mt-3">
          <DossierFieldRow label="Strategic regions" value={fields.strategicRegions} />
          <DossierFieldRow
            label="National characteristics"
            value={fields.nationalCharacteristics}
          />
        </dl>
      </div>
    ),
  };
}
