import { useId } from "react";
import { cn } from "../../../lib/utils.js";

const inputClass =
  "h-8 w-full rounded-md border bg-background px-2 text-sm tabular-nums focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring";

/**
 * Number input in display units that commits an integer in internal units on blur or Enter. Uncontrolled and keyed by the
 * committed value, so typing never creates an edit per keystroke and an undo resets the field.
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
  const commit = (raw: string) => {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;
    const internal = Math.round(parsed * scale);
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
        type="number"
        inputMode="decimal"
        defaultValue={shown}
        min={min}
        max={max}
        step={step ?? (decimals > 0 ? Number((1 / 10 ** decimals).toFixed(decimals)) : 1)}
        onBlur={(e) => commit(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit(e.currentTarget.value);
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
}: {
  readonly label: string;
  /** Compact text shown above the select; the full `label` stays its accessible name (for repeated rows). */
  readonly shortLabel?: string;
  readonly value: string;
  readonly options: readonly {
    readonly value: string;
    readonly label: string;
    readonly disabled?: boolean;
  }[];
  readonly onChange: (value: string) => void;
  readonly className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("space-y-1", className)}>
      <label htmlFor={id} className="block text-xs text-muted-foreground">
        {shortLabel ?? label}
      </label>
      <select
        id={id}
        aria-label={shortLabel === undefined ? undefined : label}
        className={inputClass}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
