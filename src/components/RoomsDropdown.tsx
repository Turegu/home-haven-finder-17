import { useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useFilterOptions } from '@/hooks/useFilterOptions';

const VISIBLE_COUNT = 8;

interface RoomsDropdownProps {
  value: string[];
  onChange: (v: string[]) => void;
  label?: string;
}

export default function RoomsDropdown({ value, onChange, label = 'Rooms' }: RoomsDropdownProps) {
  const { options: fo } = useFilterOptions("search");
  const roomOptions = fo["rooms"] || [];
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(false);

  const filtered = search
    ? roomOptions.filter(o => o.toLowerCase().includes(search.toLowerCase()))
    : roomOptions;

  // When searching, show all results; otherwise cap at VISIBLE_COUNT unless expanded
  const showAll = search.length > 0 || expanded;
  const visible = showAll ? filtered : filtered.slice(0, VISIBLE_COUNT);
  const hasMore = !search && filtered.length > VISIBLE_COUNT;

  function toggle(opt: string) {
    if (value.includes(opt)) {
      onChange(value.filter(v => v !== opt));
    } else {
      onChange([...value, opt]);
    }
  }

  return (
    <Popover onOpenChange={() => setExpanded(false)}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-md hover:border-primary/50 transition-colors bg-background min-w-[80px]">
          <span className={value.length > 0 ? 'text-foreground' : 'text-muted-foreground'}>
            {value.length > 0 ? value.join(', ') : label}
          </span>
          {value.length > 0 && (
            <Badge variant="default" className="h-4 min-w-[16px] p-0 flex items-center justify-center text-[10px] rounded-full ml-0.5">
              {value.length}
            </Badge>
          )}
          <ChevronDown className="h-3.5 w-3.5 ml-auto text-amber-500" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0" align="start">
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rooms..."
              className="w-full h-7 pl-7 pr-2 rounded border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <div className="p-1 space-y-0.5">
          {visible.map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer py-1.5 px-2 rounded hover:bg-muted transition-colors">
              <Checkbox checked={value.includes(opt)} onCheckedChange={() => toggle(opt)} />
              <span className="text-sm text-foreground">{opt}</span>
            </label>
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
              <>Show More ({filtered.length - VISIBLE_COUNT}) <ChevronDown className="h-3 w-3" /></>
            )}
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
