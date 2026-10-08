import { advanceMonth } from "@bluewave/campaign";
import { Button } from "./ui/button.js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog.js";
import { Badge } from "./ui/badge.js";
import { usePreTurnReviewData } from "./usePreTurnReviewData.js";

export interface PreTurnReviewDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly sessionId: string;
  readonly campaign: {
    readonly month: { readonly year: number; readonly month: number };
    readonly treasury: number;
    readonly projectedSurplusDeficit: number;
    readonly revision: number;
  };
  readonly saving: boolean;
  readonly saveMessage: string | null;
  readonly committing: boolean;
  readonly onAdvance: () => Promise<void>;
}

function formatMonth(month: { year: number; month: number }): string {
  const names = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${names[month.month - 1] ?? month.month} ${month.year}`;
}

export function PreTurnReviewDialog({
  open,
  onOpenChange,
  sessionId,
  campaign,
  saving,
  saveMessage,
  committing,
  onAdvance,
}: PreTurnReviewDialogProps) {
  const { priorities, constructionCount, expectedCompletions, researchSpend, loading } =
    usePreTurnReviewData(sessionId, open);

  const nextMonth = advanceMonth(campaign.month.year, campaign.month.month, 1);

  const advanceLabel = `Advance to ${formatMonth(nextMonth)}`;
  const canAdvance = !committing && !saving;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Pre-turn review</DialogTitle>
          <DialogDescription>
            Review the current strategic state before advancing the campaign month. All figures are
            from real campaign state.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-muted-foreground">Current date</p>
              <p className="font-medium">{formatMonth(campaign.month)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Next date</p>
              <p className="font-medium">{formatMonth(nextMonth)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Available funds</p>
              <p className="font-medium">£{campaign.treasury.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Projected surplus / deficit</p>
              <p className="font-medium">£{campaign.projectedSurplusDeficit.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active construction projects</p>
              <p className="font-medium">
                {constructionCount !== null
                  ? constructionCount.toLocaleString()
                  : loading
                    ? "…"
                    : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Expected completions</p>
              <p className="font-medium">
                {expectedCompletions !== null
                  ? expectedCompletions.toLocaleString()
                  : loading
                    ? "…"
                    : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Current research spending</p>
              <p className="font-medium">
                {researchSpend !== null
                  ? `£${researchSpend.toLocaleString()}`
                  : loading
                    ? "…"
                    : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Save status</p>
              <p className="font-medium">{saving ? "Saving…" : (saveMessage ?? "Saved")}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground">Unresolved warnings</p>
            {priorities.length === 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                The Admiralty has identified no urgent concerns.
              </p>
            ) : (
              <div className="mt-1 space-y-1.5">
                {priorities.slice(0, 5).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded border px-2 py-1.5"
                  >
                    <div>
                      <p className="text-xs font-medium">{p.title}</p>
                      <p className="text-xs text-muted-foreground">{p.summary}</p>
                    </div>
                    <Badge
                      variant={
                        p.severity === "critical" || p.severity === "warning"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {p.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {committing && (
            <p className="text-xs text-muted-foreground">
              Advancing… the commit is synchronous and cannot be cancelled mid-resolution.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={committing}>
            Cancel
          </Button>
          <Button onClick={() => void onAdvance()} disabled={!canAdvance}>
            {committing ? "Advancing…" : advanceLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
