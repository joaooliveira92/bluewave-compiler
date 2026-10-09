import { useMemo, useState } from "react";
import { Button } from "../../components/ui/button.js";
import { CardShell } from "../../components/shared/CardShell.js";
import { CardTitle } from "../../components/ui/card.js";
import type { Screen } from "../../shell/campaign-screen-registry.js";
import { NationDeferredIntel } from "./components/NationDeferredIntel.js";
import { NationDetail } from "./components/NationDetail.js";
import { NationSwatch } from "./components/NationSwatch.js";
import { buildNationRail } from "./nation-rail-state.js";
import type { NationRailLoad } from "./useNationRail.js";

export interface NationRailProps {
  readonly state: NationRailLoad;
  readonly playerName: string;
  readonly onNavigate: (screen: Screen) => void;
  /** Render only the body (a host panel supplies the chrome and the "Nations" title). */
  readonly embedded?: boolean;
}

/**
 * Right-rail nation list (CC-5): the player first, then the other powers with
 * their relation to the player in words and the war score while at war.
 *
 * Selection: there is no nation drawer, and the Diplomacy & War screen takes no
 * nation parameter (navigation is by screen id only), so selecting a nation
 * only selects it and shows its relation detail inline under the list.
 */
export function NationRail({ state, playerName, onNavigate, embedded = false }: NationRailProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const rows = useMemo(
    () => (state.status === "ready" ? buildNationRail(state.projection, playerName) : []),
    [state, playerName],
  );
  const selected = rows.find((r) => r.nationId === selectedId) ?? null;

  return (
    <CardShell
      testId="nation-rail"
      embedded={embedded}
      header={<CardTitle className="text-sm font-medium">Nations</CardTitle>}
      contentClassName="space-y-3 text-xs"
    >
      {state.status === "loading" && <p className="text-muted-foreground">Reading relations…</p>}
      {state.status === "unavailable" && (
        <p role="alert" className="text-muted-foreground">
          Relations are unavailable right now.
        </p>
      )}
      {state.status === "ready" && (
        <ul className="space-y-1" aria-label="Major powers">
          {rows.map((row) => (
            <li key={row.nationId}>
              <button
                type="button"
                aria-pressed={row.nationId === selectedId}
                onClick={() => setSelectedId(row.nationId === selectedId ? null : row.nationId)}
                className="flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left hover:bg-accent aria-pressed:bg-accent"
              >
                <NationSwatch row={row} />
                <span className="min-w-0 flex-1 truncate font-medium">{row.name}</span>
                <span className="text-muted-foreground">{row.relationLabel}</span>
                {row.warScore !== null && (
                  <span
                    className="tabular-nums"
                    aria-label={`War score ${row.warScore.yours} to ${row.warScore.enemy}`}
                  >
                    {row.warScore.yours}:{row.warScore.enemy}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected !== null && <NationDetail selected={selected} />}

      <NationDeferredIntel />

      <Button type="button" variant="outline" size="sm" onClick={() => onNavigate("diplomacy")}>
        All relations
      </Button>
    </CardShell>
  );
}
