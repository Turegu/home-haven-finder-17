import { useState, useEffect } from 'react';
import {
  Search, SlidersHorizontal, Check, X,
  Building2, Car, Sofa, Calendar, TreePine, Lamp,
} from 'lucide-react';
import { getIcon } from '@/components/AmenitiesViewAllDialog';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useFilterOptions } from '@/hooks/useFilterOptions';

export interface PropertyMoreFilters {
  floorLevels: string[];
  parkingSpaces: string[];
  furniture: string[];
  propertyAges: string[];
  exteriorAmenities: string[];
  interiorAmenities: string[];
}

export const emptyMoreFilters: PropertyMoreFilters = {
  floorLevels: [],
  parkingSpaces: [],
  furniture: [],
  propertyAges: [],
  exteriorAmenities: [],
  interiorAmenities: [],
};

interface FilterTab {
  key: string;
  label: string;
  icon: React.ElementType;
  filterKey: keyof PropertyMoreFilters;
  optionKey: string;
  type: 'simple' | 'amenity';
  amenityType?: 'interior' | 'exterior';
}

const FILTER_TABS: FilterTab[] = [
  { key: 'floor', label: 'Floor Level', icon: Building2, filterKey: 'floorLevels', optionKey: 'floor_level', type: 'simple' },
  { key: 'parking', label: 'Parking', icon: Car, filterKey: 'parkingSpaces', optionKey: 'parking', type: 'simple' },
  { key: 'furniture', label: 'Furniture', icon: Sofa, filterKey: 'furniture', optionKey: 'furniture', type: 'simple' },
  { key: 'age', label: 'Property Age', icon: Calendar, filterKey: 'propertyAges', optionKey: 'property_age', type: 'simple' },
  { key: 'interior', label: 'Interior Amenities', icon: Lamp, filterKey: 'interiorAmenities', optionKey: 'interior_amenities', type: 'amenity', amenityType: 'interior' },
  { key: 'exterior', label: 'Exterior Amenities', icon: TreePine, filterKey: 'exteriorAmenities', optionKey: 'exterior_amenities', type: 'amenity', amenityType: 'exterior' },
];

interface PropertyFiltersModalProps {
  filters: PropertyMoreFilters;
  onFiltersChange: (filters: PropertyMoreFilters) => void;
  onClearAll?: () => void;
}

export default function PropertyFiltersModal({ filters, onFiltersChange, onClearAll }: PropertyFiltersModalProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('floor');
  const [search, setSearch] = useState('');
  const [local, setLocal] = useState<PropertyMoreFilters>(filters);
  const { options: fo } = useFilterOptions("search");

  useEffect(() => {
    if (open) {
      setLocal(filters);
      setSearch('');
    }
  }, [open, filters]);

  const activeCount =
    filters.floorLevels.length + filters.parkingSpaces.length +
    filters.furniture.length + filters.propertyAges.length +
    filters.exteriorAmenities.length + filters.interiorAmenities.length;

  const localCount =
    local.floorLevels.length + local.parkingSpaces.length +
    local.furniture.length + local.propertyAges.length +
    local.exteriorAmenities.length + local.interiorAmenities.length;

  function toggleArray(key: keyof PropertyMoreFilters, value: string) {
    const current = local[key];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    setLocal({ ...local, [key]: updated });
  }

  function clearAll() {
    const cleared = emptyMoreFilters;
    setLocal(cleared);
    onFiltersChange(cleared);
    onClearAll?.();
  }

  function handleApply() {
    onFiltersChange(local);
    setOpen(false);
  }

  const currentTab = FILTER_TABS.find(t => t.key === activeTab)!;
  const rawOptions = fo[currentTab.optionKey] || [];
  const filteredOptions = search
    ? rawOptions.filter(o => o.toLowerCase().includes(search.toLowerCase()))
    : rawOptions;

  const totalOptions = FILTER_TABS.reduce((sum, t) => sum + (fo[t.optionKey]?.length || 0), 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-md hover:border-primary/50 transition-colors bg-background text-foreground/70 hover:text-foreground">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full">
              {activeCount}
            </Badge>
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0 rounded-xl shadow-2xl border-0">
        {/* Header */}
        <div className="relative px-6 pr-14 pt-6 pb-5 bg-gradient-to-br from-primary/8 via-primary/4 to-transparent">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <SlidersHorizontal className="h-[18px] w-[18px] text-primary" />
                </div>
                <span className="text-lg font-semibold tracking-tight">Filters</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
                className={`text-xs rounded-lg gap-1.5 border-border hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive transition-all ${localCount > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
              >
                <X className="h-3 w-3" />
                Clear All
              </Button>
            </DialogTitle>
          </DialogHeader>

          {/* Search */}
          <div className="relative mt-4">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search filters..."
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-border bg-background/80 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 placeholder:text-muted-foreground transition-all"
            />
          </div>
        </div>

        {/* Category tags */}
        <div className="px-6 py-3.5 flex flex-wrap gap-2 border-b border-border/60 bg-muted/20">
          {FILTER_TABS.map((tab) => {
            const count = local[tab.filterKey].length;
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setSearch(''); }}
                className={`
                  inline-flex items-center gap-2 pl-3 pr-3.5 py-2 text-[13px] font-medium rounded-lg
                  transition-all duration-200 ease-out
                  ${isActive
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25 scale-[1.02]'
                    : count > 0
                      ? 'bg-primary/8 text-primary border border-primary/20 hover:bg-primary/15 hover:shadow-sm'
                      : 'bg-background text-muted-foreground border border-border hover:border-primary/30 hover:text-foreground hover:bg-background hover:shadow-sm'
                  }
                `}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-primary-foreground' : ''}`} />
                {tab.label}
                <span className={`
                  text-[10px] font-bold h-[18px] min-w-[18px] px-1 rounded-md
                  inline-flex items-center justify-center leading-none
                  ${count > 0
                    ? isActive
                      ? 'bg-primary-foreground/25 text-primary-foreground'
                      : 'bg-primary text-primary-foreground'
                    : 'opacity-0'
                  }
                `}>
                  {count || 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Options grid */}
        <div className="overflow-hidden px-6 py-4">
          <div
            className="overflow-y-auto h-[40vh] -mx-1 px-1 scrollbar-thin"
            onWheel={(e) => {
              const el = e.currentTarget;
              if (el.scrollHeight <= el.clientHeight) return;
              e.stopPropagation();
            }}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {filteredOptions.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Search className="h-8 w-8 mb-3 opacity-30" />
                  <p className="text-sm font-medium">No options found</p>
                  <p className="text-xs mt-1 opacity-70">Try a different search term</p>
                </div>
              )}
              {filteredOptions.map((opt) => {
                const isChecked = local[currentTab.filterKey].includes(opt);
                const IconComp = currentTab.type === 'amenity'
                  ? getIcon(opt, currentTab.amenityType!)
                  : currentTab.icon;
                return (
                  <label
                    key={opt}
                    className={`
                      group flex items-center gap-2.5 cursor-pointer py-3 px-3.5 rounded-xl border
                      transition-all duration-200 ease-out select-none
                      active:scale-[0.97]
                      ${isChecked
                        ? 'border-primary/50 bg-primary/6 shadow-sm shadow-primary/10'
                        : 'border-border/80 hover:border-primary/25 hover:bg-muted/50 hover:shadow-sm'
                      }
                    `}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggleArray(currentTab.filterKey, opt)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    {currentTab.type === 'amenity' && (
                      <IconComp className={`h-4 w-4 shrink-0 transition-colors ${isChecked ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground/60'}`} />
                    )}
                    <span className={`text-sm leading-tight transition-colors ${isChecked ? 'text-foreground font-medium' : 'text-foreground/80 group-hover:text-foreground'}`}>
                      {opt}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-border/60 bg-muted/20">
          <Button
            onClick={handleApply}
            className="px-8 h-10 rounded-lg font-semibold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/25 transition-all duration-200"
          >
            <Check className="h-4 w-4 mr-2" />
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
