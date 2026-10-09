import { memo } from "react";
import { Badge } from "../../../components/ui/badge.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card.js";
import { Empty, EmptyDescription, EmptyTitle } from "../../../components/ui/empty.js";
import { Progress } from "../../../components/ui/progress.js";
import type { PackageState, ProjectRow } from "../project-progress.js";

const STATE_TEXT: Record<PackageState, string> = {
  done: "Done",
  active: "In progress",
  ready: "Ready to start",
  waiting: "Waiting",
};

const STATE_CLASS: Record<PackageState, string> = {
  done: "text-success",
  active: "text-foreground",
  ready: "text-muted-foreground",
  waiting: "text-muted-foreground",
};

export interface ProjectsCardProps {
  readonly rows: readonly ProjectRow[];
}

/** Ships under construction: overall progress, the yard, and each work package's state. */
export const ProjectsCard = memo(function ProjectsCard({ rows }: ProjectsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Under construction</CardTitle>
        <CardDescription>
          {rows.some((r) => r.packages.length > 0)
            ? "Ships ordered from your own designs are built in work packages: a package starts when what it depends on is done, and the yard can only do so much work each month."
            : "How far each ship is along."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <Empty>
            <EmptyTitle>No ships under construction</EmptyTitle>
            <EmptyDescription>Order a design from the Design Catalog.</EmptyDescription>
          </Empty>
        ) : (
          <ul className="space-y-4" aria-label="Ships under construction">
            {rows.map((row) => (
              <li key={row.projectId} className="space-y-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">{row.className}</span>
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    {row.yard !== null && <Badge variant="outline">{row.yard}</Badge>}
                    {row.holdUntilMonth !== null && (
                      <Badge variant="secondary">on hold until {row.holdUntilMonth}</Badge>
                    )}
                    <span className="tabular-nums">{row.percent}%</span>
                  </span>
                </div>
                <Progress value={row.percent} aria-label={`${row.className} progress`} />
                {row.packages.length > 0 && (
                  <ul
                    className="grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2"
                    aria-label={`${row.className} work packages`}
                  >
                    {row.packages.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-2">
                        <span>{p.label}</span>
                        <span className={STATE_CLASS[p.state]}>
                          {STATE_TEXT[p.state]}
                          {p.state === "active" ? ` · ${p.percent}%` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
});
