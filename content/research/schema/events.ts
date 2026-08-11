import { z } from "zod";

export const EventEligibilitySchema = z.object({
  year: z.number().optional(),
  nation: z.string().optional(),
  nations: z.array(z.string()).optional(),
});

export const EventEffectSchema = z.object({
  type: z.string(),
  value: z.union([z.number(), z.string()]).optional(),
  target: z.string().optional(),
});

export const EventChoiceSchema = z.object({
  id: z.string(),
  effects: z.array(EventEffectSchema),
  label: z.string().optional(),
});

export const EventSchema = z.object({
  id: z.string(),
  version: z.string(),
  scope: z.string(),
  eligibility: EventEligibilitySchema.optional(),
  triggerPhase: z.string(),
  weight: z.number(),
  visibility: z.string(),
  choices: z.array(EventChoiceSchema),
  rngStream: z.string().optional(),
});

export const EventsPackSchema = z.object({
  scenario: z.string(),
  provenance: z.string(),
  events: z.array(EventSchema),
});

export type Event = z.infer<typeof EventSchema>;
export type EventsPack = z.infer<typeof EventsPackSchema>;
