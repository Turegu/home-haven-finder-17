import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { turkishIncludes } from "@/lib/utils";

interface SearchablePillSelectProps {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  placeholder?: string;
}

const SearchablePillSelect = ({
  options,
  selected,
  onToggle,
  placeholder = "Search...",
}: SearchablePillSelectProps) => {
  const [search, setSearch] = useState("");

  const filtered = search
    ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <div className="space-y-2">
      {options.length > 8 && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={placeholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      )}
      <div
        className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto"
        onWheel={(e) => {
          const el = e.currentTarget;
          if (el.scrollHeight <= el.clientHeight) return;
          e.stopPropagation();
          el.scrollTop += e.deltaY;
        }}
      >
        {filtered.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={`px-2 py-1 rounded-full text-[11px] font-medium border transition-colors ${
              selected.includes(opt)
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary/30 text-muted-foreground border-border hover:border-primary"
            }`}
          >
            {opt}
          </button>
        ))}
        {filtered.length === 0 && (
          <span className="text-xs text-muted-foreground py-2">No matches</span>
        )}
      </div>
    </div>
  );
};

export default SearchablePillSelect;
