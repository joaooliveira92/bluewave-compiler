export interface ContentPackManifest {
  id: string;
  name: string;
  version: string;
  schemaVersion: string;
  contentHash: string;
  description: string;
  author: string;
  scenarios: ScenarioManifestEntry[];
}

/**
 * Registry entry only — metadata for listing, not a path to pack data.
 * Pack files are located by convention from the id (see FsContentLoader).
 */
export interface ScenarioManifestEntry {
  id: string;
  name: string;
  description: string;
  startYear: number;
  endYear: number;
}

export const CANONICAL_MANIFEST: ContentPackManifest = {
  id: "bluewave-canonical",
  name: "Bluewave Canonical Content",
  version: "0.1.0",
  schemaVersion: "1",
  contentHash: "abc123",
  description: "Canonical campaign content for Milestone 1.",
  author: "Bluewave",
  scenarios: [
    {
      id: "scen_1880",
      name: "January 1880",
      description: "The age of empire. Ironclads and pre-dreadnoughts define the naval order.",
      startYear: 1880,
      endYear: 1970,
    },
    {
      id: "scen_1900",
      name: "January 1900",
      description:
        "The dawn of a new century. The Royal Navy faces new challenges from rapidly modernising rivals.",
      startYear: 1900,
      endYear: 1970,
    },
    {
      id: "scen_1920",
      name: "January 1920",
      description: "The post-war order. Treaties constrain fleets while new powers emerge.",
      startYear: 1920,
      endYear: 1970,
    },
    {
      id: "scen_1935",
      name: "January 1935",
      description: "The world rearms. New technologies and growing tensions define the mid-1930s.",
      startYear: 1935,
      endYear: 1970,
    },
    {
      id: "scen_1960",
      name: "January 1960",
      description: "The Cold War navy. Missiles, nuclear propulsion, and global commitments.",
      startYear: 1960,
      endYear: 1970,
    },
  ],
};
