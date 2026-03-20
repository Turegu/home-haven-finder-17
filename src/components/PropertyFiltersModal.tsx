import { useState, useEffect } from 'react';
import {
  Search, SlidersHorizontal, Check,
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
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              <span className="text-lg">Filters</span>
              {localCount > 0 && (
                <Badge variant="default" className="text-[11px] px-2 py-0.5 rounded-full">
                  {localCount}
                </Badge>
              )}
            </div>
            {localCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10">
                Clear All
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="px-6 pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search filters..."
              className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Category tags */}
        <div className="px-6 py-2 flex flex-wrap gap-2">
          {FILTER_TABS.map((tab) => {
            const count = local[tab.filterKey].length;
            const isActive = activeTab === tab.key;
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setSearch(''); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border transition-all duration-150 ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary'
                    : count > 0
                      ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
                      : 'bg-background text-muted-foreground border-border hover:border-primary/30 hover:text-foreground'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
                <span className={`text-[10px] font-semibold h-4 min-w-[16px] px-1 rounded-full inline-flex items-center justify-center ${
                  count > 0
                    ? isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-primary text-primary-foreground'
                    : 'opacity-0'
                }`}>
                  {count || 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* Options grid */}
        <div className="overflow-hidden px-6 pb-2">
          <div
            className="overflow-y-auto h-[40vh] -mx-1 px-1"
            onWheel={(e) => {
              const el = e.currentTarget;
              if (el.scrollHeight <= el.clientHeight) return;
              e.stopPropagation();
            }}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filteredOptions.length === 0 && (
                <p className="col-span-full text-sm text-muted-foreground text-center py-8">No options found</p>
              )}
              {filteredOptions.map((opt) => {
                const isChecked = local[currentTab.filterKey].includes(opt);
                const IconComp = currentTab.type === 'amenity'
                  ? getIcon(opt, currentTab.amenityType!)
                  : currentTab.icon;
                return (
                  <label
                    key={opt}
                    className={`flex items-center gap-2.5 cursor-pointer py-2.5 px-3 rounded-lg border transition-all duration-150 ${
                      isChecked
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border hover:border-primary/20 hover:bg-muted/40'
                    }`}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggleArray(currentTab.filterKey, opt)}
                    />
                    {currentTab.type === 'amenity' && (
                      <IconComp className={`h-4 w-4 shrink-0 ${isChecked ? 'text-primary' : 'text-muted-foreground'}`} />
                    )}
                    <span className={`text-sm leading-tight ${isChecked ? 'text-foreground font-medium' : 'text-foreground'}`}>
                      {opt}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-primary">{localCount}</span> of {totalOptions} selected
          </p>
          <Button onClick={handleApply} className="px-6">
            <Check className="h-4 w-4 mr-1.5" />
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
