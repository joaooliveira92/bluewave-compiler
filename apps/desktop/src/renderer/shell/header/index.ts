import { HeaderCampaignMenu } from "./HeaderCampaignMenu.js";
import { HeaderChrome } from "./HeaderChrome.js";
import { HeaderNav } from "./HeaderNav.js";
import { HeaderSearch } from "./HeaderSearch.js";
import { HeaderSecondaryRow } from "./HeaderSecondaryRow.js";
import { HeaderTitle } from "./HeaderTitle.js";
import { HeaderWindowControls } from "./HeaderWindowControls.js";

export const Header = {
  Nav: HeaderNav,
  Title: HeaderTitle,
  Search: HeaderSearch,
  CampaignMenu: HeaderCampaignMenu,
  Chrome: HeaderChrome,
  WindowControls: HeaderWindowControls,
  SecondaryRow: HeaderSecondaryRow,
};

export {
  HeaderCampaignMenu,
  HeaderChrome,
  HeaderNav,
  HeaderSearch,
  HeaderSecondaryRow,
  HeaderTitle,
  HeaderWindowControls,
};
export type { HeaderNavProps, NavAction } from "./HeaderNav.js";
export type { HeaderCampaignMenuProps } from "./HeaderCampaignMenu.js";
