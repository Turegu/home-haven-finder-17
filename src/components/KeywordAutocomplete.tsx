import { useState, useEffect, useRef, useCallback } from 'react';
import { X, MapPin, Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { useJsApiLoader } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY } from '@/lib/mapConstants';
import { useAllowedCountry } from '@/hooks/useAllowedCountry';
import { cn } from '@/lib/utils';

const LIBRARIES: ('places')[] = ['places'];

interface KeywordAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (value: string, type: 'property' | 'place') => void;
  onEnter?: () => void;
  placeholder?: string;
  className?: string;
}

interface Suggestion {
  id: string;
  text: string;
  subtext?: string;
  type: 'property' | 'place';
}

let autocompleteService: google.maps.places.AutocompleteService | null = null;
function getAutocompleteService(): google.maps.places.AutocompleteService | null {
  if (autocompleteService) return autocompleteService;
  if (typeof google !== 'undefined' && google.maps?.places) {
    autocompleteService = new google.maps.places.AutocompleteService();
    return autocompleteService;
  }
  return null;
}

export default function KeywordAutocomplete({
  value,
  onChange,
  onSelect,
  onEnter,
  placeholder,
  className,
}: KeywordAutocompleteProps) {
  const { t } = useTranslation();
  const { isLoaded } = useJsApiLoader({ id: 'google-map-script', googleMapsApiKey: GOOGLE_MAPS_API_KEY, libraries: LIBRARIES });
  const { data: allowedCountry } = useAllowedCountry();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const results: Suggestion[] = [];

    // 1. Search property titles from DB
    try {
      const { data } = await supabase
        .from('properties')
        .select('id, title, property_type, town, province')
        .eq('status', 'active')
        .ilike('title', `%${query}%`)
        .limit(5);

      if (data) {
        data.forEach((p) => {
          results.push({
            id: `prop-${p.id}`,
            text: p.title,
            subtext: [p.property_type, p.town, p.province].filter(Boolean).join(' · '),
            type: 'property',
          });
        });
      }
    } catch {
      // silently fail
    }

    // 2. Google Places autocomplete
    try {
      const service = getAutocompleteService();
      if (service) {
        const countryCode = allowedCountry === 'syria' ? 'sy' : allowedCountry === 'algeria' ? 'dz' : 'tr';
        const predictions = await new Promise<google.maps.places.AutocompletePrediction[]>((resolve) => {
          service.getPlacePredictions(
            {
              input: query,
              componentRestrictions: { country: countryCode },
              types: ['geocode', 'establishment'],
            },
            (preds, status) => {
              if (status === google.maps.places.PlacesServiceStatus.OK && preds) {
                resolve(preds);
              } else {
                resolve([]);
              }
            }
          );
        });

        predictions.slice(0, 4).forEach((p) => {
          results.push({
            id: `place-${p.place_id}`,
            text: p.structured_formatting.main_text,
            subtext: p.structured_formatting.secondary_text,
            type: 'place',
          });
        });
      }
    } catch {
      // silently fail
    }

    setSuggestions(results);
    setIsOpen(results.length > 0);
    setActiveIndex(-1);
  }, [allowedCountry]);

  const handleInputChange = (val: string) => {
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  };

  const handleSelect = (suggestion: Suggestion) => {
    onChange(suggestion.text);
    setIsOpen(false);
    onSelect?.(suggestion.text, suggestion.type);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter') onEnter?.();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0) {
        handleSelect(suggestions[activeIndex]);
      } else {
        setIsOpen(false);
        onEnter?.();
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => { if (suggestions.length > 0) setIsOpen(true); }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || t('hero.searchPlaceholder')}
        className="w-full h-10 ps-3 pe-8 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
        autoComplete="off"
      />
      {value && (
        <button
          onClick={() => { onChange(''); setSuggestions([]); setIsOpen(false); }}
          className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full start-0 end-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-[320px] overflow-y-auto">
          {suggestions.map((s, i) => (
            <button
              key={s.id}
              className={cn(
                "w-full flex items-start gap-2.5 px-3 py-2.5 text-start hover:bg-accent transition-colors text-sm",
                i === activeIndex && "bg-accent"
              )}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(s)}
            >
              {s.type === 'property' ? (
                <Home className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              ) : (
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              )}
              <div className="min-w-0">
                <p className="font-medium text-foreground truncate">{s.text}</p>
                {s.subtext && (
                  <p className="text-xs text-muted-foreground truncate">{s.subtext}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
