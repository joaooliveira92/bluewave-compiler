import type { KeyboardEvent } from "react";
import { useMemo } from "react";
import { CARD_PALETTES, DeckMasterPane, normalizeIndex } from "@/components/card-deck/index.js";
import type { PlayableSlotCountryId } from "@/content/nationAssetManifest.js";
import { FleetNationCard } from "./FleetNationCard.js";

interface FleetDispatchBoardProps {
  slots: readonly PlayableSlotCountryId[];
  focusedIndex: number;
  listboxId: string;
  onSelect: (index: number) => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
}

/**
 * The Fleet Dispatch master pane: the nation cards as a configuration of the
 * shared `DeckMasterPane`. Every focus change and tap selects; keyboard input is
 * owned by the parent screen (it also handles Enter/Escape and plays the UI
 * sounds), so it is forwarded untouched.
 */
export function FleetDispatchBoard({
  slots,
  focusedIndex,
  listboxId,
  onSelect,
  onKeyDown,
}: FleetDispatchBoardProps): React.JSX.Element {
  const normalizedFocusedIndex = normalizeIndex(focusedIndex, slots.length);

  const cards = useMemo(
    () =>
      slots.map((countryId, index) => (
        <FleetNationCard
          key={countryId}
          countryId={countryId}
          palette={CARD_PALETTES[index % CARD_PALETTES.length] as (typeof CARD_PALETTES)[number]}
          active={index === normalizedFocusedIndex}
          listboxId={listboxId}
        />
      )),
    [slots, listboxId, normalizedFocusedIndex],
  );
  const optionIds = useMemo(
    () => slots.map((countryId) => `${listboxId}-option-${countryId}`),
    [slots, listboxId],
  );

  return (
    <DeckMasterPane
      listboxId={listboxId}
      eyebrow="Admiralty Registry"
      heading="Fleet Dispatch"
      instructions="Drag a card away, scroll, or use the arrow keys to inspect each nation. Press Enter to confirm."
      ariaLabel="Playable nations"
      hint="Drag · Scroll · ↑ ↓ · Enter"
      emptyMessage="No fleet commissions available"
      cards={cards}
      optionIds={optionIds}
      focusedIndex={focusedIndex}
      onFocusIndex={onSelect}
      onActivateIndex={onSelect}
      onKeyDown={onKeyDown}
    />
  );
}
