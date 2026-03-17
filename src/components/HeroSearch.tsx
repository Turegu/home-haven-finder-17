import { useState } from 'react';
import { Search, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HeroSearch = () => {
  const [activeTab, setActiveTab] = useState<'buy' | 'rent'>('buy');

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
            <Button className="h-10 px-6 font-semibold">
              <Search className="h-4 w-4 mr-1.5" />
              Search
            </Button>
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap items-center gap-2">
            <FilterButton label="Property Type" />
            <FilterButton label="Price" />
            <FilterButton label="Area" />
            <FilterButton label="Rooms" />
            <FilterButton label="Bathrooms" />
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-primary hover:bg-secondary rounded-md transition-colors font-medium">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

const FilterButton = ({ label }: { label: string }) => (
  <button className="flex items-center gap-1 px-3 py-2 text-sm text-foreground/70 border border-border rounded-md hover:border-primary/50 hover:text-foreground transition-colors bg-background">
    {label}
    <ChevronDown className="h-3.5 w-3.5" />
  </button>
);

export default HeroSearch;
