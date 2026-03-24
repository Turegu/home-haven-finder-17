export const companyTypes = [
  { value: "real_estate_agency", label: "Real Estate Agency" },
  { value: "developer", label: "Developer" },
  { value: "brokerage", label: "Brokerage" },
  { value: "property_management", label: "Property Management" },
  { value: "consulting", label: "Consulting" },
  { value: "marketing_agency", label: "Marketing Agency" },
];

/** Convert a company_types array to a display string */
export function formatCompanyTypes(types: string[] | null): string {
  if (!types || types.length === 0) return "Real Estate Company";
  return types
    .map((t) => {
      const found = companyTypes.find((ct) => ct.value === t);
      return found ? found.label : t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    })
    .join(", ");
}
