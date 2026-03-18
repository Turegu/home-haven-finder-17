import { useState } from 'react';
import { Search, SlidersHorizontal, ChevronDown, Building2, Car, Sofa, Calendar, TreePine, Lamp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { LucideIcon } from 'lucide-react';

const floorLevels = [
  'Ground', 'Garden floor', '1', '2', '3 - 5', '6 - 10',
  '10-20', '20+', 'Top floor', 'Basement', 'Mezzanine', 'Penthouse',
  'High entrance', 'Semi Basement', 'Direct entrance',
];

const parkingSpaces = ['1', '2', '3', '4', '5', '6+'];

const furnitureOptions = ['Fully Furnished', 'Unfurnished', 'Partially Furnished'];

const propertyAges = ['New', '1-5 Years', '6-10 Years', '11-15 Years', '16-20 Years', '21+'];

const defaultExteriorAmenities = [
  'Close to gym', 'Close to the city center',
  'Close to restaurants and cafes', 'Close to the beach',
  'Close to schools', 'Close to a park', 'Close to public transport',
  'Beach nearby', 'Beachfront', 'Private beach', 'Beach access',
  'Swimming pool', 'Garden', 'Playground', 'BBQ area',
];

const defaultInteriorAmenities = [
  'Central heating', 'Air conditioning', 'Fireplace', 'Built-in wardrobe',
  'Walk-in closet', 'Kitchen appliances', 'Laundry room', 'Smart home system',
  'Jacuzzi', 'Sauna', 'Shower cabin', 'Bathtub',
  'Generator', 'Security Camera', 'Security', 'Card Access System',
  'Elevator', 'Fire Lift', 'Metal Detector',
];

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
  const activeCount =
    filters.floorLevels.length + filters.parkingSpaces.length +
    filters.furniture.length + filters.propertyAges.length +
    filters.exteriorAmenities.length + filters.interiorAmenities.length;

  function toggleArray(key: keyof PropertyMoreFilters, value: string) {
    const current = filters[key];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, [key]: updated });
  }

  function clearAll() {
    onFiltersChange(emptyMoreFilters);
  }

  return (
    <Dialog>
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
      <DialogContent className="sm:max-w-[480px] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="flex items-center justify-between">
            <span>Filters</span>
            {activeCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs text-destructive">
                Clear All
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 py-4 space-y-3">
          <FilterDropdown
            label="Floor Level"
            icon={Building2}
            options={floorLevels}
            selected={filters.floorLevels}
            onToggle={(v) => toggleArray('floorLevels', v)}
          />
          <FilterDropdown
            label="Parking Space"
            icon={Car}
            options={parkingSpaces}
            selected={filters.parkingSpaces}
            onToggle={(v) => toggleArray('parkingSpaces', v)}
          />
          <FilterDropdown
            label="Furniture"
            icon={Sofa}
            options={furnitureOptions}
            selected={filters.furniture}
            onToggle={(v) => toggleArray('furniture', v)}
          />
          <FilterDropdown
            label="Property Age"
            icon={Calendar}
            options={propertyAges}
            selected={filters.propertyAges}
            onToggle={(v) => toggleArray('propertyAges', v)}
          />
          <SearchableFilterDropdown
            label="Exterior Amenities"
            icon={TreePine}
            options={defaultExteriorAmenities}
            selected={filters.exteriorAmenities}
            onToggle={(v) => toggleArray('exteriorAmenities', v)}
          />
          <SearchableFilterDropdown
            label="Interior Amenities"
            icon={Lamp}
            options={defaultInteriorAmenities}
            selected={filters.interiorAmenities}
            onToggle={(v) => toggleArray('interiorAmenities', v)}
          />
        </div>
        <div className="px-6 py-4 border-t border-border">
          <Button className="w-full" size="lg">
            Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FilterDropdown({
  label,
  icon: Icon,
  options,
  selected,
  onToggle,
}: {
  label: string;
  icon: LucideIcon;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center justify-between w-full px-3 py-2.5 text-sm border border-border rounded-md bg-background hover:border-primary/50 transition-colors">
          <span className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className={selected.length > 0 ? 'text-foreground' : 'text-muted-foreground'}>
              {label}
            </span>
            {selected.length > 0 && (
              <Badge variant="default" className="h-5 min-w-[20px] px-1.5 flex items-center justify-center text-[10px] rounded-full">
                {selected.length}
              </Badge>
            )}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-1" align="start">
        <ScrollArea className="max-h-[220px]">
          <div className="space-y-0.5">
            {options.map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer py-1.5 px-2 rounded hover:bg-muted transition-colors">
                <Checkbox
                  checked={selected.includes(opt)}
                  onCheckedChange={() => onToggle(opt)}
                />
                <span className="text-sm text-foreground">{opt}</span>
              </label>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function SearchableFilterDropdown({
  label,
  icon: Icon,
  options,
  selected,
  onToggle,
}: {
  label: string;
  icon: LucideIcon;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  const [search, setSearch] = useState('');

  const filtered = search
    ? options.filter(o => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center justify-between w-full px-3 py-2.5 text-sm border border-border rounded-md bg-background hover:border-primary/50 transition-colors">
          <span className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className={selected.length > 0 ? 'text-foreground' : 'text-muted-foreground'}>
              {label}
            </span>
            {selected.length > 0 && (
              <Badge variant="default" className="h-5 min-w-[20px] px-1.5 flex items-center justify-center text-[10px] rounded-full">
                {selected.length}
              </Badge>
            )}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}...`}
              className="w-full h-8 pl-7 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <ScrollArea className="max-h-[200px]">
          <div className="p-1 space-y-0.5">
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground px-2 py-3 text-center">No results found</p>
            )}
            {filtered.map((opt) => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer py-1.5 px-2 rounded hover:bg-muted transition-colors">
                <Checkbox
                  checked={selected.includes(opt)}
                  onCheckedChange={() => onToggle(opt)}
                />
                <span className="text-sm text-foreground">{opt}</span>
              </label>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
