import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SearchFilters from '@/components/SearchFilters';
import LocationPicker from '@/components/LocationPicker';

const HeroSearch = () => {
  const [activeTab, setActiveTab] = useState<'buy' | 'rent'>('buy');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [location, setLocation] = useState<{ province?: string; district?: string; neighborhood?: string }>({});
  const [keyword, setKeyword] = useState("");
  const navigate = useNavigate();

  function handleSearch() {
    const params = new URLSearchParams();
    params.set('propertyPurpose', activeTab);
    if (location.province) params.set('province', location.province);
    if (location.district) params.set('district', location.district);
    if (location.neighborhood) params.set('neighborhood', location.neighborhood);
    if (keyword.trim()) params.set('q', keyword.trim());
    for (const [key, values] of Object.entries(selectedFilters)) {
      if (values.length > 0) params.set(key, values.join(','));
    }
    navigate(`/buy?${params.toString()}`);
  }

  return (
    <section className="relative z-20 -mt-8">
      <div className="container mx-auto px-4">
        <div className="bg-background/95 backdrop-blur-md rounded-xl p-5 shadow-2xl border border-border">
          {/* Buy / Rent Toggle */}
          <div className="flex gap-1 mb-4 bg-muted rounded-lg p-1 w-fit">
            <button
              onClick={() => { setActiveTab('buy'); setSelectedFilters({}); }}
              className={`px-6 py-2 text-sm font-semibold rounded-md transition-all ${
                activeTab === 'buy'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => { setActiveTab('rent'); setSelectedFilters({}); }}
              className={`px-6 py-2 text-sm font-semibold rounded-md transition-all ${
                activeTab === 'rent'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Rent
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2 mb-4">
            <LocationPicker value={location} onChange={setLocation} compact />
            <div className="relative flex-1">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Enter Search Area, City, Address"
                className="w-full h-10 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button className="h-10 px-6 font-semibold" onClick={handleSearch}>
              <Search className="h-4 w-4 mr-1.5" />
              Search
            </Button>
          </div>

          {/* Dynamic Filter Row */}
          <div className="flex flex-wrap items-center gap-2">
            <SearchFilters
              context="property"
              selectedFilters={selectedFilters}
              onFiltersChange={setSelectedFilters}
              quickFilterKeys={["residential_property_types", "price_range", "area_range", "rooms", "bathrooms"]}
              inline
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSearch;
