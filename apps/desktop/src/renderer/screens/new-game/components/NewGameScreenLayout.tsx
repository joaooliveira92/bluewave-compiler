import { type ReactNode } from "react";
import { cn } from "@/lib/utils.js";

export type NewGameScreenSize = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<NewGameScreenSize, string> = {
  sm: "max-w-2xl",
  md: "max-w-3xl",
  lg: "max-w-4xl",
};

export interface NewGameScreenLayoutProps {
  /** Content width; defaults to the widest form column (`lg`). */
  readonly size?: NewGameScreenSize;
  /** Center a short message (loading/failure states) both axes. */
  readonly centered?: boolean;
  readonly className?: string;
  readonly children: ReactNode;
}

/**
 * The shared chrome for every new-campaign step: the padded, scrollable page
 * column the shell's content area provides, with the heading block and its
 * sections spaced consistently. Steps pass their own `ScreenHeader` + sections.
 */
export function NewGameScreenLayout({
  size = "lg",
  centered = false,
  className,
  children,
}: NewGameScreenLayoutProps) {
  return (
    <div className={cn("p-8", centered && "flex h-full flex-col", className)}>
      <div
        className={cn(
          "mx-auto flex w-full flex-col gap-6",
          SIZE_CLASSES[size],
          centered && "flex-1 items-center justify-center text-center",
        )}
      >
        {children}
      </div>
    </div>
  );
}
