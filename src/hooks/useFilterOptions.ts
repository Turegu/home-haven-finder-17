import { useMemo } from "react";
import { useFilterCategories } from "./useAppData";

/**
 * Returns a map of category_key → string[] of option titles.
 * Usage: const filters = useFilterOptions("property");
 *        filters["furniture"] → ["Fully Furnished", "Unfurnished", ...]
 */
export function useFilterOptions(context: string) {
  const { data, isLoading } = useFilterCategories(context);

  const options = useMemo(() => {
    const map: Record<string, string[]> = {};
    if (!data) return map;
    for (const cat of data.categories) {
      const opts = data.optionsByCategory[cat.id] || [];
      map[cat.category_key] = opts.map((o) => o.title);
    }
    return map;
  }, [data]);

  return { options, isLoading };
}
