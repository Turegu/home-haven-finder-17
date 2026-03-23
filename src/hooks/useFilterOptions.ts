import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useFilterCategories } from "./useAppData";

/**
 * Returns a map of category_key → string[] of option titles,
 * automatically resolved to the current i18n language using
 * the translations JSON stored in filter_options.
 *
 * Usage: const { options } = useFilterOptions("property");
 *        options["furniture"] → ["مفروش بالكامل", "غير مفروش", ...]  (if lang=ar)
 */
export function useFilterOptions(context: string) {
  const { data, isLoading } = useFilterCategories(context);
  const { i18n } = useTranslation();
  const lang = i18n.language; // e.g. "ar", "en", "tr"

  const options = useMemo(() => {
    const map: Record<string, string[]> = {};
    if (!data) return map;
    for (const cat of data.categories) {
      const opts = data.optionsByCategory[cat.id] || [];
      map[cat.category_key] = opts.map((o) => {
        // If non-English and translation exists, use it; otherwise fallback to English title
        if (lang && lang !== "en" && o.translations) {
          const tr = o.translations as Record<string, string>;
          if (tr[lang]) return tr[lang];
        }
        return o.title;
      });
    }
    return map;
  }, [data, lang]);

  return { options, isLoading };
}
