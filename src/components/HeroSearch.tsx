import { useState } from 'react';
import { Search, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HeroSearch = () => {
  const [activeTab, setActiveTab] = useState<'buy' | 'rent'>('buy');

  return (
    <section className="relative w-full min-h-[520px] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&h=800&fit=crop)',
        }}
      />
      <div className="absolute inset-0 bg-foreground/60" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 tracking-tight">
          Your Property, Our Priority
        </h1>
        <p className="text-white/80 text-base md:text-lg mb-8 font-light">
          Find your dream property across the Middle East & Turkey
        </p>

        {/* Search Container */}
        <div className="bg-background/95 backdrop-blur-md rounded-xl p-5 shadow-2xl">
          {/* Buy / Rent Toggle */}
          <div className="flex gap-1 mb-4 bg-muted rounded-lg p-1 w-fit mx-auto">
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
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Enter City, Address, or Property Name..."
                className="w-full h-11 pl-10 pr-4 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
              />
            </div>
            <Button className="h-11 px-6 font-semibold">
              Search
            </Button>
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap items-center gap-2">
            <FilterButton label="Property Type" />
            <FilterButton label="Price Range" />
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
