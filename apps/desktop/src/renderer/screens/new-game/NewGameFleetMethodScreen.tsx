import { Anchor } from "lucide-react";
import { useCallback, useId, useMemo, useRef, useState } from "react";
import { Button } from "../../components/ui/button.js";
import { getFleetMethodArtwork } from "../../content/fleetMethodArtworkManifest.js";
import { cn } from "../../lib/utils.js";
import type { SetPrimaryAction } from "../../shell/primary-action.js";
import { usePrimaryAction } from "../../shell/usePrimaryAction.js";
import {
  BounceCards,
  NEW_GAME_BOUNCE_CARDS_PROPS,
  type BounceCardImage,
} from "./components/bounce-cards/index.js";
import { NewGameScreenLayout } from "./components/NewGameScreenLayout.js";
import { ScreenHeader } from "./components/ScreenHeader.js";
import { FLEET_METHOD_CARDS } from "./fleet-method-content.js";
import type { FleetMethodDraft } from "./new-game-fleet-method-screen-state.js";

export interface NewGameFleetMethodScreenProps {
  readonly initialFleetMethod: FleetMethodDraft;
  readonly status: "ready" | "launching";
  readonly error: string | null;
  readonly onBack: () => void;
  readonly onNext: (fleetMethod: FleetMethodDraft) => void;
  readonly onPrimaryActionChange: SetPrimaryAction;
}

export function NewGameFleetMethodScreen({
  initialFleetMethod,
  status,
  error,
  onBack,
  onNext,
  onPrimaryActionChange,
}: NewGameFleetMethodScreenProps) {
  const [fleetMethod, setFleetMethod] = useState<FleetMethodDraft>(initialFleetMethod);
  const launching = status === "launching";
  const captionId = useId();

  const fleetMethodRef = useRef(fleetMethod);
  fleetMethodRef.current = fleetMethod;
  const onNextRef = useRef(onNext);
  onNextRef.current = onNext;

  const triggerNext = useCallback(() => {
    onNextRef.current(fleetMethodRef.current);
  }, []);

  const primaryAction = useMemo(
    () => ({
      label: launching ? "Starting…" : "Start Campaign",
      disabled: launching,
      onTrigger: triggerNext,
    }),
    [launching, triggerNext],
  );
  usePrimaryAction(primaryAction, onPrimaryActionChange);

  const images = useMemo<ReadonlyArray<BounceCardImage>>(
    () =>
      FLEET_METHOD_CARDS.map((card) => ({
        src: getFleetMethodArtwork(card.id),
        alt: card.title,
      })),
    [],
  );

  const activeIndex = useMemo(
    () => FLEET_METHOD_CARDS.findIndex((card) => card.id === fleetMethod.legacyFleetModeId),
    [fleetMethod.legacyFleetModeId],
  );

  const activeCard =
    FLEET_METHOD_CARDS.find((card) => card.id === fleetMethod.legacyFleetModeId) ??
    FLEET_METHOD_CARDS[0];

  const handleCardClick = useCallback((index: number) => {
    const card = FLEET_METHOD_CARDS[index];
    if (card) setFleetMethod({ legacyFleetModeId: card.id });
  }, []);

  return (
    <NewGameScreenLayout size="md">
      <ScreenHeader
        icon={<Anchor className="h-5 w-5" />}
        title="Starting-fleet method"
        description="Choose how your legacy navy comes together. Every option is available in every era."
      />

      {error !== null && <p className="text-sm text-destructive">{error}</p>}

      <section
        aria-label="Starting-fleet method choices"
        className="flex flex-col items-center gap-4"
      >
        <BounceCards
          images={images}
          activeIndex={activeIndex}
          activeDescriptionId={captionId}
          onCardClick={handleCardClick}
          {...NEW_GAME_BOUNCE_CARDS_PROPS}
        />

        <ul
          aria-label="Starting-fleet method comparison"
          className="flex w-full max-w-md flex-col gap-1"
        >
          {FLEET_METHOD_CARDS.map((card) => {
            const active = card.id === activeCard?.id;
            return (
              <li
                key={card.id}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "flex items-baseline justify-between gap-3 rounded-md px-2 py-1 text-left",
                  active ? "bg-muted" : "opacity-70",
                )}
              >
                <span className="text-sm font-medium">{card.title}</span>
                <span className="text-xs text-muted-foreground">{card.tagline}</span>
              </li>
            );
          })}
        </ul>

        {activeCard !== undefined && (
          <div id={captionId} className="flex max-w-md flex-col items-center gap-1 text-center">
            <p className="text-xs text-muted-foreground">{activeCard.description}</p>
            {activeCard.note !== null && (
              <p className="text-xs italic text-muted-foreground">{activeCard.note}</p>
            )}
          </div>
        )}
      </section>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack} disabled={launching}>
          Back to Identity
        </Button>
      </div>
    </NewGameScreenLayout>
  );
}
