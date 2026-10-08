import { CheckCircle2, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../../../components/ui/alert.js";

export interface ResearchNoticeProps {
  readonly submitted: boolean;
  readonly notice: string;
}

export function ResearchNotice({ submitted, notice }: ResearchNoticeProps) {
  return (
    <Alert variant={submitted ? "default" : "destructive"}>
      {submitted ? <CheckCircle2 className="h-4 w-4" /> : <Info className="h-4 w-4" />}
      {submitted ? (
        <AlertTitle>Priorities queued</AlertTitle>
      ) : (
        <AlertTitle>Not applied</AlertTitle>
      )}
      <AlertDescription className="whitespace-pre-wrap">{notice}</AlertDescription>
    </Alert>
  );
}
