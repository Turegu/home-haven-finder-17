import { useState, useEffect } from 'react';
import {
  Search, SlidersHorizontal, ChevronRight, Check,
  Building2, Car, Sofa, Calendar, TreePine, Lamp,
} from 'lucide-react';
import { getIcon } from '@/components/AmenitiesViewAllDialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
  const [amenitiesOpen, setAmenitiesOpen] = useState(false);
  const [amenitySearch, setAmenitySearch] = useState('');
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
          {/* Single Amenities button that opens tabbed dialog */}
          <button
            type="button"
            onClick={() => setAmenitiesOpen(true)}
            className={`group flex items-center justify-between w-full px-3.5 py-3 text-sm rounded-lg border transition-all duration-150 ${
              (local.exteriorAmenities.length + local.interiorAmenities.length) > 0
                ? 'border-primary/40 bg-primary/5'
                : 'border-border bg-background hover:border-primary/30 hover:bg-muted/40'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <TreePine className={`h-4 w-4 ${(local.exteriorAmenities.length + local.interiorAmenities.length) > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`font-medium ${(local.exteriorAmenities.length + local.interiorAmenities.length) > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                Amenities
              </span>
              {(local.exteriorAmenities.length + local.interiorAmenities.length) > 0 && (
                <Badge variant="default" className="h-5 min-w-[20px] px-1.5 flex items-center justify-center text-[10px] rounded-full">
                  {local.exteriorAmenities.length + local.interiorAmenities.length}
                </Badge>
              )}
            </span>
            <ChevronRight className="h-4 w-4 text-amber-500" />
          </button>
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

      {/* Amenities tabbed dialog */}
      <Dialog open={amenitiesOpen} onOpenChange={(v) => { setAmenitiesOpen(v); if (!v) setAmenitySearch(''); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TreePine className="h-5 w-5 text-primary" />
              Amenities
              {(local.exteriorAmenities.length + local.interiorAmenities.length) > 0 && (
                <Badge variant="default" className="ml-2">{local.exteriorAmenities.length + local.interiorAmenities.length} selected</Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={amenitySearch}
              onChange={(e) => setAmenitySearch(e.target.value)}
              placeholder="Search amenities..."
              className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>

          <Tabs defaultValue="interior" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="interior" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Lamp className="h-4 w-4" />
                Interior
                {local.interiorAmenities.length > 0 && (
                  <Badge variant="secondary" className="h-5 min-w-[20px] px-1 text-[10px] rounded-full">{local.interiorAmenities.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="exterior" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <TreePine className="h-4 w-4" />
                Exterior
                {local.exteriorAmenities.length > 0 && (
                  <Badge variant="secondary" className="h-5 min-w-[20px] px-1 text-[10px] rounded-full">{local.exteriorAmenities.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="interior" className="flex-1 overflow-hidden mt-3">
              <div
                className="overflow-y-auto h-full max-h-[45vh] -mx-1 px-1"
                onWheel={(e) => { const el = e.currentTarget; if (el.scrollHeight <= el.clientHeight) return; e.stopPropagation(); }}
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(fo["interior_amenities"] || []).filter(o => o.toLowerCase().includes(amenitySearch.toLowerCase())).length === 0 && (
                    <p className="col-span-full text-sm text-muted-foreground text-center py-8">No amenities found</p>
                  )}
                  {(fo["interior_amenities"] || []).filter(o => o.toLowerCase().includes(amenitySearch.toLowerCase())).map((opt) => {
                    const IconComp = getIcon(opt, 'interior');
                    const isChecked = local.interiorAmenities.includes(opt);
                    return (
                      <label
                        key={opt}
                        className={`flex items-center gap-2.5 cursor-pointer py-2.5 px-3 rounded-lg border transition-all duration-150 ${
                          isChecked ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-primary/20 hover:bg-muted/40'
                        }`}
                      >
                        <Checkbox checked={isChecked} onCheckedChange={() => toggleArray('interiorAmenities', opt)} />
                        <IconComp className={`h-4 w-4 shrink-0 ${isChecked ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className={`text-sm leading-tight ${isChecked ? 'text-foreground font-medium' : 'text-foreground'}`}>{opt}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="exterior" className="flex-1 overflow-hidden mt-3">
              <div
                className="overflow-y-auto h-full max-h-[45vh] -mx-1 px-1"
                onWheel={(e) => { const el = e.currentTarget; if (el.scrollHeight <= el.clientHeight) return; e.stopPropagation(); }}
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(fo["exterior_amenities"] || []).filter(o => o.toLowerCase().includes(amenitySearch.toLowerCase())).length === 0 && (
                    <p className="col-span-full text-sm text-muted-foreground text-center py-8">No amenities found</p>
                  )}
                  {(fo["exterior_amenities"] || []).filter(o => o.toLowerCase().includes(amenitySearch.toLowerCase())).map((opt) => {
                    const IconComp = getIcon(opt, 'exterior');
                    const isChecked = local.exteriorAmenities.includes(opt);
                    return (
                      <label
                        key={opt}
                        className={`flex items-center gap-2.5 cursor-pointer py-2.5 px-3 rounded-lg border transition-all duration-150 ${
                          isChecked ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-primary/20 hover:bg-muted/40'
                        }`}
                      >
                        <Checkbox checked={isChecked} onCheckedChange={() => toggleArray('exteriorAmenities', opt)} />
                        <IconComp className={`h-4 w-4 shrink-0 ${isChecked ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className={`text-sm leading-tight ${isChecked ? 'text-foreground font-medium' : 'text-foreground'}`}>{opt}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-between pt-3 border-t border-border mt-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-primary">{local.exteriorAmenities.length + local.interiorAmenities.length}</span> of {(fo["exterior_amenities"] || []).length + (fo["interior_amenities"] || []).length} selected
            </p>
            <Button onClick={() => { setAmenitiesOpen(false); setAmenitySearch(''); }}>
              <Check className="h-4 w-4 mr-1.5" />
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
