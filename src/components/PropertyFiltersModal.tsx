import { useState, useEffect } from 'react';
import {
  Search, SlidersHorizontal, ChevronRight, ChevronDown, ChevronUp,
  Building2, Car, Sofa, Calendar, TreePine, Lamp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';

import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import type { LucideIcon } from 'lucide-react';
import { useFilterOptions } from '@/hooks/useFilterOptions';

// Hardcoded fallbacks removed — all options now fetched dynamically from the database

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

interface PropertyFiltersModalProps {
  filters: PropertyMoreFilters;
  onFiltersChange: (filters: PropertyMoreFilters) => void;
}

export default function PropertyFiltersModal({ filters, onFiltersChange }: PropertyFiltersModalProps) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState<PropertyMoreFilters>(filters);
  const { options: fo } = useFilterOptions("search");

  // Sync local state when dialog opens
  useEffect(() => {
    if (open) setLocal(filters);
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
    setLocal(emptyMoreFilters);
  }

  function handleApply() {
    onFiltersChange(local);
    setOpen(false);
  }

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
      <DialogContent className="sm:max-w-[500px] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border bg-muted/30">
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

        {/* Filter dropdowns */}
        <div className="px-6 py-5 space-y-2.5">
          <FilterDropdown
            label="Floor Level"
            icon={Building2}
            options={fo["floor_level"] || []}
            selected={local.floorLevels}
            onToggle={(v) => toggleArray('floorLevels', v)}
          />
          <FilterDropdown
            label="Parking Space"
            icon={Car}
            options={fo["parking"] || []}
            selected={local.parkingSpaces}
            onToggle={(v) => toggleArray('parkingSpaces', v)}
          />
          <FilterDropdown
            label="Furniture"
            icon={Sofa}
            options={fo["furniture"] || []}
            selected={local.furniture}
            onToggle={(v) => toggleArray('furniture', v)}
          />
          <FilterDropdown
            label="Property Age"
            icon={Calendar}
            options={fo["property_age"] || []}
            selected={local.propertyAges}
            onToggle={(v) => toggleArray('propertyAges', v)}
          />
          <FilterDropdown
            label="Exterior Amenities"
            icon={TreePine}
            options={fo["exterior_amenities"] || []}
            selected={local.exteriorAmenities}
            onToggle={(v) => toggleArray('exteriorAmenities', v)}
            searchable
          />
          <FilterDropdown
            label="Interior Amenities"
            icon={Lamp}
            options={fo["interior_amenities"] || []}
            selected={local.interiorAmenities}
            onToggle={(v) => toggleArray('interiorAmenities', v)}
            searchable
          />
        </div>

        {/* Apply button */}
        <div className="px-6 py-4 border-t border-border bg-muted/30">
          <Button onClick={handleApply} className="w-full h-11 text-base font-semibold">
            Apply Filters
            {localCount > 0 && (
              <span className="ml-1.5 text-primary-foreground/80">({localCount})</span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Unified filter dropdown (with optional search) ─── */

const MODAL_VISIBLE_COUNT = 8;

function FilterDropdown({
  label,
  icon: Icon,
  options,
  selected,
  onToggle,
  searchable = false,
}: {
  label: string;
  icon: LucideIcon;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  searchable?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(false);
  const filtered = search
    ? options.filter(o => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  const showAll = search.length > 0 || expanded;
  const visible = showAll ? filtered : filtered.slice(0, MODAL_VISIBLE_COUNT);
  const hasMore = !search && filtered.length > MODAL_VISIBLE_COUNT;
  const hasSelected = selected.length > 0;

  return (
    <Popover onOpenChange={() => { setExpanded(false); setSearch(''); }}>
      <PopoverTrigger asChild>
        <button
          className={`group flex items-center justify-between w-full px-3.5 py-3 text-sm rounded-lg border transition-all duration-150 ${
            hasSelected
              ? 'border-primary/40 bg-primary/5'
              : 'border-border bg-background hover:border-primary/30 hover:bg-muted/40'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <Icon className={`h-4 w-4 ${hasSelected ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`font-medium ${hasSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
              {label}
            </span>
            {hasSelected && (
              <Badge variant="default" className="h-5 min-w-[20px] px-1.5 flex items-center justify-center text-[10px] rounded-full">
                {selected.length}
              </Badge>
            )}
          </span>
          <ChevronRight className="h-4 w-4 text-amber-500 transition-transform group-data-[state=open]:rotate-90" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start" sideOffset={6}>
        {searchable && (
          <div className="p-2.5 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}...`}
                className="w-full h-8 pl-8 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
              />
            </div>
          </div>
        )}

        <div className="p-1.5 space-y-0.5">
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground px-2 py-4 text-center">No results found</p>
          )}
          {visible.map((opt) => {
            const isChecked = selected.includes(opt);
            return (
              <label
                key={opt}
                className={`flex items-center gap-2.5 cursor-pointer py-2 px-2.5 rounded-md transition-colors ${
                  isChecked ? 'bg-primary/5' : 'hover:bg-muted'
                }`}
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => onToggle(opt)}
                />
                <span className={`text-sm ${isChecked ? 'text-foreground font-medium' : 'text-foreground'}`}>
                  {opt}
                </span>
              </label>
            );
          })}
        </div>

        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-center gap-1 w-full py-2 text-xs font-medium text-primary hover:bg-muted/50 border-t border-border transition-colors"
          >
            {expanded ? (
              <>Show Less <ChevronUp className="h-3 w-3" /></>
            ) : (
              <>Show More ({filtered.length - MODAL_VISIBLE_COUNT}) <ChevronDown className="h-3 w-3" /></>
            )}
          </button>
        )}

        {selected.length > 0 && (
          <div className="px-3 py-2 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-primary">{selected.length}</span> selected
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
