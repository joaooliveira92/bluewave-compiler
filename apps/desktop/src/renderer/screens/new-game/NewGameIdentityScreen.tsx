import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../../components/ui/button.js";
import { Field, FieldGroup, FieldLabel } from "../../components/ui/field.js";
import { GlassCard } from "../../components/ui/glass-card.js";
import { Input } from "../../components/ui/input.js";
import type { SetPrimaryAction } from "../../shell/primary-action.js";
import {
  type CampaignIdentityDraft,
  isCampaignIdentityValid,
  updateCampaignIdentity,
} from "./new-game-identity-screen-state.js";
import { ScreenHeader } from "./components/ScreenHeader.js";

export interface NewGameIdentityScreenProps {
  readonly initialIdentity: CampaignIdentityDraft;
  readonly onBack: () => void;
  readonly onNext: (identity: CampaignIdentityDraft) => void;
  readonly onPrimaryActionChange: SetPrimaryAction;
}

/**
 * Minimal pass-through stub (INC-1): only the two required fields — the
 * naming-convention/ship-name-reuse/measurement-system enums already carry
 * spec-correct defaults and aren't exposed here. INC-4 builds the real
 * screen (enum pickers, full layout).
 */
export function NewGameIdentityScreen({
  initialIdentity,
  onBack,
  onNext,
  onPrimaryActionChange,
}: NewGameIdentityScreenProps) {
  const [identity, setIdentity] = useState<CampaignIdentityDraft>(initialIdentity);

  const identityRef = useRef(identity);
  identityRef.current = identity;
  const onNextRef = useRef(onNext);
  onNextRef.current = onNext;

  const triggerNext = useCallback(() => {
    if (isCampaignIdentityValid(identityRef.current)) onNextRef.current(identityRef.current);
  }, []);

  const valid = isCampaignIdentityValid(identity);

  useEffect(() => {
    onPrimaryActionChange({
      label: "Next",
      disabled: !valid,
      onTrigger: triggerNext,
    });
    return () => onPrimaryActionChange(null);
  }, [valid, triggerNext, onPrimaryActionChange]);

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col gap-6 overflow-y-auto p-8">
      <ScreenHeader
        icon={<span>⚓</span>}
        title="Admiral & Campaign Identity"
        description="Give this command a name."
      />

      <GlassCard glassVariant="liquid-refract">
        <FieldGroup className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="admiral-name">Admiral name</FieldLabel>
            <Input
              id="admiral-name"
              placeholder="e.g. John Fisher"
              value={identity.admiralName}
              onChange={(event) =>
                setIdentity((current) =>
                  updateCampaignIdentity(current, "admiralName", event.target.value),
                )
              }
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="campaign-name">Campaign name</FieldLabel>
            <Input
              id="campaign-name"
              placeholder="e.g. Britannia Ascendant"
              value={identity.campaignName}
              onChange={(event) =>
                setIdentity((current) =>
                  updateCampaignIdentity(current, "campaignName", event.target.value),
                )
              }
            />
          </Field>
        </FieldGroup>
      </GlassCard>

      <div className="flex justify-between">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back to Archetype
        </Button>
      </div>
    </div>
  );
}
