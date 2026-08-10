import { z } from "zod";

export const CountrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  tag: z.string().length(3),
  color: z.string().optional(),
});

export interface Country extends z.infer<typeof CountrySchema> {}
