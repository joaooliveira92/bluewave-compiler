import { Schema } from "effect";

export const AreaSchema = Schema.Struct({
  id: Schema.NonEmptyString,
  name: Schema.NonEmptyString,
  type: Schema.Literals(["land", "sea", "coastal"]),
  controller: Schema.optional(Schema.String),
});

export type Area = typeof AreaSchema.Type;
