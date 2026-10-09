import { FlaskConical } from "lucide-react";
import type { ReactNode } from "react";
import { PageHeader } from "../../../components/shared/PageHeader.js";

export interface ResearchPageShellProps {
  readonly description?: ReactNode;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
}

const DEFAULT_DESCRIPTION = "Direct the monthly research budget across fields.";

/**
 * The Research & Technology page frame: the guided-target container plus the
 * page header (icon + title). The loading, error and loaded states all render
 * inside it, so the frame — and its default subtitle — is defined exactly once.
 */
export function ResearchPageShell({
  description = DEFAULT_DESCRIPTION,
  actions,
  children,
}: ResearchPageShellProps) {
  return (
    <div data-guided-target="research" className="space-y-6">
      <PageHeader
        icon={FlaskConical}
        title="Research & Technology"
        description={description}
        actions={actions}
      />
      {children}
    </div>
  );
}
