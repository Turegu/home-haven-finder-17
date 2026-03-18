import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface AreaDropdownProps {
  minArea: string;
  maxArea: string;
  onChange: (min: string, max: string) => void;
}

export default function AreaDropdown({ minArea, maxArea, onChange }: AreaDropdownProps) {
  const [open, setOpen] = useState(false);
  const [localMin, setLocalMin] = useState(minArea);
  const [localMax, setLocalMax] = useState(maxArea);

  const hasValue = minArea || maxArea;

  function handleApply() {
    onChange(localMin, localMax);
    setOpen(false);
  }

  function handleClear() {
    setLocalMin('');
    setLocalMax('');
    onChange('', '');
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-md hover:border-primary/50 transition-colors bg-background min-w-[80px]">
          <span className={hasValue ? 'text-foreground' : 'text-muted-foreground'}>
            {hasValue ? `${minArea || '0'} - ${maxArea || '∞'} m²` : 'Area'}
          </span>
          <ChevronDown className="h-3.5 w-3.5 ml-auto text-amber-500" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Area Range (m²)</p>
        <div className="flex gap-2 mb-3">
          <input
            type="number"
            placeholder="Min Area"
            value={localMin}
            onChange={(e) => setLocalMin(e.target.value)}
            className="flex-1 h-9 px-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="number"
            placeholder="Max Area"
            value={localMax}
            onChange={(e) => setLocalMax(e.target.value)}
            className="flex-1 h-9 px-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={handleClear}>Clear</Button>
          <Button size="sm" onClick={handleApply}>Apply</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
