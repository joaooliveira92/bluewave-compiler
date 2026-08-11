import type { Nation } from "../../schema/nations.ts";
import { uk } from "./uk.ts";
import { germany } from "./germany.ts";
import { usa } from "./usa.ts";
import { japan } from "./japan.ts";
import { france } from "./france.ts";
import { italy } from "./italy.ts";
import { russia } from "./russia.ts";
import { austria_hungary } from "./austria_hungary.ts";
import { spain } from "./spain.ts";
import { qing } from "./qing.ts";
import { ottoman_empire } from "./ottoman_empire.ts";
import { egypt } from "./egypt.ts";
import { netherlands } from "./netherlands.ts";
import { denmark } from "./denmark.ts";
import { sweden_norway } from "./sweden_norway.ts";
import { portugal } from "./portugal.ts";
import { greece } from "./greece.ts";
import { brazil } from "./brazil.ts";
import { chile } from "./chile.ts";
import { argentina } from "./argentina.ts";
import { korea } from "./korea.ts";
import { siam } from "./siam.ts";
import { belgium } from "./belgium.ts";
import { persia } from "./persia.ts";

export const CANON_NATIONS_1880 = {
  scenario: "january_1880",
  provenance:
    "Consolidated Final Canon Document - Phase 1 + Phase 2 - Immutable - 10 Playable + 12 AI",
  continuityMode: "historical_1880_canon" as const,
  nations: [
    uk,
    germany,
    usa,
    japan,
    france,
    italy,
    russia,
    austria_hungary,
    spain,
    qing,
    ottoman_empire,
    egypt,
    netherlands,
    denmark,
    sweden_norway,
    portugal,
    greece,
    brazil,
    chile,
    argentina,
    korea,
    siam,
    belgium,
    persia,
  ] as const satisfies readonly Nation[],
} as const;
