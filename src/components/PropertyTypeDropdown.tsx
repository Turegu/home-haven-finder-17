import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFilterOptions } from '@/hooks/useFilterOptions';

const VISIBLE_COUNT = 8;

interface PropertyTypeDropdownProps {
  selected: string[];
  onChange: (types: string[]) => void;
  showRentTypes?: boolean;
}

export default function PropertyTypeDropdown({ selected, onChange }: PropertyTypeDropdownProps) {
  const [activeTab, setActiveTab] = useState<'residential' | 'commercial'>('residential');
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { options: fo } = useFilterOptions("search");
  const residentialTypes = fo["residential_property_types"] || [];
  const commercialTypes = fo["commercial_property_types"] || [];

  const types = activeTab === 'residential' ? residentialTypes : commercialTypes;
  const visible = expanded ? types : types.slice(0, VISIBLE_COUNT);
  const hasMore = types.length > VISIBLE_COUNT;

  function toggleType(type: string) {
    if (selected.includes(type)) {
      onChange(selected.filter(t => t !== type));
    } else {
      onChange([...selected, type]);
    }
  }

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setExpanded(false); }}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-md hover:border-primary/50 transition-colors bg-background min-w-[140px]">
          <span className={selected.length > 0 ? 'text-foreground' : 'text-muted-foreground'}>
            {selected.length > 0 ? `${selected.length} selected` : 'Property Type'}
          </span>
          <ChevronDown className="h-3.5 w-3.5 ml-auto text-amber-500" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        {/* Residential / Commercial tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => { setActiveTab('residential'); setExpanded(false); }}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === 'residential'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Residential
          </button>
          <button
            onClick={() => { setActiveTab('commercial'); setExpanded(false); }}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === 'commercial'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Commercial
          </button>
        </div>
        <div className="p-1 space-y-0.5">
          {visible.map((type) => (
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
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-center gap-1 w-full py-2 text-xs font-medium text-primary hover:bg-muted/50 border-t border-border transition-colors"
          >
            {expanded ? (
              <>Show Less <ChevronUp className="h-3 w-3" /></>
            ) : (
              <>Show More ({types.length - VISIBLE_COUNT}) <ChevronDown className="h-3 w-3" /></>
            )}
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
