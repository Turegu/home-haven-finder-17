// Company type options - hardcoded fallback (DB is the source of truth)
export const companyTypes = [
  { value: "Real Estate Company", label: "Real Estate Company", label_ar: "شركة عقارية", label_fr: "Société immobilière" },
  { value: "Real Estate Developer", label: "Real Estate Developer", label_ar: "مطور عقاري", label_fr: "Promoteur immobilier" },
  { value: "Construction Company", label: "Construction Company", label_ar: "شركة إنشاءات", label_fr: "Entreprise de construction" },
  { value: "Marketing & Advertising Company", label: "Marketing & Advertising Company", label_ar: "شركة تسويق وإعلان", label_fr: "Société de marketing et publicité" },
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
