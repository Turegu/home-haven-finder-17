import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, Globe } from 'lucide-react';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { allLanguages } from '@/data/languages';

// Platform priority languages — shown at the top
const PRIORITY_LANGUAGES = [
  'English', 'Turkish', 'Arabic', 'French', 'Russian', 'German', 'Farsi',
];

// Map short labels for display
const SHORT_LABELS: Record<string, string> = {
  English: 'ENG',
  Turkish: 'TR',
  Arabic: 'Arabic',
  French: 'FR',
  Russian: 'Rus',
  German: 'GER',
  Farsi: 'Farsi',
};

interface LanguageSearchDropdownProps {
  selected: string[];
  onChange: (selected: string[]) => void;
  /** If true, only allow single selection */
  single?: boolean;
  className?: string;
}

export default function LanguageSearchDropdown({
  selected,
  onChange,
  single = false,
  className = '',
}: LanguageSearchDropdownProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const prioritySet = new Set(PRIORITY_LANGUAGES);
  const restLanguages = allLanguages.filter((l) => !prioritySet.has(l));

  const filterFn = (lang: string) =>
    !search || lang.toLowerCase().includes(search.toLowerCase());

  const filteredPriority = PRIORITY_LANGUAGES.filter(filterFn);
  const filteredRest = restLanguages.filter(filterFn);

  function toggle(lang: string) {
    if (single) {
      onChange(selected.includes(lang) ? [] : [lang]);
      setOpen(false);
      return;
    }
    onChange(
      selected.includes(lang)
        ? selected.filter((l) => l !== lang)
        : [...selected, lang],
    );
  }

  const label =
    selected.length === 0
      ? 'Languages'
      : selected.length === 1
        ? (SHORT_LABELS[selected[0]] || selected[0])
        : `${selected.length} Languages`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={`flex items-center justify-between gap-2 border border-border rounded-lg px-3 py-2 text-sm bg-background hover:border-primary/30 transition-colors ${className}`}
        >
          <span className="flex items-center gap-1.5 truncate">
            <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className={selected.length > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}>
              {label}
            </span>
            {selected.length > 1 && (
              <Badge variant="default" className="h-5 min-w-[20px] px-1.5 text-[10px] rounded-full">
                {selected.length}
              </Badge>
            )}
          </span>
          <ChevronDown className="h-4 w-4 text-amber-500 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start" sideOffset={6}>
        {/* Search */}
        <div className="p-2.5 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search languages..."
              className="w-full h-8 pl-8 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* List */}
        <div
          className="overflow-y-auto max-h-[320px] p-1.5 space-y-0.5"
          onWheel={(e) => {
            const el = e.currentTarget;
            if (el.scrollHeight <= el.clientHeight) return;
            e.preventDefault();
            e.stopPropagation();
            el.scrollTop += e.deltaY;
          }}
        >
          {/* Priority languages */}
          {filteredPriority.length > 0 && (
            <>
              {filteredPriority.map((lang) => (
                <LangRow key={lang} lang={lang} shortLabel={SHORT_LABELS[lang]} checked={selected.includes(lang)} onToggle={() => toggle(lang)} single={single} />
              ))}
              {filteredRest.length > 0 && (
                <div className="border-t border-border my-1.5" />
              )}
            </>
          )}

          {/* Rest of world languages */}
          {filteredRest.map((lang) => (
            <LangRow key={lang} lang={lang} checked={selected.includes(lang)} onToggle={() => toggle(lang)} single={single} />
          ))}

          {filteredPriority.length === 0 && filteredRest.length === 0 && (
            <p className="text-xs text-muted-foreground px-2 py-4 text-center">No languages found</p>
          )}
        </div>

        {/* Footer */}
        {selected.length > 0 && !single && (
          <div className="px-3 py-2 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-primary">{selected.length}</span> selected
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function LangRow({ lang, shortLabel, checked, onToggle, single }: {
  lang: string; shortLabel?: string; checked: boolean; onToggle: () => void; single: boolean;
}) {
  return (
    <label
      className={`flex items-center gap-2.5 cursor-pointer py-2 px-2.5 rounded-md transition-colors ${
        checked ? 'bg-primary/5' : 'hover:bg-muted'
      }`}
    >
      {single ? (
        <Check className={`h-4 w-4 ${checked ? 'text-primary' : 'text-transparent'}`} />
      ) : (
        <Checkbox checked={checked} onCheckedChange={onToggle} />
      )}
      <span className={`text-sm flex-1 ${checked ? 'text-foreground font-medium' : 'text-foreground'}`}>
        {lang}
      </span>
      {shortLabel && (
        <span className="text-[10px] text-muted-foreground font-medium">{shortLabel}</span>
      )}
    </label>
  );
}
