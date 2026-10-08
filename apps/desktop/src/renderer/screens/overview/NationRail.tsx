import { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/glass-card.js";
import { Button } from "../../components/ui/button.js";
import { CardContent, CardHeader, CardTitle } from "../../components/ui/card.js";
import { campaignNationHue } from "../../components/world-map/campaign-map-join.js";
import type { Screen } from "../../shell/campaign-screen-registry.js";
import {
  DEFERRED_NATION_RAIL_ITEMS,
  buildNationRail,
  type NationRailRow,
} from "./nation-rail-state.js";
import type { NationRailLoad } from "./useNationRail.js";

export interface NationRailProps {
  readonly state: NationRailLoad;
  readonly playerName: string;
  readonly onNavigate: (screen: Screen) => void;
}

function Swatch({ row }: { readonly row: NationRailRow }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border text-[12px] font-semibold"
      style={{ backgroundColor: `hsl(${campaignNationHue(row.nationId)} 45% 35%)`, color: "#fff" }}
    >
      {row.name.slice(0, 1)}
    </span>
  );
}

/**
 * Right-rail nation list (CC-5): the player first, then the other powers with
 * their relation to the player in words and the war score while at war.
 *
 * Selection: there is no nation drawer, and the Diplomacy & War screen takes no
 * nation parameter (navigation is by screen id only), so selecting a nation
 * only selects it and shows its relation detail inline under the list.
 */
export function NationRail({ state, playerName, onNavigate }: NationRailProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const rows = useMemo(
    () => (state.status === "ready" ? buildNationRail(state.projection, playerName) : []),
    [state, playerName],
  );
  const selected = rows.find((r) => r.nationId === selectedId) ?? null;

  return (
    <GlassCard glassVariant="liquid-refract" data-testid="nation-rail">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Nations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
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
                  <Swatch row={row} />
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

        {selected !== null && (
          <div className="rounded-md border px-3 py-2" data-testid="nation-rail-detail">
            <p className="font-medium">{selected.name}</p>
            {selected.isPlayer ? (
              <p className="text-muted-foreground">Your nation.</p>
            ) : (
              <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
                <dt className="text-muted-foreground">Relation</dt>
                <dd>{selected.relationLabel}</dd>
                {selected.tension !== null && (
                  <>
                    <dt className="text-muted-foreground">Tension</dt>
                    <dd>{selected.tension}/10</dd>
                  </>
                )}
                {selected.since !== null && (
                  <>
                    <dt className="text-muted-foreground">Since</dt>
                    <dd>{selected.since}</dd>
                  </>
                )}
                {selected.warScore !== null && (
                  <>
                    <dt className="text-muted-foreground">War score</dt>
                    <dd>
                      you {selected.warScore.yours} : {selected.warScore.enemy} them
                    </dd>
                  </>
                )}
              </dl>
            )}
          </div>
        )}

        <details
          data-testid="nation-rail-deferred"
          className="rounded-md border border-dashed px-3 py-2"
        >
          <summary className="cursor-pointer font-medium text-muted-foreground">
            Intel level / reports / Almanac: Not yet modelled
          </summary>
          <ul className="mt-1.5 space-y-1">
            {DEFERRED_NATION_RAIL_ITEMS.map((item) => (
              <li key={item.id}>
                <span className="font-medium">{item.name}</span>
                <span className="text-muted-foreground"> — {item.reason}</span>
              </li>
            ))}
          </ul>
        </details>

        <Button type="button" variant="outline" size="sm" onClick={() => onNavigate("diplomacy")}>
          All relations
        </Button>
      </CardContent>
    </GlassCard>
  );
}
