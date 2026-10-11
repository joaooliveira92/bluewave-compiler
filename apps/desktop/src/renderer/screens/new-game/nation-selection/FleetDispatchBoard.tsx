import { type KeyboardEvent, useCallback, useEffect, useMemo, useRef } from "react";
import type { PlayableSlotCountryId } from "@/content/nationAssetManifest.js";
import { FleetNationCard } from "./FleetNationCard.js";
import { FleetStack } from "./FleetStack.js";
import { CARD_PALETTES, normalizeIndex } from "./fleetDispatchUtils.js";

interface FleetDispatchBoardProps {
  slots: readonly PlayableSlotCountryId[];
  focusedIndex: number;
  listboxId: string;
  onSelect: (index: number) => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
}

const WHEEL_THRESHOLD_PX = 32;
const WHEEL_COOLDOWN_MS = 360;

export function FleetDispatchBoard({
  slots,
  focusedIndex,
  listboxId,
  onSelect,
  onKeyDown,
}: FleetDispatchBoardProps): React.JSX.Element {
  const SLOTS = slots;
  const normalizedFocusedIndex = normalizeIndex(focusedIndex, SLOTS.length);
  const focusedCountryId = SLOTS[normalizedFocusedIndex];

  const containerRef = useRef<HTMLDivElement | null>(null);
  const wheelAccumulatorRef = useRef(0);
  const wheelLockedRef = useRef(false);
  const wheelUnlockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const navigate = useCallback(
    (delta: number) => {
      if (SLOTS.length <= 1) return;
      onSelect(normalizeIndex(normalizedFocusedIndex + delta, SLOTS.length));
    },
    [SLOTS.length, normalizedFocusedIndex, onSelect],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (event: WheelEvent) => {
      if (SLOTS.length <= 1 || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

      event.preventDefault();
      if (wheelLockedRef.current) return;

      let delta = event.deltaY;
      if (event.deltaMode === 1) delta *= 16;
      else if (event.deltaMode === 2) delta *= 100;

      wheelAccumulatorRef.current += delta;
      if (Math.abs(wheelAccumulatorRef.current) < WHEEL_THRESHOLD_PX) return;

      navigate(wheelAccumulatorRef.current > 0 ? 1 : -1);

      wheelLockedRef.current = true;
      wheelAccumulatorRef.current = 0;
      if (wheelUnlockTimerRef.current !== null) clearTimeout(wheelUnlockTimerRef.current);
      wheelUnlockTimerRef.current = setTimeout(() => {
        wheelLockedRef.current = false;
        wheelUnlockTimerRef.current = null;
      }, WHEEL_COOLDOWN_MS);
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
      if (wheelUnlockTimerRef.current !== null) clearTimeout(wheelUnlockTimerRef.current);
    };
  }, [SLOTS.length, navigate]);

  const cards = useMemo(
    () =>
      SLOTS.map((countryId, index) => (
        <FleetNationCard
          key={countryId}
          countryId={countryId}
          palette={CARD_PALETTES[index % CARD_PALETTES.length] as (typeof CARD_PALETTES)[number]}
          active={index === normalizedFocusedIndex}
          listboxId={listboxId}
        />
      )),
    [SLOTS, listboxId, normalizedFocusedIndex],
  );

  if (SLOTS.length < 1) {
    return (
      <aside className="relative z-10 flex min-h-112 w-full flex-col border-b border-admiralty-border bg-admiralty-surface-raised/94 lg:h-full lg:w-[min(38vw,34rem)] lg:border-b-0 lg:border-r">
        <div className="flex flex-1 items-center justify-center">
          <p className="font-display text-sm uppercase tracking-widest text-admiralty-ink-muted">
            No fleet commissions available
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside
      aria-labelledby={`${listboxId}-heading`}
      className="
        relative z-10
        flex min-h-152 w-full
        flex-none flex-col
        overflow-hidden
        border-b border-admiralty-border
        bg-admiralty-surface-raised/94
        py-4

        sm:min-h-172
        sm:py-5

        lg:h-full
        lg:min-h-0
        lg:w-[min(39vw,36rem)]
        lg:border-b-0
        lg:border-r

        xl:w-[min(36vw,39rem)]
      "
    >
      <header className="relative z-30 flex flex-none items-start justify-between gap-4 px-4 sm:px-6">
        <div className="min-w-0">
          <p className="hidden sm:block font-display text-[0.65rem] uppercase tracking-[0.32em] text-admiralty-ink-muted">
            Admiralty Registry
          </p>

          <h2
            id={`${listboxId}-heading`}
            className="mt-1 font-display text-lg font-bold uppercase tracking-[0.16em] text-admiralty-ink sm:text-lg"
          >
            Fleet Dispatch
          </h2>
          <p
            id={`${listboxId}-instructions`}
            className="mt-1 max-w-sm text-sm leading-relaxed text-admiralty-ink-muted"
          >
            Drag a card away, scroll, or use the arrow keys to inspect each nation. Press Enter to
            confirm.
          </p>
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={containerRef}
          id={listboxId}
          role="listbox"
          tabIndex={0}
          aria-label="Playable nations"
          aria-describedby={`${listboxId}-instructions`}
          aria-activedescendant={`${listboxId}-option-${focusedCountryId}`}
          onKeyDown={onKeyDown}
          className="absolute inset-0 touch-none overflow-hidden rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-admiralty-accent focus-visible:ring-offset-2 focus-visible:ring-offset-admiralty-surface overscroll-contain perspective-distant"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-[12%] bottom-[7%] top-[12%] rounded-[50%] bg-[radial-gradient(ellipse_at_center,color-mix(in_srgb,var(--color-admiralty-signal)_10%,transparent),transparent_68%)] blur-xl"
          />

          <div className="absolute inset-x-0 top-1/2 mx-auto h-[19.5rem] w-[min(94%,29rem)] -translate-y-1/2 sm:h-[21.5rem]">
            <FleetStack
              cards={cards}
              layout="deck"
              visible={4}
              spread={0.9}
              depth={0.55}
              radius={18}
              tilt={26}
              speed={1.1}
              topIndex={normalizedFocusedIndex}
              onCardActivate={onSelect}
              onChange={onSelect}
            />
          </div>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-[12%] bottom-[4%] z-100 rounded-[50%] bg-admiralty-surface/55 blur-xl"
          />

          <div className="pointer-events-none absolute bottom-3 left-1/2 z-110 -translate-x-1/2 whitespace-nowrap rounded-full border border-admiralty-border bg-admiralty-surface-raised/90 px-3 py-1.5 font-display text-[0.58rem] uppercase tracking-[0.18em] text-admiralty-ink-muted backdrop-blur-sm">
            Drag · Scroll · ↑ ↓ · Enter
          </div>
        </div>
      </div>
    </aside>
  );
}
