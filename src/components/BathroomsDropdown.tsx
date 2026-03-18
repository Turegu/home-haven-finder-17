import { ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const bathroomOptions = ['Any', '1', '2', '3', '4', '5', '6+'];

interface BathroomsDropdownProps {
  value: string;
  onChange: (v: string) => void;
}

export default function BathroomsDropdown({ value, onChange }: BathroomsDropdownProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-md hover:border-primary/50 transition-colors bg-background min-w-[100px]">
          <span className={value && value !== 'Any' ? 'text-foreground' : 'text-muted-foreground'}>
            {value && value !== 'Any' ? `${value} Bath` : 'Bathrooms'}
          </span>
          <ChevronDown className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-1" align="start">
        <div className="space-y-0.5">
          {bathroomOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => onChange(opt === 'Any' ? '' : opt)}
              className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${
                (value === opt || (!value && opt === 'Any'))
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-foreground'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
