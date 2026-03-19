import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useFilterOptions } from '@/hooks/useFilterOptions';

interface PropertyTypeDropdownProps {
  selected: string[];
  onChange: (types: string[]) => void;
  showRentTypes?: boolean;
}

export default function PropertyTypeDropdown({ selected, onChange }: PropertyTypeDropdownProps) {
  const [activeTab, setActiveTab] = useState<'residential' | 'commercial'>('residential');
  const [open, setOpen] = useState(false);
  const { options: fo } = useFilterOptions("search");
  const residentialTypes = fo["residential_property_types"] || [];
  const commercialTypes = fo["commercial_property_types"] || [];

  const types = activeTab === 'residential' ? residentialTypes : commercialTypes;

  function toggleType(type: string) {
    if (selected.includes(type)) {
      onChange(selected.filter(t => t !== type));
    } else {
      onChange([...selected, type]);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-md hover:border-primary/50 transition-colors bg-background min-w-[140px]">
          <span className={selected.length > 0 ? 'text-foreground' : 'text-muted-foreground'}>
            {selected.length > 0 ? `${selected.length} selected` : 'Property Type'}
          </span>
          <ChevronDown className="h-3.5 w-3.5 ml-auto text-amber-500" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('residential')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === 'residential'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Residential
          </button>
          <button
            onClick={() => setActiveTab('commercial')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === 'commercial'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Commercial
          </button>
        </div>
        <div
          className="overflow-y-auto max-h-[280px] p-1 space-y-0.5"
          onWheel={(e) => {
            const el = e.currentTarget;
            if (el.scrollHeight <= el.clientHeight) return;
            e.preventDefault();
            e.stopPropagation();
            el.scrollTop += e.deltaY;
          }}
        >
          {types.map((type) => (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${
                selected.includes(type)
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
