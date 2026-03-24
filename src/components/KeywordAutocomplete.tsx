import { useState, useEffect, useRef, useCallback } from 'react';
import { X, MapPin, Home, Building2, CalendarDays } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { useJsApiLoader } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY } from '@/lib/mapConstants';
import { useAllowedCountry } from '@/hooks/useAllowedCountry';
import { cn } from '@/lib/utils';

const LIBRARIES: ('places')[] = ['places'];

export interface AutocompleteSearchConfig {
  properties?: number;
  projects?: number;
  events?: number;
  places?: number;
}

interface KeywordAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (value: string, type: 'property' | 'project' | 'place') => void;
  onEnter?: () => void;
  placeholder?: string;
  className?: string;
  searchConfig?: AutocompleteSearchConfig;
}

interface Suggestion {
  id: string;
  text: string;
  subtext?: string;
  type: 'property' | 'project' | 'place';
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

const DEFAULT_CONFIG: Required<AutocompleteSearchConfig> = { properties: 3, projects: 0, places: 4 };

export default function KeywordAutocomplete({
  value,
  onChange,
  onSelect,
  onEnter,
  placeholder,
  className,
  searchConfig,
}: KeywordAutocompleteProps) {
  const { t } = useTranslation();
  const config = { ...DEFAULT_CONFIG, ...searchConfig };
  const { isLoaded } = useJsApiLoader({ id: 'google-map-script', googleMapsApiKey: GOOGLE_MAPS_API_KEY, libraries: LIBRARIES });
  const { data: allowedCountry } = useAllowedCountry();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

    // Run DB queries in parallel
    const dbPromises: Promise<void>[] = [];

    // 1. Properties
    if (config.properties > 0) {
      dbPromises.push(
        Promise.resolve(
          supabase
            .from('properties')
            .select('id, title, property_type, town, province')
            .eq('status', 'active')
            .ilike('title', `%${query}%`)
            .limit(config.properties)
        ).then(({ data }) => {
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
          })
          .catch(() => {})
      );
    }

    // 2. Projects
    if (config.projects > 0) {
      dbPromises.push(
        Promise.resolve(
          supabase
            .from('projects')
            .select('id, title, project_type, town, province, developer')
            .eq('status', 'active')
            .ilike('title', `%${query}%`)
            .limit(config.projects)
        ).then(({ data }) => {
            if (data) {
              data.forEach((p) => {
                results.push({
                  id: `proj-${p.id}`,
                  text: p.title,
                  subtext: [p.developer, p.town, p.province].filter(Boolean).join(' · '),
                  type: 'project',
                });
              });
            }
          })
          .catch(() => {})
      );
    }

    await Promise.all(dbPromises);

    // 3. Google Places
    if (config.places > 0) {
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

          predictions.slice(0, config.places).forEach((p) => {
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
    }

    setSuggestions(results);
    setIsOpen(results.length > 0);
    setActiveIndex(-1);
  }, [allowedCountry, config.properties, config.projects, config.places]);

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

  const renderSection = (
    items: Suggestion[],
    label: string,
    icon: React.ReactNode,
    startIndex: number,
    showDivider: boolean,
  ) => {
    if (items.length === 0) return null;
    return (
      <>
        {showDivider && <div className="border-t border-border" />}
        <p className="px-3 pt-2 pb-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
        {items.map((s, i) => {
          const idx = startIndex + i;
          return (
            <button
              key={s.id}
              className={cn(
                "w-full flex items-start gap-2.5 px-3 py-2 text-start hover:bg-muted transition-colors text-sm",
                idx === activeIndex && "bg-muted"
              )}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(s)}
            >
              {icon}
              <div className="min-w-0">
                <p className="font-medium text-foreground truncate">{s.text}</p>
                {s.subtext && <p className="text-xs text-muted-foreground truncate">{s.subtext}</p>}
              </div>
            </button>
          );
        })}
      </>
    );
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

      {isOpen && suggestions.length > 0 && (() => {
        const propertySuggestions = suggestions.filter(s => s.type === 'property');
        const projectSuggestions = suggestions.filter(s => s.type === 'project');
        const placeSuggestions = suggestions.filter(s => s.type === 'place');
        let offset = 0;

        return (
          <div className="absolute top-full start-0 end-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-[420px] overflow-y-auto">
            {renderSection(
              propertySuggestions, 'Listings',
              <Home className="h-4 w-4 text-primary mt-0.5 shrink-0" />,
              offset, false
            )}
            {(() => { offset += propertySuggestions.length; return null; })()}
            {renderSection(
              projectSuggestions, 'Projects',
              <Building2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />,
              offset, propertySuggestions.length > 0
            )}
            {(() => { offset += projectSuggestions.length; return null; })()}
            {renderSection(
              placeSuggestions, 'Places',
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />,
              offset, (propertySuggestions.length + projectSuggestions.length) > 0
            )}
          </div>
        );
      })()}
    </div>
  );
}
