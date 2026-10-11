import { Anchor, Coins, Scroll } from "lucide-react";
import { type JSX, type KeyboardEvent, useMemo, useState } from "react";
import { createHoverCardHandle, HoverCard, HoverCardContent } from "@/components/ui/hover-card.js";
import { cn } from "@/lib/utils.js";
import { ACCENT_STYLES } from "./constants.js";
import { DossierAccordionItem } from "./DossierAccordionItem.js";
import type { DossierSection, DossierSectionId } from "./types.js";

interface DossierAccordionProps {
  economy: React.ReactNode;
  military: React.ReactNode;
  diplomacy: React.ReactNode;
}

const isSectionId = (value: string | undefined): value is DossierSectionId =>
  value === "economy" || value === "military" || value === "diplomacy";

/**
 * The dossier's three intelligence sections as a hover strip. Each tab opens one shared card
 * (Base UI's detached-handle preview card) rather than expanding a fixed-height inline panel, so
 * moving between sections swaps the card's content and nothing ever needs to be scrolled. Hover,
 * keyboard focus and a click/tap all open it; Escape or a press outside closes it.
 */
export function DossierAccordion({
  economy,
  military,
  diplomacy,
}: DossierAccordionProps): JSX.Element {
  const [handle] = useState(() => createHoverCardHandle<DossierSectionId>());
  const [active, setActive] = useState<DossierSectionId | null>(null);

  const sections = useMemo<DossierSection[]>(
    () => [
      { id: "economy", label: "Economy", text: economy, icon: Coins, accent: "gold" },
      { id: "military", label: "Military", text: military, icon: Anchor, accent: "red" },
      { id: "diplomacy", label: "Diplomacy", text: diplomacy, icon: Scroll, accent: "blue" },
    ],
    [economy, military, diplomacy],
  );

  const triggerId = (id: DossierSectionId): string => `dossier-${id}-trigger`;

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>, index: number): void => {
    let target: number | null = null;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      target = (index + 1) % sections.length;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      target = (index - 1 + sections.length) % sections.length;
    }

    if (event.key === "Home") target = 0;
    if (event.key === "End") target = sections.length - 1;

    if (target !== null) {
      event.preventDefault();
      const next = sections[target];
      if (next !== undefined) document.getElementById(triggerId(next.id))?.focus();
    }
  };

  return (
    <div className="relative">
      <div
        role="group"
        aria-label="Nation dossier sections"
        className="flex items-stretch gap-1.5 border-t border-admiralty-border/60 bg-admiralty-surface/40 px-3 py-2.5 backdrop-blur-md sm:px-5"
      >
        {sections.map((section, index) => (
          <DossierAccordionItem
            key={section.id}
            section={section}
            active={active === section.id}
            handle={handle}
            onSelect={() => setActive(section.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          />
        ))}
      </div>

      <HoverCard
        handle={handle}
        open={active !== null}
        triggerId={active === null ? null : triggerId(active)}
        onOpenChange={(open, details) => {
          const id =
            details.trigger instanceof HTMLElement
              ? details.trigger.dataset["dossierSection"]
              : undefined;
          setActive(open && isSectionId(id) ? id : open ? active : null);
        }}
      >
        {({ payload }) => {
          const section = sections.find((candidate) => candidate.id === payload);
          if (section === undefined) return null;
          const Icon = section.icon;
          const accent = ACCENT_STYLES[section.accent];
          return (
            <HoverCardContent
              id={`dossier-${section.id}-panel`}
              side="top"
              align="center"
              sideOffset={12}
              collisionPadding={12}
              className="w-[min(34rem,calc(100vw-1.5rem))] max-h-[min(70vh,var(--available-height))] overflow-y-auto overscroll-contain rounded-lg border border-admiralty-accent/30 bg-admiralty-surface-raised/95 p-0 text-admiralty-ink shadow-[0_18px_60px_rgba(0,0,0,0.6)] backdrop-blur-md motion-reduce:animate-none"
            >
              <div
                className={cn(
                  "sticky top-0 flex items-center gap-2 border-b px-4 py-2.5 backdrop-blur-md",
                  accent.border,
                  accent.bg,
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", accent.text)} aria-hidden="true" />
                <span
                  className={cn(
                    "font-display text-[0.7rem] font-black uppercase tracking-[0.18em]",
                    accent.text,
                  )}
                >
                  {section.label}
                </span>
                <span className="ml-auto font-display text-[0.55rem] uppercase tracking-[0.18em] text-admiralty-ink-faint">
                  Intelligence
                </span>
              </div>
              <div className="px-4 py-3">{section.text}</div>
            </HoverCardContent>
          );
        }}
      </HoverCard>
    </div>
  );
}
