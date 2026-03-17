import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FilterCategory {
  id: string;
  category_key: string;
  title: string;
  applies_to: string[];
}

interface FilterOption {
  id: string;
  category_id: string;
  title: string;
}

interface SearchFiltersProps {
  /** Which context to show filters for: "property", "project", "project_unit", "event" */
  context: string;
  selectedFilters: Record<string, string[]>;
  onFiltersChange: (filters: Record<string, string[]>) => void;
  /** Category keys to show as quick-access buttons in the toolbar */
  quickFilterKeys?: string[];
}

export default function SearchFilters({ context, selectedFilters, onFiltersChange, quickFilterKeys }: SearchFiltersProps) {
  const [categories, setCategories] = useState<FilterCategory[]>([]);
  const [optionsByCategory, setOptionsByCategory] = useState<Record<string, FilterOption[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: cats } = await supabase
        .from("filter_categories")
        .select("id, category_key, title, applies_to")
        .eq("status", "active")
        .order("sort_order");

      if (!cats) { setLoading(false); return; }

      const relevantCats = cats.filter((c) =>
        (c.applies_to as string[]).includes(context) || (c.applies_to as string[]).includes("search")
      );
      setCategories(relevantCats);

      const catIds = relevantCats.map((c) => c.id);
      if (catIds.length > 0) {
        const { data: opts } = await supabase
          .from("filter_options")
          .select("id, category_id, title")
          .in("category_id", catIds)
          .eq("status", "active")
          .order("sort_order");

        if (opts) {
          const grouped: Record<string, FilterOption[]> = {};
          for (const opt of opts) {
            if (!grouped[opt.category_id]) grouped[opt.category_id] = [];
            grouped[opt.category_id].push(opt);
          }
          setOptionsByCategory(grouped);
        }
      }
      setLoading(false);
    }
    load();
  }, [context]);

  function toggleFilter(categoryKey: string, optionTitle: string) {
    const current = selectedFilters[categoryKey] || [];
    const updated = current.includes(optionTitle)
      ? current.filter((v) => v !== optionTitle)
      : [...current, optionTitle];
    onFiltersChange({ ...selectedFilters, [categoryKey]: updated });
  }

  function clearFilter(categoryKey: string) {
    const updated = { ...selectedFilters };
    delete updated[categoryKey];
    onFiltersChange(updated);
  }

  function clearAll() {
    onFiltersChange({});
  }

  const activeCount = Object.values(selectedFilters).reduce((s, v) => s + v.length, 0);

  if (loading) return null;

  const defaultQuickKeys = quickFilterKeys || categories.slice(0, 4).map((c) => c.category_key);
  const quickCategories = categories.filter((c) => defaultQuickKeys.includes(c.category_key));
  const remainingCategories = categories.filter((c) => !defaultQuickKeys.includes(c.category_key));

  return (
    <>
      {/* Quick filter buttons */}
      {quickCategories.map((cat) => (
        <FilterDropdown
          key={cat.id}
          category={cat}
          options={optionsByCategory[cat.id] || []}
          selected={selectedFilters[cat.category_key] || []}
          onToggle={(title) => toggleFilter(cat.category_key, title)}
          onClear={() => clearFilter(cat.category_key)}
        />
      ))}

      {/* "More Filters" sheet for remaining */}
      {remainingCategories.length > 0 && (
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-primary font-medium hover:bg-secondary rounded-md transition-colors">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeCount > 0 && (
                <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full">
                  {activeCount}
                </Badge>
              )}
            </button>
          </SheetTrigger>
          <SheetContent className="w-[340px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle className="flex items-center justify-between">
                All Filters
                {activeCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs text-destructive">
                    Clear All
                  </Button>
                )}
              </SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-100px)] mt-4 pr-3">
              <div className="space-y-6">
                {categories.map((cat) => {
                  const opts = optionsByCategory[cat.id] || [];
                  const selected = selectedFilters[cat.category_key] || [];
                  return (
                    <div key={cat.id}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-foreground">{cat.title}</h4>
                        {selected.length > 0 && (
                          <button onClick={() => clearFilter(cat.category_key)} className="text-xs text-destructive hover:underline">
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        {opts.map((opt) => (
                          <label key={opt.id} className="flex items-center gap-2 cursor-pointer py-1 px-2 rounded hover:bg-muted transition-colors">
                            <Checkbox
                              checked={selected.includes(opt.title)}
                              onCheckedChange={() => toggleFilter(cat.category_key, opt.title)}
                            />
                            <span className="text-sm text-foreground">{opt.title}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      )}

      {/* Active filter badges */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-1 ml-1">
          {Object.entries(selectedFilters).map(([key, values]) =>
            values.map((v) => (
              <Badge key={`${key}-${v}`} variant="secondary" className="text-xs gap-1 pr-1">
                {v}
                <button onClick={() => toggleFilter(key, v)} className="ml-0.5 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))
          )}
          <button onClick={clearAll} className="text-xs text-destructive hover:underline ml-1">
            Clear all
          </button>
        </div>
      )}
    </>
  );
}

function FilterDropdown({
  category,
  options,
  selected,
  onToggle,
  onClear,
}: {
  category: FilterCategory;
  options: FilterOption[];
  selected: string[];
  onToggle: (title: string) => void;
  onClear: () => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="hidden md:flex items-center gap-1 px-3 py-2 text-sm border border-border rounded-md hover:border-primary/50 transition-colors bg-background text-foreground/70 hover:text-foreground">
          {category.title}
          {selected.length > 0 && (
            <Badge variant="default" className="h-4 min-w-[16px] p-0 flex items-center justify-center text-[10px] rounded-full ml-1">
              {selected.length}
            </Badge>
          )}
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase">{category.title}</span>
          {selected.length > 0 && (
            <button onClick={onClear} className="text-[10px] text-destructive hover:underline">Clear</button>
          )}
        </div>
        <ScrollArea className="max-h-[250px]">
          <div className="space-y-0.5">
            {options.map((opt) => (
              <label key={opt.id} className="flex items-center gap-2 cursor-pointer py-1.5 px-2 rounded hover:bg-muted transition-colors">
                <Checkbox
                  checked={selected.includes(opt.title)}
                  onCheckedChange={() => onToggle(opt.title)}
                />
                <span className="text-sm">{opt.title}</span>
              </label>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
