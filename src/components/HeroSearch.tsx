import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SearchFilters from '@/components/SearchFilters';

const HeroSearch = () => {
  const [activeTab, setActiveTab] = useState<'buy' | 'rent'>('buy');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const navigate = useNavigate();

  function handleSearch() {
    const params = new URLSearchParams();
    params.set('propertyPurpose', activeTab);
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
              onClick={() => setActiveTab('buy')}
              className={`px-6 py-2 text-sm font-semibold rounded-md transition-all ${
                activeTab === 'buy'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setActiveTab('rent')}
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
            <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-md bg-background min-w-[140px]">
              <span className="text-sm text-muted-foreground">Location</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Enter Search Area, City, Address"
                className="w-full h-10 px-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
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
              quickFilterKeys={["residential_property_types", "rooms", "furniture", "property_status"]}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSearch;
