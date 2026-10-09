/**
 * Re-export of the presentation country-id bridge. The mapping itself now lives
 * with the presentation content (`content/nationSlotMapping.ts`); this module
 * keeps the existing new-game/diplomacy import path working.
 */
export {
  NATION_ID_TO_COUNTRY_ID,
  countryIdToNationId,
  nationIdToCountryId,
} from "../../../content/nationSlotMapping.js";
