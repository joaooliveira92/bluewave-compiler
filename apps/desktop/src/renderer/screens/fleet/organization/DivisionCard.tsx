import type { DivisionView, UnassignedShipView } from "@bluewave/campaign-engine";
import { Star } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../../components/ui/alert-dialog.js";
import { Badge } from "../../../components/ui/badge.js";
import { Button } from "../../../components/ui/button.js";
import { Card, CardContent } from "../../../components/ui/card.js";
import { Progress } from "../../../components/ui/progress.js";
import type { DivisionCommandBody } from "../../../../shared/division-contract.js";
import {
  canRemoveShip,
  costText,
  divisionTitle,
  formationLabel,
  roleLabel,
  shipsAvailableToAdd,
  type DivisionOrganizationState,
} from "./division-organization-state.js";

export interface DivisionCardProps {
  readonly division: DivisionView;
  readonly state: DivisionOrganizationState;
  readonly busy: boolean;
  readonly send: (command: DivisionCommandBody) => void;
}

function Meter({ label, value }: { readonly label: string; readonly value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums font-medium">{value}</span>
      </div>
      <Progress value={value} aria-label={label} />
    </div>
  );
}

const SELECT_CLASS = "h-8 min-w-0 rounded-md border bg-background px-2 text-sm disabled:opacity-50";

/** One permanent division: its stats, ships and the five engine operations. */
export function DivisionCard({ division, state, busy, send }: DivisionCardProps) {
  const addable = shipsAvailableToAdd(division, state.unassignedShips, state.maxShips);
  const [toAdd, setToAdd] = useState("");
  const selected = addable.some((ship) => ship.shipId === toAdd)
    ? toAdd
    : (addable[0]?.shipId ?? "");
  const title = divisionTitle(division);

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="truncate font-medium">{title}</h4>
            <p className="text-xs text-muted-foreground">{division.areaName}</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary">{roleLabel(division.role)}</Badge>
            <Badge variant="outline">{formationLabel(division.formation)}</Badge>
            {division.commanderVacant && (
              <Badge
                variant="outline"
                title="No officers are modelled yet, so every division's command is vacant."
              >
                Commander vacant
              </Badge>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Meter label="Experience" value={division.experience} />
          <Meter label="Cohesion" value={division.cohesion} />
        </div>

        <ul className="space-y-1.5" aria-label={`Ships in ${title}`}>
          {division.ships.map((ship) => {
            const isFlagship = ship.shipId === division.flagshipShipId;
            return (
              <li
                key={ship.shipId}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-1.5 text-sm"
              >
                <span className="flex items-center gap-1.5">
                  {isFlagship && (
                    <Star
                      className="h-3.5 w-3.5 fill-current text-amber-500"
                      aria-label="Flagship"
                      role="img"
                    />
                  )}
                  {ship.name}
                </span>
                <span className="flex gap-1.5">
                  {!isFlagship && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      title={`Changing the flagship ${costText(state.penalties.changeFlagship)}`}
                      onClick={() =>
                        send({
                          type: "ChangeDivisionFlagship",
                          divisionId: division.divisionId,
                          newFlagshipShipId: ship.shipId,
                        })
                      }
                    >
                      Make flagship
                    </Button>
                  )}
                  {canRemoveShip(division) && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      title={`Removing a ship ${costText(state.penalties.removeShip)}`}
                      onClick={() =>
                        send({
                          type: "RemoveShipFromDivision",
                          divisionId: division.divisionId,
                          shipId: ship.shipId,
                        })
                      }
                    >
                      Remove
                    </Button>
                  )}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {division.ships.length >= state.maxShips ? (
              <span className="text-xs text-muted-foreground">
                Full ({state.maxShips} ships maximum)
              </span>
            ) : addable.length === 0 ? (
              <span className="text-xs text-muted-foreground">
                No unassigned ships in {division.areaName} to add.
              </span>
            ) : (
              <>
                <select
                  aria-label={`Ship to add to ${title}`}
                  className={SELECT_CLASS}
                  value={selected}
                  disabled={busy}
                  onChange={(event) => setToAdd(event.target.value)}
                >
                  {addable.map((ship: UnassignedShipView) => (
                    <option key={ship.shipId} value={ship.shipId}>
                      {ship.name}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  size="sm"
                  disabled={busy || selected === ""}
                  onClick={() =>
                    send({
                      type: "AddShipToDivision",
                      divisionId: division.divisionId,
                      shipId: selected,
                    })
                  }
                >
                  Add ship
                </Button>
                <span className="text-xs text-muted-foreground">
                  Adding a ship {costText(state.penalties.addShip)}.
                </span>
              </>
            )}
          </div>

          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="outline" size="sm" disabled={busy} />}>
              Dissolve division
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Dissolve {title}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Its ships return to the unassigned pool and the division&apos;s experience and
                  cohesion are lost. This takes effect when you advance the month.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep division</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    send({ type: "DissolveDivision", divisionId: division.divisionId })
                  }
                >
                  Dissolve
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
