import { Schema } from "effect";

export const PossessionSchema = Schema.Struct({
  id: Schema.NonEmptyString,
  nationId: Schema.NonEmptyString,
  areaId: Schema.NonEmptyString,
  since: Schema.optional(Schema.String),
});

export type Possession = typeof PossessionSchema.Type;
