import { z } from "zod";

export const AiProfileSchema = z.object({
  nation: z.string(),
  personality: z.string(),
  riskTolerance: z.number(),
  researchFocus: z.array(z.string()),
  fleetDoctrine: z.string(),
  traits: z.array(z.string()),
});

export const AiProfilesPackSchema = z.object({
  scenario: z.string(),
  provenance: z.string(),
  aiProfiles: z.array(AiProfileSchema),
});

export type AiProfile = z.infer<typeof AiProfileSchema>;
export type AiProfilesPack = z.infer<typeof AiProfilesPackSchema>;
