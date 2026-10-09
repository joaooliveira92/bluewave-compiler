import { type ReactNode, type RefObject, useId, useState } from "react";
import {
  createHoverCardHandle,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../../../../../components/ui/hover-card.js";
import { cn } from "../../../../../lib/utils.js";
import { SECTION_IDS, SECTIONS, sectionSpan, type SectionId, type ZoneRange } from "./sections.js";

/** Rest before a card opens, so sweeping the pointer across the strip opens nothing (ms). */
export const SECTION_OPEN_DELAY = 200;
/** Grace before a card closes, long enough to move the pointer from a label into its card (ms). */
export const SECTION_CLOSE_DELAY = 300;

const isSectionId = (v: string | undefined): v is SectionId =>
  (SECTION_IDS as readonly string[]).includes(v ?? "");

/**
 * The section names under the plan, one button per section placed over that section's span, alternating
 * between two rows so neighbouring names never collide. All eight share one hover card: moving between labels
 * swaps its content instead of closing and re-opening it. Hover, keyboard focus, and a tap or click all open it.
 */
export function SectionLabels({
  zones,
  active,
  onActiveChange,
  renderCard,
  anchor,
}: {
  readonly zones: readonly ZoneRange[];
  /** Section whose card is open; owned by the plan so it can highlight the same section. */
  readonly active: SectionId | null;
  readonly onActiveChange: (id: SectionId | null) => void;
  readonly renderCard: (id: SectionId) => ReactNode;
  /**
   * What the card is placed beside: the whole drawing, so the open card never covers the plan, its highlight or
   * the neighbouring labels (which the pointer may be heading for).
   */
  readonly anchor?: RefObject<HTMLElement | null>;
}) {
  const [handle] = useState(() => createHoverCardHandle<SectionId>());
  const prefix = useId();
  const triggerId = (id: SectionId) => `${prefix}-section-${id}`;
  const spans = SECTION_IDS.map((id) => {
    const zone = zones.find((z) => z.id === SECTIONS[id].zoneId);
    return { id, span: zone ? sectionSpan(zone) : undefined };
  });
  // Without the hull form's zones there is no geometry to align to: lay the labels out evenly instead.
  const aligned = spans.every((s) => s.span !== undefined);
  return (
    <>
      <div
        role="group"
        aria-label="Hull sections"
        className={cn("@container", aligned ? "relative h-15" : "grid grid-cols-4 gap-1")}
        data-testid="section-labels"
        data-aligned={aligned}
      >
        {spans.map(({ id, span }, i) => {
          const meta = SECTIONS[id];
          return (
            <HoverCardTrigger
              key={id}
              id={triggerId(id)}
              handle={handle}
              payload={id}
              delay={SECTION_OPEN_DELAY}
              closeDelay={SECTION_CLOSE_DELAY}
              render={
                <button
                  type="button"
                  aria-label={meta.name}
                  data-section={id}
                  onClick={() => onActiveChange(id)}
                  style={
                    aligned && span
                      ? {
                          left: `${span.leftPct + span.widthPct / 2}%`,
                          width: `max(${span.widthPct}%, 2.75rem)`,
                          top: i % 2 === 0 ? 0 : "1.875rem",
                        }
                      : undefined
                  }
                  className={cn(
                    "h-7 cursor-help whitespace-nowrap rounded-sm border-t-2 border-muted-foreground/40 px-1 text-xs text-muted-foreground",
                    "hover:bg-muted hover:text-foreground",
                    "outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
                    "data-popup-open:border-primary data-popup-open:bg-primary/10 data-popup-open:text-foreground",
                    aligned && "absolute -translate-x-1/2",
                  )}
                />
              }
            >
              <span className="@[40rem]:hidden">{meta.shortLabel}</span>
              <span className="hidden @[40rem]:inline">{meta.name}</span>
            </HoverCardTrigger>
          );
        })}
      </div>
      <HoverCard
        handle={handle}
        open={active !== null}
        triggerId={active === null ? null : triggerId(active)}
        onOpenChange={(open, details) => {
          const id =
            details.trigger instanceof HTMLElement ? details.trigger.dataset["section"] : undefined;
          onActiveChange(open && isSectionId(id) ? id : open ? active : null);
        }}
      >
        {({ payload }) => (
          <HoverCardContent
            side="right"
            align="start"
            sideOffset={12}
            anchor={anchor}
            collisionPadding={12}
            className="max-h-[var(--available-height)] w-[min(26rem,calc(100vw-1.5rem))] overflow-y-auto overflow-x-hidden p-0 motion-reduce:animate-none"
          >
            {payload !== undefined && renderCard(payload)}
          </HoverCardContent>
        )}
      </HoverCard>
    </>
  );
}
