import { Check } from "lucide-react";
import { type CSSProperties, type MouseEvent, useMemo, useState } from "react";
import type { PlayableSlotCountryId } from "@/content/nationAssetManifest.js";
import {
  type CardPalette,
  getCountryCode,
  getCountryName,
  resolveNationShip,
  type StackPosition,
} from "./fleetDispatchUtils.js";

interface FleetDispatchCardProps {
  countryId: PlayableSlotCountryId;
  index: number;
  position: StackPosition;
  palette: CardPalette;
  style: CSSProperties;
  listboxId: string;
  dragState: "idle" | "dragging";
  onClick: (event: MouseEvent<HTMLDivElement>, index: number) => void;
}

export function FleetDispatchCard({
  countryId,
  index,
  position,
  palette,
  style,
  listboxId,
  dragState,
  onClick,
}: FleetDispatchCardProps): React.JSX.Element {
  const [imageFailed, setImageFailed] = useState(false);
  const countryName = getCountryName(countryId);
  const countryCode = getCountryCode(countryId);
  const shipAsset = useMemo(() => resolveNationShip(countryId), [countryId]);
  const showImage = shipAsset !== null && !imageFailed;

  return (
    <div
      id={`${listboxId}-option-${countryId}`}
      role="option"
      tabIndex={-1}
      aria-label={countryName}
      aria-selected={position.active}
      aria-hidden={position.visible ? undefined : true}
      onClick={(event) => onClick(event, index)}
      style={{
        ...style,
        // Per-nation cover gradient stays invariant: it is only ever visible
        // behind missing ship artwork, and is documented as decorative data.
        background: palette.background,
        borderColor: position.active ? "var(--color-admiralty-accent)" : palette.border,
      }}
      className={`
        absolute left-1/2 top-[48%] h-[17rem] w-[min(94%,29rem)]
        origin-center select-none overflow-hidden rounded-[1.15rem] border
        shadow-[0_20px_45px_rgba(0,0,0,0.52)]
        transition-[transform,opacity,filter,border-color,box-shadow] duration-500
        ease-&lsqb;cubic-bezier(0.22,1,0.36,1)&rsqb; motion-reduce:duration-0 sm:h-[19rem]
        ${
          position.active
            ? "shadow-[0_28px_65px_rgba(0,0,0,0.72),0_0_0_1px_color-mix(in_srgb,var(--color-admiralty-accent)_20%,transparent)]"
            : "cursor-pointer hover:brightness-110"
        }
        ${dragState === "dragging" ? "cursor-grabbing duration-75" : "cursor-grab"}
      `}
    >
      {/* Full-card naval cover */}
      {showImage ? (
        <img
          src={shipAsset.url}
          alt={shipAsset.label}
          draggable={false}
          onError={() => setImageFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div
          aria-label={`${countryName} naval vessel unavailable`}
          role="img"
          className="absolute inset-0 flex items-center justify-center bg-admiralty-surface-raised"
        >
          <span
            aria-hidden="true"
            className="font-display text-5xl font-black tracking-[0.16em] text-admiralty-ink-muted"
          >
            {countryCode}
          </span>
        </div>
      )}

      {/* Photo scrim: follows the active theme so the ink below stays legible
          on the (invariant) photographic artwork. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-admiralty-surface/75 via-admiralty-surface/5 to-admiralty-surface/85"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.10] mix-blend-overlay"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.22) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.22) 1px, transparent 1px)
          `,
          backgroundSize: "26px 26px",
        }}
      />

      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 z-10 h-1.5"
        style={{
          // Per-nation identity stripe (decorative data), invariant across themes.
          backgroundColor: palette.accent,
          boxShadow: position.active ? `0 0 18px ${palette.accent}` : undefined,
        }}
      />

      {/* Active-nation emphasis: mounted only while active, so its animation
          replays on every selection change (see globals.css). */}
      {position.active ? (
        <span aria-hidden="true" className="fleet-dispatch-activate-glow" />
      ) : null}

      {/* Bottom information shelf overlays the ship cover. The frosted blur is
          reserved for the active card — running it on every stacked card is a
          large per-frame paint cost during the selection transition. */}
      <div
        className={`absolute inset-x-0 bottom-0 z-20 min-h-[4.8rem] border-t border-admiralty-ink/20 px-5 py-3 text-admiralty-ink ${
          position.active ? "bg-admiralty-surface/35 backdrop-blur-md" : "bg-admiralty-surface/55"
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-base font-black uppercase tracking-wide sm:text-lg">
              {countryName}
            </p>
            <p className="mt-0.5 font-display text-[0.6rem] uppercase tracking-[0.16em] text-admiralty-ink/60">
              Fleet silhouette registry
            </p>
          </div>

          {position.active ? (
            <span className="fleet-dispatch-badge-pop flex shrink-0 items-center gap-1.5 rounded bg-admiralty-accent px-2.5 py-1 font-display text-[0.7rem] font-black uppercase tracking-wider text-admiralty-accent-foreground">
              <Check className="h-3 w-3" aria-hidden="true" />
              Active
            </span>
          ) : (
            <span className="shrink-0 font-display text-[0.58rem] uppercase tracking-wider text-admiralty-ink/65">
              Select
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
