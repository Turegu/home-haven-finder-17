import { useState, useEffect } from 'react';
import {
  Search, SlidersHorizontal, Check, X,
  Building2, Car, Sofa, Calendar, TreePine, Lamp,
  Home, BedDouble, Bath, DollarSign, Ruler, Clock,
} from 'lucide-react';
import { getIcon } from '@/components/AmenitiesViewAllDialog';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useFilterOptions } from '@/hooks/useFilterOptions';

/* ─── Types ─── */

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

export interface BasicFilters {
  propertyTypes: string[];
  rooms: string[];
  bathrooms: string[];
  rentDuration: string[];
}

export interface RangeFilters {
  minPrice: string;
  maxPrice: string;
  minArea: string;
  maxArea: string;
}

export const emptyBasicFilters: BasicFilters = {
  propertyTypes: [],
  rooms: [],
  bathrooms: [],
  rentDuration: [],
};

export const emptyRangeFilters: RangeFilters = {
  minPrice: '',
  maxPrice: '',
  minArea: '',
  maxArea: '',
};

/* ─── Tab definitions ─── */

interface FilterTab {
  key: string;
  label: string;
  icon: React.ElementType;
  section: 'essential' | 'advanced';
  basicKey?: keyof BasicFilters;
  filterKey?: keyof PropertyMoreFilters;
  optionKey: string;
  type: 'simple' | 'amenity' | 'range';
  amenityType?: 'interior' | 'exterior';
  rangeKey?: 'price' | 'area';
}

const FILTER_TABS: FilterTab[] = [
  // Essential
  { key: 'type', label: 'Property Type', icon: Home, section: 'essential', basicKey: 'propertyTypes', optionKey: '_property_types_combined', type: 'simple' },
  { key: 'price', label: 'Price', icon: DollarSign, section: 'essential', optionKey: '', type: 'range', rangeKey: 'price' },
  { key: 'area', label: 'Area', icon: Ruler, section: 'essential', optionKey: '', type: 'range', rangeKey: 'area' },
  { key: 'rooms', label: 'Rooms', icon: BedDouble, section: 'essential', basicKey: 'rooms', optionKey: 'rooms', type: 'simple' },
  { key: 'bathrooms', label: 'Bathrooms', icon: Bath, section: 'essential', basicKey: 'bathrooms', optionKey: 'bathrooms', type: 'simple' },
  { key: 'rentDuration', label: 'Rent Duration', icon: Clock, section: 'essential', basicKey: 'rentDuration', optionKey: 'rent_duration', type: 'simple' },
  // Advanced
  { key: 'floor', label: 'Floor Level', icon: Building2, section: 'advanced', filterKey: 'floorLevels', optionKey: 'floor_level', type: 'simple' },
  { key: 'parking', label: 'Parking', icon: Car, section: 'advanced', filterKey: 'parkingSpaces', optionKey: 'parking', type: 'simple' },
  { key: 'furniture', label: 'Furniture', icon: Sofa, section: 'advanced', filterKey: 'furniture', optionKey: 'furniture', type: 'simple' },
  { key: 'age', label: 'Property Age', icon: Calendar, section: 'advanced', filterKey: 'propertyAges', optionKey: 'property_age', type: 'simple' },
  { key: 'interior', label: 'Interior Amenities', icon: Lamp, section: 'advanced', filterKey: 'interiorAmenities', optionKey: 'interior_amenities', type: 'amenity', amenityType: 'interior' },
  { key: 'exterior', label: 'Exterior Amenities', icon: TreePine, section: 'advanced', filterKey: 'exteriorAmenities', optionKey: 'exterior_amenities', type: 'amenity', amenityType: 'exterior' },
];

/* ─── Props ─── */

interface PropertyFiltersModalProps {
  filters: PropertyMoreFilters;
  onFiltersChange: (filters: PropertyMoreFilters) => void;
  basicFilters?: BasicFilters;
  onBasicFiltersChange?: (filters: BasicFilters) => void;
  rangeFilters?: RangeFilters;
  onRangeFiltersChange?: (filters: RangeFilters) => void;
  onClearAll?: () => void;
  isRent?: boolean;
}

export default function PropertyFiltersModal({
  filters, onFiltersChange,
  basicFilters, onBasicFiltersChange,
  rangeFilters, onRangeFiltersChange,
  onClearAll, isRent,
}: PropertyFiltersModalProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('type');
  const [search, setSearch] = useState('');
  const [localMore, setLocalMore] = useState<PropertyMoreFilters>(filters);
  const [localBasic, setLocalBasic] = useState<BasicFilters>(basicFilters ?? emptyBasicFilters);
  const [localRange, setLocalRange] = useState<RangeFilters>(rangeFilters ?? emptyRangeFilters);
  const { options: fo } = useFilterOptions("search");

  // Combine property type lists into a virtual key
  const allOptions: Record<string, string[]> = {
    ...fo,
    '_property_types_combined': [
      ...(fo['residential_property_types'] || []),
      ...(fo['commercial_property_types'] || []),
    ],
  };

  useEffect(() => {
    if (open) {
      setLocalMore(filters);
      setLocalBasic(basicFilters ?? emptyBasicFilters);
      setLocalRange(rangeFilters ?? emptyRangeFilters);
      setSearch('');
    }
  }, [open, filters, basicFilters, rangeFilters]);

  // Visible tabs: hide rentDuration if not rent mode
  const visibleTabs = FILTER_TABS.filter(t => {
    if (t.key === 'rentDuration' && !isRent) return false;
    return true;
  });

  const essentialTabs = visibleTabs.filter(t => t.section === 'essential');
  const advancedTabs = visibleTabs.filter(t => t.section === 'advanced');

  // Count helpers
  function getTabCount(tab: FilterTab): number {
    if (tab.type === 'range' && tab.rangeKey === 'price') return (localRange.minPrice || localRange.maxPrice) ? 1 : 0;
    if (tab.type === 'range' && tab.rangeKey === 'area') return (localRange.minArea || localRange.maxArea) ? 1 : 0;
    if (tab.section === 'essential' && tab.basicKey) return localBasic[tab.basicKey].length;
    if (tab.section === 'advanced' && tab.filterKey) return localMore[tab.filterKey].length;
    return 0;
  }

  const totalActiveCount = visibleTabs.reduce((s, t) => s + getTabCount(t), 0);
  const committedCount = (() => {
    const b = basicFilters ?? emptyBasicFilters;
    const r = rangeFilters ?? emptyRangeFilters;
    const m = filters;
    let c = b.propertyTypes.length + b.rooms.length + b.bathrooms.length + b.rentDuration.length +
      m.floorLevels.length + m.parkingSpaces.length + m.furniture.length + m.propertyAges.length +
      m.exteriorAmenities.length + m.interiorAmenities.length;
    if (r.minPrice || r.maxPrice) c++;
    if (r.minArea || r.maxArea) c++;
    return c;
  })();

  function toggleValue(tab: FilterTab, value: string) {
    if (tab.section === 'essential' && tab.basicKey) {
      const key = tab.basicKey;
      const current = localBasic[key];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      setLocalBasic({ ...localBasic, [key]: updated });
    } else if (tab.section === 'advanced' && tab.filterKey) {
      const key = tab.filterKey;
      const current = localMore[key];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      setLocalMore({ ...localMore, [key]: updated });
    }
  }

  function isChecked(tab: FilterTab, value: string): boolean {
    if (tab.section === 'essential' && tab.basicKey) return localBasic[tab.basicKey].includes(value);
    if (tab.section === 'advanced' && tab.filterKey) return localMore[tab.filterKey].includes(value);
    return false;
  }

  function clearAll() {
    setLocalMore(emptyMoreFilters);
    setLocalBasic(emptyBasicFilters);
    setLocalRange(emptyRangeFilters);
    onFiltersChange(emptyMoreFilters);
    onBasicFiltersChange?.(emptyBasicFilters);
    onRangeFiltersChange?.(emptyRangeFilters);
    onClearAll?.();
  }

  function handleApply() {
    onFiltersChange(localMore);
    onBasicFiltersChange?.(localBasic);
    onRangeFiltersChange?.(localRange);
    setOpen(false);
  }

  // Get options for current tab
  const currentTab = visibleTabs.find(t => t.key === activeTab) ?? visibleTabs[0];
  const rawOptions = allOptions[currentTab.optionKey] || [];
  const filteredOptions = search
    ? rawOptions.filter(o => o.toLowerCase().includes(search.toLowerCase()))
    : rawOptions;

  function renderTabButton(tab: FilterTab) {
    const count = getTabCount(tab);
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
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-md hover:border-primary/50 transition-colors bg-background text-foreground/70 hover:text-foreground">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {committedCount > 0 && (
            <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full">
              {committedCount}
            </Badge>
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0 rounded-xl shadow-2xl border-0">
        {/* Header */}
        <div className="relative px-6 pr-14 pt-6 pb-5 bg-gradient-to-br from-primary/8 via-primary/4 to-transparent">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <SlidersHorizontal className="h-[18px] w-[18px] text-primary" />
                </div>
                <span className="text-lg font-semibold tracking-tight">All Filters</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
                className={`text-xs rounded-lg gap-1.5 border-border hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive transition-all ${totalActiveCount > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
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

        {/* Category tags with sections */}
        <div className="px-6 py-3 border-b border-border/60 bg-muted/20 space-y-2.5">
          {/* Essential filters */}
          <div className="flex flex-wrap gap-2">
            {essentialTabs.map(renderTabButton)}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">Advanced</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          </div>

          {/* Advanced filters */}
          <div className="flex flex-wrap gap-2">
            {advancedTabs.map(renderTabButton)}
          </div>
        </div>

        {/* Options content */}
        <div className="overflow-hidden px-6 py-4">
          <div
            className="overflow-y-auto h-[38vh] -mx-1 px-1 scrollbar-thin"
            onWheel={(e) => {
              const el = e.currentTarget;
              if (el.scrollHeight <= el.clientHeight) return;
              e.stopPropagation();
            }}
          >
            {/* Range inputs for Price / Area */}
            {currentTab.type === 'range' && currentTab.rangeKey === 'price' && (
              <div className="pt-6 pb-4 px-2">
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-6 max-w-md mx-auto">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">Price Range</p>
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Minimum</label>
                      <input
                        type="number"
                        value={localRange.minPrice}
                        onChange={(e) => setLocalRange({ ...localRange, minPrice: e.target.value })}
                        placeholder="0"
                        className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                      />
                    </div>
                    <div className="pb-3">
                      <div className="w-6 h-px bg-border" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Maximum</label>
                      <input
                        type="number"
                        value={localRange.maxPrice}
                        onChange={(e) => setLocalRange({ ...localRange, maxPrice: e.target.value })}
                        placeholder="No limit"
                        className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentTab.type === 'range' && currentTab.rangeKey === 'area' && (
              <div className="pt-6 pb-4 px-2">
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-6 max-w-md mx-auto">
                  <div className="flex items-center gap-2.5 mb-5">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Ruler className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">Area Range <span className="text-muted-foreground font-normal">(m²)</span></p>
                  </div>
                  <div className="flex items-end gap-3">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Minimum</label>
                      <input
                        type="number"
                        value={localRange.minArea}
                        onChange={(e) => setLocalRange({ ...localRange, minArea: e.target.value })}
                        placeholder="0"
                        className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                      />
                    </div>
                    <div className="pb-3">
                      <div className="w-6 h-px bg-border" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Maximum</label>
                      <input
                        type="number"
                        value={localRange.maxArea}
                        onChange={(e) => setLocalRange({ ...localRange, maxArea: e.target.value })}
                        placeholder="No limit"
                        className="w-full h-11 px-3.5 rounded-xl border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Checkbox grid for non-range tabs */}
            {currentTab.type !== 'range' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {filteredOptions.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Search className="h-8 w-8 mb-3 opacity-30" />
                    <p className="text-sm font-medium">No options found</p>
                    <p className="text-xs mt-1 opacity-70">Try a different search term</p>
                  </div>
                )}
                {filteredOptions.map((opt) => {
                  const checked = isChecked(currentTab, opt);
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
                        ${checked
                          ? 'border-primary/50 bg-primary/6 shadow-sm shadow-primary/10'
                          : 'border-border/80 hover:border-primary/25 hover:bg-muted/50 hover:shadow-sm'
                        }
                      `}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleValue(currentTab, opt)}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      {currentTab.type === 'amenity' && (
                        <IconComp className={`h-4 w-4 shrink-0 transition-colors ${checked ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground/60'}`} />
                      )}
                      <span className={`text-sm leading-tight transition-colors ${checked ? 'text-foreground font-medium' : 'text-foreground/80 group-hover:text-foreground'}`}>
                        {opt}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
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
