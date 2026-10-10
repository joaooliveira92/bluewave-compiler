import { useId, type ReactNode } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select.js";
import { cn } from "../../../lib/utils.js";

const inputClass =
  "h-8 w-full rounded-md border bg-background px-2 text-sm tabular-nums focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring";

/**
 * Reads a typed number with either decimal mark ("16.5" or "16,5"); thousands separators are not accepted, so "1,500"
 * is refused rather than read as 1.5. Null when the text is not a number.
 */
export function parseTypedNumber(raw: string): number | null {
  const t = raw.trim();
  if (!/^[-+]?(\d+([.,]\d*)?|[.,]\d+)$/.test(t)) return null;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/**
 * Number input in display units that commits an integer in internal units on blur or Enter. Uncontrolled and keyed by the
 * committed value, so typing never creates an edit per keystroke and an undo resets the field.
 *
 * A text input, not `type="number"`: Chromium formats number inputs with the OS locale (a decimal-comma system shows
 * "16,0" next to "16.0 kn" everywhere else), so the value is always shown with a decimal point and either mark is
 * accepted when typing. ArrowUp/ArrowDown step by `step` within min/max, as a number input would.
 */
export function NumberField({
  label,
  value,
  scale = 1,
  decimals = 0,
  min,
  max,
  step,
  unit,
  onCommit,
  className,
  shortLabel,
}: {
  readonly label: string;
  /** Compact text shown above the input; the full `label` stays its accessible name (for repeated table rows). */
  readonly shortLabel?: string;
  readonly value: number;
  readonly scale?: number;
  readonly decimals?: number;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly unit?: string;
  readonly onCommit: (internal: number) => void;
  readonly className?: string;
}) {
  const id = useId();
  const shown = (value / scale).toFixed(decimals);
  const stepBy = step ?? (decimals > 0 ? Number((1 / 10 ** decimals).toFixed(decimals)) : 1);
  const clampShown = (n: number) => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));
  const commit = (raw: string) => {
    const parsed = parseTypedNumber(raw);
    if (parsed === null) return;
    const internal = Math.round(clampShown(parsed) * scale);
    if (internal !== value) onCommit(internal);
  };
  return (
    <div className={cn("space-y-1", className)}>
      <label htmlFor={id} className="block text-xs text-muted-foreground">
        {shortLabel ?? label}
        {unit ? ` (${unit})` : ""}
      </label>
      <input
        key={value}
        id={id}
        aria-label={shortLabel === undefined ? undefined : `${label}${unit ? ` (${unit})` : ""}`}
        className={inputClass}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        defaultValue={shown}
        onBlur={(e) => commit(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit(e.currentTarget.value);
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            const current = parseTypedNumber(e.currentTarget.value) ?? value / scale;
            const next = clampShown(current + (e.key === "ArrowUp" ? stepBy : -stepBy));
            e.currentTarget.value = next.toFixed(decimals);
            e.preventDefault();
          }
        }}
      />
    </div>
  );
}

export function SelectField({
  label,
  shortLabel,
  value,
  options,
  onChange,
  className,
  inline = false,
}: {
  readonly label: string;
  /** Compact text shown above the select; the full `label` stays its accessible name (for repeated rows). */
  readonly shortLabel?: string;
  /** Label beside the select instead of above it, at button height: for toolbars. */
  readonly inline?: boolean;
  readonly value: string;
  readonly options: readonly {
    readonly value: string;
    readonly label: string;
    /** Optional leading visual (a lucide icon or a flag) shown before the label in the list and on the trigger. */
    readonly icon?: ReactNode;
    /** Optional secondary line under the label in the list (ReUI "select with description text per option"). */
    readonly description?: ReactNode;
    readonly disabled?: boolean;
  }[];
  readonly onChange: (value: string) => void;
  readonly className?: string;
}) {
  const id = useId();
  return (
    <div className={cn(inline ? "flex items-center gap-2" : "space-y-1", className)}>
      <label
        htmlFor={id}
        className={cn("text-xs text-muted-foreground", inline ? "shrink-0" : "block")}
      >
        {shortLabel ?? label}
      </label>
      <Select value={value} onValueChange={onChange} className="w-full">
        <SelectTrigger
          id={id}
          aria-label={shortLabel === undefined ? undefined : label}
          className={inline ? "h-9 py-0" : undefined}
        >
          <SelectValue placeholder="Select" className="min-w-0 flex-1 truncate text-left" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem
              key={o.value}
              value={o.value}
              icon={o.icon}
              description={o.description}
              disabled={o.disabled}
            >
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
