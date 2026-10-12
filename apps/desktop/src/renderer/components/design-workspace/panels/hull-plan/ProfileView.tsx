import type { DrawingBoardContent } from "../../content.js";
import type { DesignDraft } from "@bluewave/ship-design";
import { type DrawingFacts, profileLabel } from "./describe.js";
import { funnelPlacements } from "./funnelPlacements.js";
import {
  funnelShapes,
  houseMasses,
  PROFILE_H,
  PROFILE_W,
  profileFrame,
} from "./profile-geometry.js";
import type { BowStyle, SternStyle } from "./geometry.js";
import { ProfileFittingsLayer, ProfileHullLayer, ProfileWaterlineLayer } from "./profile-layers.js";
import { ProfileReferenceLayer } from "./ProfileReferenceLayer.js";

/**
 * Side profile (bow left), drawn under the plan on the same horizontal scale. SCHEMATIC: see `profileFrame`;
 * masts, guns and armour are not drawn. Layers, back to front: datums, hull silhouette, fitted structures.
 */
export function ProfileView({
  draft,
  content,
  sheerBp,
  bow,
  stern,
  lcbPermille,
  superstructure,
  facts,
}: {
  readonly draft: DesignDraft;
  readonly content: DrawingBoardContent;
  readonly sheerBp: number;
  readonly bow: BowStyle;
  readonly stern: SternStyle;
  readonly lcbPermille: number;
  readonly superstructure: { startPermille: number; endPermille: number } | undefined;
  readonly facts: DrawingFacts;
}) {
  const frame = profileFrame(draft.hull, sheerBp, bow, stern);
  const houses = houseMasses(frame, superstructure);
  const funnels = funnelShapes(frame, funnelPlacements(draft, content), houses);
  return (
    <svg
      viewBox={`0 0 ${PROFILE_W} ${PROFILE_H}`}
      className="w-full rounded bg-muted/40"
      role="img"
      aria-label={profileLabel(facts)}
      data-testid="hull-profile"
    >
      <ProfileReferenceLayer frame={frame} />
      <ProfileHullLayer frame={frame} />
      <ProfileFittingsLayer houses={houses} funnels={funnels} />
      <ProfileWaterlineLayer frame={frame} lcbPermille={lcbPermille} />
    </svg>
  );
}
