import { NATION_FLAVOR_TEXT } from "./nationFlavorText.js";
import { nationIdToCountryId } from "./nationSlotMapping.js";

/**
 * Resolves a canonical nation id to its canonical display name by composing the
 * country-id bridge with the nation flavor-text catalog (the module that owns
 * canonical display text). An unmapped or unknown id falls back to the raw id
 * verbatim — never an invented name and never a silent default. Display only:
 * never feed the result back into mechanics.
 */
export function nationDisplayName(nationId: string): string {
  const countryId = nationIdToCountryId(nationId);
  return countryId === null ? nationId : NATION_FLAVOR_TEXT[countryId].name;
}
