import { Badge } from "../../../components/ui/badge.js";
import { DEBUG_MODE } from "../../../shell/debug-flag.js";
import type { BattleHistoryState } from "../hooks/useBattleHistory.js";
import { OUTCOME_LABELS, shipsLabel, summarizeBattleHistory } from "../battle-history-state.js";

const OUTCOME_VARIANT = {
  won: "default",
  lost: "destructive",
  undecided: "secondary",
  "not-involved": "outline",
} as const;

/** Resolved battles and the ships lost in them, from the engine's recorded results. */
export function BattleHistorySection({ state }: { readonly state: BattleHistoryState }) {
  if (state.status === "loading") {
    return <p className="text-sm text-muted-foreground">Loading battle history…</p>;
  }
  if (state.status === "error") {
    return (
      <p role="alert" className="text-sm text-destructive">
        Battle history unavailable: {state.message}
      </p>
    );
  }
  const battles = state.history.battles;
  if (battles.length === 0) {
    return <p className="text-sm text-muted-foreground">No battles fought yet</p>;
  }
  const summary = summarizeBattleHistory(battles);
  return (
    <div className="space-y-2.5">
      {summary.played > 0 && (
        <p className="text-xs text-muted-foreground" data-testid="battle-summary">
          {summary.played} {summary.played === 1 ? "battle" : "battles"} fought · {summary.won} won
          · {summary.lost} lost · {summary.undecided} undecided · you lost{" "}
          {shipsLabel(summary.playerLosses)}, the enemy lost {shipsLabel(summary.enemyLosses)}
        </p>
      )}
      {battles.map((battle) => (
        <div
          key={battle.battleId}
          className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={OUTCOME_VARIANT[battle.outcomeForPlayer]}>
              {OUTCOME_LABELS[battle.outcomeForPlayer]}
            </Badge>
            <span className="text-sm">
              {battle.attackerName} vs {battle.defenderName}
            </span>
            <span className="text-xs text-muted-foreground">in {battle.areaName}</span>
            {DEBUG_MODE && (
              <span className="font-mono text-xs text-muted-foreground">{battle.battleId}</span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {battle.involvesPlayer
              ? `you lost ${shipsLabel(battle.playerLossCount)} · enemy lost ${shipsLabel(battle.enemyLossCount)}`
              : `${shipsLabel(battle.enemyLossCount)} lost`}
          </span>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">
        Ship names are not recorded once a ship is lost, so losses are shown as counts.
      </p>
    </div>
  );
}
