import { memo } from "react";
import type { MovementCommand } from "@bluewave/campaign-engine";
import { Badge } from "../../../components/ui/badge.js";
import { DEBUG_MODE } from "../../../shell/debug-flag.js";
import { Empty, EmptyDescription, EmptyIcon, EmptyTitle } from "../../../components/ui/empty.js";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table.js";

export interface MovementCommandsTableProps {
  readonly commands: readonly MovementCommand[];
  readonly areaName: (areaId: string) => string;
  /** Display name for a division id (the fleet it belongs to). */
  readonly divisionName: (divisionId: string) => string;
}

export const MovementCommandsTable = memo(function MovementCommandsTable({
  commands,
  areaName,
  divisionName,
}: MovementCommandsTableProps) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-sm font-medium">Movement commands</h3>
        <Badge variant="secondary" className="text-xs">
          {commands.length}
        </Badge>
      </div>
      {commands.length === 0 ? (
        <Empty>
          <EmptyIcon />
          <EmptyTitle>No movement commands</EmptyTitle>
          <EmptyDescription>No movement command has been submitted this month.</EmptyDescription>
        </Empty>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {DEBUG_MODE && <TableHead>Command</TableHead>}
                <TableHead>Division</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Status</TableHead>
                {DEBUG_MODE && <TableHead className="text-right">Revision</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {commands.map((command) => (
                <TableRow key={command.commandId}>
                  {DEBUG_MODE && (
                    <TableCell className="font-mono text-xs">{command.commandId}</TableCell>
                  )}
                  <TableCell className="font-medium">{divisionName(command.divisionId)}</TableCell>
                  <TableCell>{areaName(command.fromAreaId)}</TableCell>
                  <TableCell>{areaName(command.toAreaId)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        command.status === "submitted"
                          ? "default"
                          : command.status === "accepted"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {command.status}
                    </Badge>
                  </TableCell>
                  {DEBUG_MODE && (
                    <TableCell className="text-right font-mono text-xs">
                      {command.submittedAtRevision}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
});
