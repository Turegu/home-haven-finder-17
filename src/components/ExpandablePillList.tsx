import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExpandablePillListProps {
  items: string[];
  /** Number of items to show before collapsing (default 6) */
  maxVisible?: number;
}

const ExpandablePillList = ({ items, maxVisible = 6 }: ExpandablePillListProps) => {
  const [expanded, setExpanded] = useState(false);
  const needsExpand = items.length > maxVisible;
  const displayed = expanded ? items : items.slice(0, maxVisible);

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {displayed.map((item) => (
          <span key={item} className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">
            {item}
          </span>
        ))}
      </div>
      {needsExpand && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 transition-colors"
        >
          {expanded ? (
            <>Show less <ChevronUp className="h-3 w-3" /></>
          ) : (
            <>Show all ({items.length}) <ChevronDown className="h-3 w-3" /></>
          )}
        </button>
      )}
    </div>
  );
};

export default ExpandablePillList;
