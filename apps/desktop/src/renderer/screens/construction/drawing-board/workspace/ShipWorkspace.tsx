import { type CSSProperties, type ReactNode, useId, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "../../../../components/ui/button.js";
import { SplitDivider } from "./SplitDivider.js";
import { useSplitWidth } from "./useSplitWidth.js";

/**
 * The Drawing Board's two-pane layout: the ship drawing on the left, the active tab on the right, each scrolling
 * on its own so the ship stays in view while a long tab is read. Below `lg` the panes stack and the ship view
 * can be folded away; it is hidden with CSS, never unmounted, so its tools and toggles keep their state.
 *
 * Layout only: it holds no design state, and `ship` and `children` are rendered exactly once.
 */
export function ShipWorkspace({
  ship,
  children,
}: {
  /** The persistent ship visualisation. */
  readonly ship: ReactNode;
  /** The tab strip and the active tab's content. */
  readonly children: ReactNode;
}) {
  const shipId = useId();
  const [split, setSplit] = useSplitWidth();
  const [shipOpen, setShipOpen] = useState(true);
  return (
    <div
      data-testid="ship-workspace"
      className="min-h-0 flex-1 space-y-4 overflow-y-auto lg:grid lg:grid-cols-[minmax(0,var(--ship-pane))_0.75rem_minmax(0,1fr)] lg:gap-1 lg:space-y-0 lg:overflow-hidden"
      style={{ "--ship-pane": `${split}%` } as CSSProperties}
    >
      <section aria-label="Ship view" className="space-y-2 lg:min-h-0 lg:overflow-y-auto lg:pr-1">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-between lg:hidden"
          aria-expanded={shipOpen}
          aria-controls={shipId}
          onClick={() => setShipOpen((open) => !open)}
        >
          {shipOpen ? "Hide ship view" : "Show ship view"}
          {shipOpen ? (
            <ChevronUp aria-hidden="true" className="size-4" />
          ) : (
            <ChevronDown aria-hidden="true" className="size-4" />
          )}
        </Button>
        <div
          id={shipId}
          data-testid="ship-view"
          className={shipOpen ? undefined : "hidden lg:block"}
        >
          {ship}
        </div>
      </section>
      <SplitDivider
        value={split}
        onChange={setSplit}
        controls={shipId}
        className="hidden lg:flex"
      />
      <div data-testid="tab-pane" className="@container lg:min-h-0 lg:overflow-y-auto lg:pl-1">
        {children}
      </div>
    </div>
  );
}
