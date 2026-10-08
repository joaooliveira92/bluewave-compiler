import { AlertCircle, FlaskConical } from "lucide-react";
import { PageHeader } from "../../../components/shared/PageHeader.js";
import { Alert, AlertDescription, AlertTitle } from "../../../components/ui/alert.js";
import { Button } from "../../../components/ui/button.js";
import { Skeleton } from "../../../components/ui/skeleton.js";

export function ResearchLoadErrorState({
  message,
  onRetry,
}: {
  readonly message: string;
  readonly onRetry: () => void;
}) {
  return (
    <div data-guided-target="research" className="space-y-6">
      <PageHeader
        icon={FlaskConical}
        title="Research & Technology"
        description="Direct the monthly research budget across fields."
      />
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
    </div>
  );
}

export function ResearchLoadingState() {
  return (
    <div data-guided-target="research" className="space-y-6">
      <PageHeader
        icon={FlaskConical}
        title="Research & Technology"
        description="The monthly research budget across fields."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[0, 1, 2].map((idx) => (
          <Skeleton key={idx} className="h-28" />
        ))}
      </div>
    </div>
  );
}
