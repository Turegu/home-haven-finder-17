export const companyTypes = [
  { value: "real_estate_agency", label: "Real Estate Agency", label_ar: "وكالة عقارية", label_fr: "Agence immobilière" },
  { value: "developer", label: "Developer", label_ar: "مطور عقاري", label_fr: "Promoteur immobilier" },
  { value: "brokerage", label: "Brokerage", label_ar: "وساطة عقارية", label_fr: "Courtage immobilier" },
  { value: "property_management", label: "Property Management", label_ar: "إدارة العقارات", label_fr: "Gestion immobilière" },
  { value: "consulting", label: "Consulting", label_ar: "استشارات", label_fr: "Conseil" },
  { value: "marketing_agency", label: "Marketing Agency", label_ar: "وكالة تسويق", label_fr: "Agence marketing" },
];

/** Convert a company_types array to a display string, with optional language */
export function formatCompanyTypes(types: string[] | null, lang?: string): string {
  if (!types || types.length === 0) {
    if (lang === 'ar') return "شركة عقارية";
    if (lang === 'fr') return "Société immobilière";
    return "Real Estate Company";
  }
  return types
    .map((t) => {
      const found = companyTypes.find((ct) => ct.value === t);
      if (found) {
        if (lang === 'ar') return found.label_ar;
        if (lang === 'fr') return found.label_fr;
        return found.label;
      }
      return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    })
    .join(", ");
}
