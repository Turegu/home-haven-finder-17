import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DbTranslatableItem {
  id: string;
  title: string;
  translations: Record<string, string>;
  sort_order: number;
  status: string;
}

const LEGACY_TRANSLATION_FALLBACKS: Record<string, { en: string; ar?: string; fr?: string }> = {
  real_estate_agency: {
    en: "Real Estate Agency",
    ar: "وكالة عقارية",
    fr: "Agence immobilière",
  },
  developer: {
    en: "Developer",
    ar: "مطوّر عقاري",
    fr: "Promoteur",
  },
  brokerage: {
    en: "Brokerage",
    ar: "وساطة",
    fr: "Courtage",
  },
  property_management: {
    en: "Property Management",
    ar: "إدارة عقارات",
    fr: "Gestion immobilière",
  },
  consulting: {
    en: "Consulting",
    ar: "استشارات",
    fr: "Conseil",
  },
  commercial_agent: {
    en: "Commercial Agent",
    ar: "وكيل تجاري",
    fr: "Agent commercial",
  },
  development_advisor: {
    en: "Development Advisor",
    ar: "مستشار تطوير",
    fr: "Conseiller en développement",
  },
  leasing_specialist: {
    en: "Leasing Specialist",
    ar: "أخصائي تأجير",
    fr: "Spécialiste en location",
  },
  luxury_specialist: {
    en: "Luxury Specialist",
    ar: "أخصائي العقارات الفاخرة",
    fr: "Spécialiste du luxe",
  },
  residential_specialist: {
    en: "Residential Specialist",
    ar: "أخصائي العقارات السكنية",
    fr: "Spécialiste résidentiel",
  },
  senior_agent: {
    en: "Senior Agent",
    ar: "وكيل أول",
    fr: "Agent senior",
  },
  senior_broker: {
    en: "Senior Broker",
    ar: "وسيط أول",
    fr: "Courtier senior",
  },
  senior_sales_consultant: {
    en: "Senior Sales Consultant",
    ar: "مستشار مبيعات أول",
    fr: "Consultant commercial senior",
  },
};

const normalizeLabel = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

const toLegacyKey = (value: string) => normalizeLabel(value).replace(/\s+/g, "_");

const prettifyFallback = (value: string) =>
  value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

// Shared fetcher for designations & company_types tables
async function fetchTranslatableItems(table: "designations" | "company_types"): Promise<DbTranslatableItem[]> {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("status", "active")
    .order("sort_order");
  if (error) throw error;
  return (data || []) as unknown as DbTranslatableItem[];
}

export function useDesignations() {
  return useQuery({
    queryKey: ["designations"],
    queryFn: () => fetchTranslatableItems("designations"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCompanyTypes() {
  return useQuery({
    queryKey: ["company_types"],
    queryFn: () => fetchTranslatableItems("company_types"),
    staleTime: 5 * 60 * 1000,
  });
}

/** Get localized label for a translatable item */
export function getTranslatedLabel(
  items: DbTranslatableItem[],
  value: string | null | undefined,
  lang: string
): string {
  if (!value) return "";
  const normalizedValue = normalizeLabel(value);
  const found = items.find((item) => {
    if (normalizeLabel(item.title) === normalizedValue) return true;
    const translations = item.translations ?? {};
    return Object.values(translations).some(
      (translated) => typeof translated === "string" && normalizeLabel(translated) === normalizedValue
    );
  });

  if (found) {
    const localized = found.translations?.[lang];
    if (lang !== "en" && typeof localized === "string" && localized.trim()) return localized;
    return found.title;
  }

  const legacy = LEGACY_TRANSLATION_FALLBACKS[toLegacyKey(value)];
  if (legacy) {
    if (lang === "ar" && legacy.ar) return legacy.ar;
    if (lang === "fr" && legacy.fr) return legacy.fr;
    return legacy.en;
  }

  return prettifyFallback(value);
}

/** Format company types array to display string */
export function formatCompanyTypesFromDb(
  items: DbTranslatableItem[],
  types: string[] | null,
  lang: string
): string {
  if (!types || types.length === 0) {
    // Default fallback
    const defaultItem = items[0];
    if (defaultItem) return getTranslatedLabel(items, defaultItem.title, lang);
    return getTranslatedLabel(items, "real_estate_agency", lang);
  }
  return types
    .map(t => getTranslatedLabel(items, t, lang))
    .filter(Boolean)
    .join(", ");
}
