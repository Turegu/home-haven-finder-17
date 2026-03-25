// Agent designation options with translations
export interface DesignationOption {
  value: string;
  en: string;
  ar: string;
  fr: string;
}

export const agentDesignations: DesignationOption[] = [
  { value: "Sales Director", en: "Sales Director", ar: "مدير المبيعات", fr: "Directeur des ventes" },
  { value: "Sales Manager", en: "Sales Manager", ar: "مدير مبيعات", fr: "Responsable des ventes" },
  { value: "Senior Property Consultant", en: "Senior Property Consultant", ar: "مستشار عقاري أول", fr: "Consultant immobilier senior" },
  { value: "Property Consultant", en: "Property Consultant", ar: "مستشار عقاري", fr: "Consultant immobilier" },
  { value: "Property Specialist", en: "Property Specialist", ar: "أخصائي عقاري", fr: "Spécialiste immobilier" },
  { value: "Property Agent", en: "Property Agent", ar: "وكيل عقاري", fr: "Agent immobilier" },
  { value: "Sales Agent", en: "Sales Agent", ar: "وكيل مبيعات", fr: "Agent commercial" },
  { value: "Leasing Agent", en: "Leasing Agent", ar: "وكيل تأجير", fr: "Agent de location" },
  { value: "Marketing Consultant", en: "Marketing Consultant", ar: "مستشار تسويق", fr: "Consultant marketing" },
  { value: "Branch Manager", en: "Branch Manager", ar: "مدير فرع", fr: "Directeur d'agence" },
  { value: "Regional Manager", en: "Regional Manager", ar: "مدير إقليمي", fr: "Directeur régional" },
  { value: "Property Manager", en: "Property Manager", ar: "مدير عقارات", fr: "Gestionnaire immobilier" },
  { value: "Investment Advisor", en: "Investment Advisor", ar: "مستشار استثماري", fr: "Conseiller en investissement" },
  { value: "Valuation Expert", en: "Valuation Expert", ar: "خبير تقييم", fr: "Expert en évaluation" },
];

export function getDesignationLabel(value: string | null | undefined, lang: string): string {
  if (!value) return "";
  const found = agentDesignations.find(d => d.value === value);
  if (!found) return value;
  if (lang === "ar") return found.ar;
  if (lang === "fr") return found.fr;
  return found.en;
}
