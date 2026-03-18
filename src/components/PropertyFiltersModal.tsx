import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const floorLevels = [
  'Any', 'Ground', 'Garden floor', '1', '2', '3 - 5', '6 - 10',
  '10-20', '20+', 'Top floor', 'Basement', 'Mezzanine', 'Penthouse',
  'High entrance', 'Semi Basement', 'Direct entrance',
];

const parkingSpaces = ['Any', '1', '2', '3', '4', '5', '6+'];

const furnitureOptions = ['Any', 'Fully Furnished', 'Unfurnished', 'Partially Furnished'];

const propertyAges = ['Any', 'New', '1-5 Years', '6-10 Years', '11-15 Years', '16-20 Years', '21+'];

const exteriorAmenities = [
  'Close to gym', 'Close to the city center',
  'Close to restaurants and cafes', 'Close to the beach',
];

interface PropertyFiltersModalProps {
  filters: Record<string, string>;
  onFiltersChange: (filters: Record<string, string>) => void;
}

export default function PropertyFiltersModal({ filters, onFiltersChange }: PropertyFiltersModalProps) {
  const activeCount = Object.values(filters).filter(v => v && v !== 'Any').length;

  function setFilter(key: string, value: string) {
    onFiltersChange({ ...filters, [key]: value });
  }

  function clearAll() {
    onFiltersChange({});
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
      <DialogContent className="sm:max-w-[480px] max-h-[85vh] flex flex-col p-0">
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
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-6">
            {/* Floor Level */}
            <FilterChipGroup
              label="Floor Level"
              options={floorLevels}
              selected={filters.floorLevel || ''}
              onSelect={(v) => setFilter('floorLevel', v)}
            />

            {/* Parking Space */}
            <FilterChipGroup
              label="Parking Space"
              options={parkingSpaces}
              selected={filters.parkingSpace || ''}
              onSelect={(v) => setFilter('parkingSpace', v)}
            />

            {/* Furniture */}
            <FilterChipGroup
              label="Furniture"
              options={furnitureOptions}
              selected={filters.furniture || ''}
              onSelect={(v) => setFilter('furniture', v)}
            />

            {/* Property Age */}
            <FilterChipGroup
              label="Property Age"
              options={propertyAges}
              selected={filters.propertyAge || ''}
              onSelect={(v) => setFilter('propertyAge', v)}
            />

            {/* Exterior Amenities */}
            <FilterChipGroup
              label="Exterior Amenities"
              options={exteriorAmenities}
              selected={filters.exteriorAmenity || ''}
              onSelect={(v) => setFilter('exteriorAmenity', v)}
              multi
              multiSelected={filters.exteriorAmenities ? filters.exteriorAmenities.split(',') : []}
              onMultiSelect={(arr) => setFilter('exteriorAmenities', arr.join(','))}
            />
          </div>
        </ScrollArea>
        <div className="px-6 py-4 border-t border-border">
          <Button className="w-full" size="lg">
            Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FilterChipGroup({
  label,
  options,
  selected,
  onSelect,
  multi,
  multiSelected,
  onMultiSelect,
}: {
  label: string;
  options: string[];
  selected: string;
  onSelect: (v: string) => void;
  multi?: boolean;
  multiSelected?: string[];
  onMultiSelect?: (v: string[]) => void;
}) {
  if (multi && multiSelected && onMultiSelect) {
    return (
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-2">{label}</h4>
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                if (multiSelected.includes(opt)) {
                  onMultiSelect(multiSelected.filter(v => v !== opt));
                } else {
                  onMultiSelect([...multiSelected, opt]);
                }
              }}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                multiSelected.includes(opt)
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-foreground hover:border-primary/50'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground mb-2">{label}</h4>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              selected === opt
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-foreground hover:border-primary/50'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
