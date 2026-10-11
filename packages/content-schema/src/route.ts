import { Schema } from "effect";

export const RouteEdgeSchema = Schema.Struct({
  id: Schema.NonEmptyString,
  from: Schema.NonEmptyString,
  to: Schema.NonEmptyString,
  type: Schema.Literals(["land", "sea", "rail"]),
  distance: Schema.Finite.check(Schema.isInt(), Schema.isGreaterThan(0)),
});

export type RouteEdge = typeof RouteEdgeSchema.Type;
