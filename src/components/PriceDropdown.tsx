import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface PriceDropdownProps {
  minPrice: string;
  maxPrice: string;
  onChange: (min: string, max: string) => void;
}

export default function PriceDropdown({ minPrice, maxPrice, onChange }: PriceDropdownProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);

  const hasValue = minPrice || maxPrice;

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
            {hasValue ? `$${minPrice || '0'} - $${maxPrice || '∞'}` : t('searchFilters.price')}
          </span>
          <ChevronDown className="h-3.5 w-3.5 ms-auto text-amber-500" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-3" align="start">
        <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">{t('searchFilters.priceRange')} ($)</p>
        <div className="flex gap-2 mb-3">
          <input
            type="number"
            placeholder={t('searchFilters.minPrice')}
            value={localMin}
            onChange={(e) => setLocalMin(e.target.value)}
            className="w-full h-8 px-2 rounded-md border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <input
            type="number"
            placeholder={t('searchFilters.maxPrice')}
            value={localMax}
            onChange={(e) => setLocalMax(e.target.value)}
            className="w-full h-8 px-2 rounded-md border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-ring [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={handleClear}>{t('searchFilters.clear')}</Button>
          <Button size="sm" onClick={handleApply}>{t('searchFilters.apply')}</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
