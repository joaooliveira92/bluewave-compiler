import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../../../components/ui/alert.js";
import { Button } from "../../../components/ui/button.js";
import { Skeleton } from "../../../components/ui/skeleton.js";
import { ResearchPageShell } from "./ResearchPageShell.js";

export interface ResearchLoadErrorStateProps {
  readonly message: string;
  readonly onRetry: () => void;
}

export function ResearchLoadErrorState({ message, onRetry }: ResearchLoadErrorStateProps) {
  return (
    <ResearchPageShell description="Direct the monthly research budget across fields.">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Research screen failed to load</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <span className="whitespace-pre-wrap">{message}</span>
          <Button variant="outline" size="sm" className="w-fit" onClick={onRetry}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    </ResearchPageShell>
  );
}

export function ResearchLoadingState() {
  return (
    <ResearchPageShell description="The monthly research budget across fields.">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[0, 1, 2].map((idx) => (
          <Skeleton key={idx} className="h-28" />
        ))}
      </div>
    </ResearchPageShell>
  );
}
