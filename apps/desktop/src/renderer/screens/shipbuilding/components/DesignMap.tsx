import { cn } from "../../../lib/utils.js";
import { SECTION_ORDER, type DesignSectionId } from "../design-sections.js";

export interface DesignMapProps {
  readonly active: DesignSectionId;
  readonly onSelect: (section: DesignSectionId) => void;
}

/** The left rail: the ship's systems as a map, not a wizard. Experienced players jump straight to any section. */
export function DesignMap({ active, onSelect }: DesignMapProps) {
  return (
    <nav aria-label="Design map" className="flex h-full flex-col gap-1 border-r p-2">
      <ul className="flex flex-col gap-1">
        {SECTION_ORDER.map(({ id, label, icon: Icon }) => (
          <li key={id}>
            <button
              type="button"
              aria-current={active === id ? "location" : undefined}
              data-active={active === id}
              onClick={() => onSelect(id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm outline-none",
                "hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring",
                "data-[active=true]:bg-accent data-[active=true]:font-medium",
              )}
            >
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
