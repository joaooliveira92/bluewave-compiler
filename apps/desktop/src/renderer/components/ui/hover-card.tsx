import { PreviewCard as HoverCardPrimitive } from "@base-ui/react/preview-card";
import * as React from "react";

import { cn } from "../../lib/utils.js";
import { FLOATING_LAYER } from "./menu-styles.js";

const HoverCard = HoverCardPrimitive.Root;
const HoverCardTrigger = HoverCardPrimitive.Trigger;
/** One card shared by several detached triggers: moving between them swaps the content instead of re-opening. */
const createHoverCardHandle = HoverCardPrimitive.createHandle;

/** A shared card handle: pass the same one to a `HoverCard` and its detached `HoverCardTrigger`s. */
type HoverCardHandle<Payload> = HoverCardPrimitive.Handle<Payload>;

interface HoverCardContentProps extends React.ComponentPropsWithoutRef<
  typeof HoverCardPrimitive.Popup
> {
  align?: React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Positioner>["align"];
  side?: React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Positioner>["side"];
  sideOffset?: number;
  /** Space kept between the card and the viewport edges when it flips or shifts to fit. */
  collisionPadding?: React.ComponentPropsWithoutRef<
    typeof HoverCardPrimitive.Positioner
  >["collisionPadding"];
  /** Element to position against instead of the trigger (e.g. the drawing a set of triggers describes). */
  anchor?: React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Positioner>["anchor"];
  ref?: React.Ref<React.ComponentRef<typeof HoverCardPrimitive.Popup>> | undefined;
}

const HoverCardContent = ({
  className,
  align = "center",
  side,
  sideOffset = 4,
  collisionPadding,
  anchor,
  ref,
  ...props
}: HoverCardContentProps) => (
  <HoverCardPrimitive.Portal>
    <HoverCardPrimitive.Positioner
      className={FLOATING_LAYER}
      align={align}
      side={side}
      sideOffset={sideOffset}
      collisionPadding={collisionPadding}
      anchor={anchor}
    >
      <HoverCardPrimitive.Popup
        ref={ref}
        className={cn(
          "z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none",
          "animate-in fade-in-0 zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className,
        )}
        {...props}
      />
    </HoverCardPrimitive.Positioner>
  </HoverCardPrimitive.Portal>
);
HoverCardContent.displayName = "HoverCardContent";

export { createHoverCardHandle, HoverCard, HoverCardContent, HoverCardTrigger };
export type { HoverCardHandle };
