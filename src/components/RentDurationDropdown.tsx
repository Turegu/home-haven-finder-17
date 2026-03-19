import { ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useFilterOptions } from '@/hooks/useFilterOptions';

interface RentDurationDropdownProps {
  value: string[];
  onChange: (v: string[]) => void;
}

export default function RentDurationDropdown({ value, onChange }: RentDurationDropdownProps) {
  const { options: fo } = useFilterOptions("search");
  const durationOptions = fo["rent_duration"] || [];

  function toggle(opt: string) {
    if (value.includes(opt)) {
      onChange(value.filter(v => v !== opt));
    } else {
      onChange([...value, opt]);
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-md hover:border-primary/50 transition-colors bg-background min-w-[120px]">
          <span className={value.length > 0 ? 'text-foreground' : 'text-muted-foreground'}>
            {value.length > 0 ? value.join(', ') : 'Rent Duration'}
          </span>
          {value.length > 0 && (
            <Badge variant="default" className="h-4 min-w-[16px] p-0 flex items-center justify-center text-[10px] rounded-full ml-0.5">
              {value.length}
            </Badge>
          )}
          <ChevronDown className="h-3.5 w-3.5 ml-auto text-amber-500" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-0" align="start">
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
          {durationOptions.map((opt) => (
            <label key={opt} className="flex items-center gap-2 cursor-pointer py-1.5 px-2 rounded hover:bg-muted transition-colors">
              <Checkbox checked={value.includes(opt)} onCheckedChange={() => toggle(opt)} />
              <span className="text-sm text-foreground">{opt}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
