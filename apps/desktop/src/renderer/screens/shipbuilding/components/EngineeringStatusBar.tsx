import { cn } from "../../../lib/utils.js";

/** One value on the strip: neutral when normal, amber near a constraint, red when invalid. */
export interface StatusValue {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly tone: "neutral" | "warn" | "bad";
}

const TONE = {
  neutral: "text-foreground",
  warn: "text-amber-600 dark:text-amber-400",
  bad: "text-destructive",
} as const;

/** The persistent bottom strip: the engineering outcomes that must never scroll out of sight. */
export function EngineeringStatusBar({ values }: { readonly values: readonly StatusValue[] }) {
  return (
    <section
      aria-label="Engineering status"
      className="flex min-h-14 flex-wrap items-center gap-x-6 gap-y-1 border-t bg-muted/40 px-4 py-2 text-sm"
    >
      {values.map((v) => (
        <span
          key={v.id}
          className="flex items-baseline gap-1.5"
          data-status={v.id}
          data-tone={v.tone}
        >
          <span className="text-xs text-muted-foreground">{v.label}</span>
          <span className={cn("font-medium tabular-nums", TONE[v.tone])}>{v.value}</span>
        </span>
      ))}
    </section>
  );
}
