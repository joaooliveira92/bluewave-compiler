import type { WarsPack } from "../../schema/wars.ts";

export const SCEN_1880_WARS: WarsPack = {
  scenario: "scen_1880",
  provenance: "CANONICAL_CONTENT",
  wars: [
    {
      id: "war_mahdist_1881",
      name: "Mahdist War",
      sides: [
        {
          id: "side_anglo_egyptian",
          members: ["uk", "ottoman_empire"],
          warGoals: ["protect_possessions"],
        },
        { id: "side_mahdist", members: ["mahdist_state"], warGoals: ["independence"] },
      ],
      startDate: "1881-03-01",
      endDate: null,
      status: "scheduled",
      warScore: { side_anglo_egyptian: 0, side_mahdist: 0 },
    },
    {
      id: "war_sino_french_1884",
      name: "Sino-French War",
      sides: [
        { id: "side_france", members: ["france"], warGoals: ["protect_possessions"] },
        { id: "side_qing", members: ["qing"], warGoals: ["protect_possessions"] },
      ],
      startDate: "1884-08-01",
      endDate: null,
      status: "scheduled",
      warScore: { side_france: 0, side_qing: 0 },
    },
    {
      id: "war_serbo_bulgarian_1885",
      name: "Serbo-Bulgarian War",
      sides: [
        { id: "side_serbia", members: ["serbia"], warGoals: ["contain_rival"] },
        { id: "side_bulgaria", members: ["bulgaria", "russia"], warGoals: ["protect_possessions"] },
      ],
      startDate: "1885-11-14",
      endDate: null,
      status: "scheduled",
      warScore: { side_serbia: 0, side_bulgaria: 0 },
    },
  ],
};
