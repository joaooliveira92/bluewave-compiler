import type { ReactNode } from "react";

export interface InspectorProps {
  /** The active section's name, e.g. "Armament". */
  readonly title: string;
  /** Where the player is, e.g. "Armament / Main battery / A". */
  readonly breadcrumb: readonly string[];
  readonly children: ReactNode;
}

/** The right inspector: the active section's editors, scrolling inside their own pane. */
export function Inspector({ title, breadcrumb, children }: InspectorProps) {
  return (
    <aside aria-label={`Inspector: ${title}`} className="flex h-full min-h-0 flex-col border-l">
      <nav aria-label="Breadcrumb" className="border-b px-3 py-2 text-xs text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1">
          {breadcrumb.map((part, i) => (
            <li key={`${i}-${part}`} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden="true">/</span>}
              <span
                className={i === breadcrumb.length - 1 ? "font-medium text-foreground" : undefined}
              >
                {part}
              </span>
            </li>
          ))}
        </ol>
      </nav>
      <div className="themed-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
        {children}
      </div>
    </aside>
  );
}
