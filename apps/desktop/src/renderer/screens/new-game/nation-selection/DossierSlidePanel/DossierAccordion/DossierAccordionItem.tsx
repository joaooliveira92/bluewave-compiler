import { type KeyboardEvent } from "react";
import { type HoverCardHandle, HoverCardTrigger } from "@/components/ui/hover-card.js";
import { cn } from "@/lib/utils.js";
import { ACCENT_STYLES, DOSSIER_CLOSE_DELAY, DOSSIER_OPEN_DELAY } from "./constants.js";
import type { DossierSection, DossierSectionId } from "./types.js";

export interface DossierAccordionItemProps {
  readonly section: DossierSection;
  /** Whether this section's intelligence card is the one currently shown. */
  readonly active: boolean;
  /** The card shared by all three tabs: moving between them swaps content instead of re-opening. */
  readonly handle: HoverCardHandle<DossierSectionId>;
  readonly onSelect: () => void;
  readonly onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
}

/**
 * One section tab in the dossier strip. Hovering, focusing or tapping it opens the shared
 * intelligence card (see `DossierAccordion`) — the card floats above the strip, so the reader
 * never has to scroll a cramped inline panel. The dotted underline is the hover affordance,
 * matching the ship-part names on the Drawing Board.
 */
export function DossierAccordionItem({
  section,
  active,
  handle,
  onSelect,
  onKeyDown,
}: DossierAccordionItemProps) {
  const Icon = section.icon;
  const accent = ACCENT_STYLES[section.accent];
  const triggerId = `dossier-${section.id}-trigger`;
  const panelId = `dossier-${section.id}-panel`;

  return (
    <HoverCardTrigger
      id={triggerId}
      handle={handle}
      payload={section.id}
      delay={DOSSIER_OPEN_DELAY}
      closeDelay={DOSSIER_CLOSE_DELAY}
      data-dossier-section={section.id}
      aria-label={section.label}
      aria-expanded={active}
      aria-controls={active ? panelId : undefined}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      render={<button type="button" />}
      className={cn(
        "group flex min-h-11 flex-1 cursor-help items-center justify-center gap-2 rounded-md border px-3 py-2 outline-none transition-colors",
        "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-admiralty-accent",
        active
          ? cn(accent.border, accent.bg)
          : "border-transparent hover:border-admiralty-border hover:bg-admiralty-ink/[0.04]",
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", accent.text)} aria-hidden="true" />
      <span
        className={cn(
          "font-display text-[0.68rem] font-black uppercase tracking-[0.16em] underline decoration-dotted underline-offset-4",
          accent.text,
        )}
      >
        {section.label}
      </span>
    </HoverCardTrigger>
  );
}
