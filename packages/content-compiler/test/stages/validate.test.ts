import { describe, expect, it, vi, beforeEach } from "vite-plus/test";
import { ParseStage } from "@bluewave/content-compiler";

vi.mock("node:fs", () => ({
  readFileSync: vi.fn(),
}));

vi.mock("@bluewave/content-schema", () => ({
  parseYamlSafe: vi.fn(),
}));

import { readFileSync } from "node:fs";
import { parseYamlSafe } from "@bluewave/content-schema";

describe("ParseStage", () => {
  const collector = {
    addError: vi.fn(),
    hasErrors: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads manifest and collection documents", () => {
    vi.mocked(readFileSync).mockReturnValue("yaml");

    vi.mocked(parseYamlSafe)
      .mockReturnValueOnce({
        success: true,
        data: { id: "manifest" },
      })
      .mockReturnValueOnce({
        success: true,
        data: [{ id: "country-1" }],
      });

    const stage = new ParseStage();

    const result = stage.run(
      {
        contentDir: "/content",
        manifestPath: "manifest.yaml",
        countryFiles: ["countries.yaml"],
        rulesetFiles: [],
        areaFiles: [],
        routeFiles: [],
        possessionFiles: [],
        portFiles: [],
        technologyFiles: [],
      },
      new AbortController().signal,
      collector as never,
    );

    expect(result?.manifest).toEqual({ id: "manifest" });
    expect(result?.collectionDocs.get("countries")).toEqual([{ id: "country-1" }]);
  });

  it("returns undefined when aborted", () => {
    const controller = new AbortController();
    controller.abort();

    const stage = new ParseStage();

    const result = stage.run(
      {
        contentDir: ".",
        manifestPath: "manifest.yaml",
        countryFiles: [],
        rulesetFiles: [],
        areaFiles: [],
        routeFiles: [],
        possessionFiles: [],
        portFiles: [],
        technologyFiles: [],
      },
      controller.signal,
      collector as never,
    );

    expect(result).toBeUndefined();
  });

  it("reports file read failures", () => {
    vi.mocked(readFileSync).mockImplementation(() => {
      throw new Error("boom");
    });

    const stage = new ParseStage();

    stage.run(
      {
        contentDir: ".",
        manifestPath: "manifest.yaml",
        countryFiles: [],
        rulesetFiles: [],
        areaFiles: [],
        routeFiles: [],
        possessionFiles: [],
        portFiles: [],
        technologyFiles: [],
      },
      new AbortController().signal,
      collector as never,
    );

    expect(collector.addError).toHaveBeenCalledWith(
      "FILE-READ",
      expect.stringContaining("boom"),
      expect.any(Object),
    );
  });
});
