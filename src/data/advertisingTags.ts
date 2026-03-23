/** Preset advertising tag values (stored in DB as English) mapped to i18n keys */
export const ADVERTISING_TAG_OPTIONS: { value: string; labelKey: string }[] = [
  { value: "Hot Deal", labelKey: "companyDashboard.tag_hotDeal" },
  { value: "Price Drop", labelKey: "companyDashboard.tag_priceDrop" },
  { value: "Exclusive", labelKey: "companyDashboard.tag_exclusive" },
  { value: "New Launch", labelKey: "companyDashboard.tag_newLaunch" },
  { value: "Best Seller", labelKey: "companyDashboard.tag_bestSeller" },
  { value: "Limited Offer", labelKey: "companyDashboard.tag_limitedOffer" },
  { value: "Negotiable", labelKey: "companyDashboard.tag_negotiable" },
  { value: "Urgent Sale", labelKey: "companyDashboard.tag_urgentSale" },
  { value: "Last Chance", labelKey: "companyDashboard.tag_lastChance" },
  { value: "Lower Price", labelKey: "companyDashboard.tag_lowerPrice" },
  { value: "Below Market", labelKey: "companyDashboard.tag_belowMarket" },
  { value: "Reduced", labelKey: "companyDashboard.tag_reduced" },
  { value: "Cash Only", labelKey: "companyDashboard.tag_cashOnly" },
  { value: "Premium Location", labelKey: "companyDashboard.tag_premiumLocation" },
  { value: "Sea View", labelKey: "companyDashboard.tag_seaView" },
  { value: "Investor Deal", labelKey: "companyDashboard.tag_investorDeal" },
  { value: "Move-In Ready", labelKey: "companyDashboard.tag_moveInReady" },
  { value: "Fully Renovated", labelKey: "companyDashboard.tag_fullyRenovated" },
  { value: "Motivated Seller", labelKey: "companyDashboard.tag_motivatedSeller" },
  { value: "Open House", labelKey: "companyDashboard.tag_openHouseTag" },
];

export const ADVERTISING_TAG_VALUES = ADVERTISING_TAG_OPTIONS.map((t) => t.value);
