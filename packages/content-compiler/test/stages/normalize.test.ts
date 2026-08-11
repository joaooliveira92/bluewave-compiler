import { NormalizeStage } from "@bluewave/content-compiler";
import { describe, expect, it } from "vitest";

describe("NormalizeStage", () => {
  it("sorts all collections by id", () => {
    const stage = new NormalizeStage();

    const result = stage.run(
      {
        manifest: { version: "1" },
        rulesets: [{ id: "z" }, { id: "a" }],
        countries: [{ id: "z" }, { id: "a" }],
        areas: [{ id: "z" }, { id: "a" }],
        routes: [{ id: "z" }, { id: "a" }],
        possessions: [{ id: "z" }, { id: "a" }],
        ports: [{ id: "z" }, { id: "a" }],
        technologies: [{ id: "z" }, { id: "a" }],
      },
      new AbortController().signal,
      {} as never,
    );

    expect(result.rulesets.map((x) => x["id"])).toEqual(["a", "z"]);
    expect(result.countries.map((x) => x["id"])).toEqual(["a", "z"]);
    expect(result.areas.map((x) => x["id"])).toEqual(["a", "z"]);
    expect(result.routes.map((x) => x["id"])).toEqual(["a", "z"]);
    expect(result.possessions.map((x) => x["id"])).toEqual(["a", "z"]);
    expect(result.ports.map((x) => x["id"])).toEqual(["a", "z"]);
    expect(result.technologies.map((x) => x["id"])).toEqual(["a", "z"]);
  });

  it("preserves manifest", () => {
    const stage = new NormalizeStage();

    const manifest = { version: "1.0.0" };

    const result = stage.run(
      {
        manifest,
        rulesets: [],
        countries: [],
        areas: [],
        routes: [],
        possessions: [],
        ports: [],
        technologies: [],
      },
      new AbortController().signal,
      {} as never,
    );

    expect(result.manifest).toBe(manifest);
  });
});
