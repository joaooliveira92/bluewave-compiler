import type { CommitMonthResponse } from "@bluewave/campaign-engine";
import { CheckCircle2 } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../../components/ui/accordion.js";
import { Badge } from "../../../components/ui/badge.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card.js";
import {
  Empty,
  EmptyDescription,
  EmptyIcon,
  EmptyTitle,
} from "../../../components/ui/empty.js";
import { ScrollArea } from "../../../components/ui/scroll-area.js";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table.js";
import { cn } from "../../../lib/utils.js";
import { TreasuryGrid } from "./TreasuryGrid.js";

interface TurnReportTabProps {
  readonly commitResult: CommitMonthResponse | null;
}

export function TurnReportTab({ commitResult }: TurnReportTabProps) {
  if (commitResult === null) {
    return (
      <Empty>
        <EmptyIcon>
          <CheckCircle2 />
        </EmptyIcon>
        <EmptyTitle>No turn advanced yet</EmptyTitle>
        <EmptyDescription>
          Advance the turn to generate a report of the month's outcomes.
        </EmptyDescription>
      </Empty>
    );
  }

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-1.5 text-sm font-semibold text-primary">
          <CheckCircle2 className="h-4 w-4" />
          Turn Advancement Report — Month {commitResult.report.month.month}/
          {commitResult.report.month.year}
        </CardTitle>
        <CardDescription className="text-xs">
          Review the economic allocations and administrative outcomes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <TreasuryGrid report={commitResult.report} />

        <Accordion multiple defaultValue={["events", "ledger"]}>
          <AccordionItem value="events">
            <AccordionTrigger className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Domain Events
            </AccordionTrigger>
            <AccordionContent>
              <ScrollArea className="h-[140px] rounded-md border bg-muted/20">
                <div className="space-y-1 p-2">
                  {commitResult.domainEvents.map((evt, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between border-b p-1 font-mono text-[11px] last:border-0"
                    >
                      <span className="text-foreground">{evt.kind}</span>
                      <Badge
                        variant="secondary"
                        className="scale-90 text-[11px] uppercase"
                      >
                        {evt.phase}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="ledger">
            <AccordionTrigger className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Financial Ledger
            </AccordionTrigger>
            <AccordionContent>
              <ScrollArea className="h-[160px] rounded-md border bg-muted/20">
                <Table className="font-mono text-[11px]">
                  <TableHeader>
                    <TableRow className="h-8">
                      <TableHead className="p-1">Phase</TableHead>
                      <TableHead className="p-1">Description</TableHead>
                      <TableHead className="p-1 text-right">Amount</TableHead>
                      <TableHead className="p-1 text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commitResult.financialLedger.map((entry, idx) => (
                      <TableRow key={idx} className="h-8">
                        <TableCell className="p-1 text-muted-foreground">
                          {entry.phase}
                        </TableCell>
                        <TableCell className="p-1">
                          {entry.description}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "p-1 text-right font-semibold",
                            entry.amount < 0
                              ? "text-destructive"
                              : "text-success",
                          )}
                        >
                          {entry.amount}
                        </TableCell>
                        <TableCell className="p-1 text-right font-semibold">
                          {entry.runningBalance}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
