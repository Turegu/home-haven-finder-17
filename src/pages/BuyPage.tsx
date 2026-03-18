import { useState } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import {
  Search, ChevronDown, LayoutGrid, List, Map,
  Bookmark
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PropertyCard from '@/components/PropertyCard';
import PropertyListCard from '@/components/PropertyListCard';
import BannerDisplay from '@/components/BannerDisplay';
import SearchFilters from '@/components/SearchFilters';
import LocationPicker from '@/components/LocationPicker';
import { mockProperties } from '@/data/mockProperties';
import horizontalBannerPlaceholder from '@/assets/banners/horizontal-banner-placeholder.jpg';
import verticalBannerPlaceholder from '@/assets/banners/vertical-banner-placeholder.jpg';

const BuyPage = () => {
  const routerLocation = useLocation();
  const [searchParams] = useSearchParams();
  const purpose = routerLocation.pathname === '/rent' ? 'rent' : (searchParams.get('propertyPurpose') || 'buy');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('list');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [location, setLocation] = useState<{ province?: string; district?: string; neighborhood?: string }>({
    province: searchParams.get('province') || undefined,
    district: searchParams.get('district') || undefined,
    neighborhood: searchParams.get('neighborhood') || undefined,
  });
  const [keyword, setKeyword] = useState(searchParams.get('q') || "");

  const properties = mockProperties;
  const title = purpose === 'rent' ? 'Residential Properties for rent' : 'Residential Properties for sale';

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Search Bar with dynamic filters */}
      <div className="sticky top-[104px] z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4 py-3 flex flex-wrap items-center gap-2">
          <LocationPicker value={location} onChange={setLocation} compact />
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Enter Search Area, City, Address"
              className="w-full h-10 pl-3 pr-4 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>
          <SearchFilters
            context="property"
            selectedFilters={selectedFilters}
            onFiltersChange={setSelectedFilters}
            quickFilterKeys={["residential_property_types", "rooms", "furniture", "property_status"]}
          />
          <Button className="h-10 px-6 font-semibold">
            <Search className="h-4 w-4 mr-1" />
            Search
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>{'>'}</span>
          <span className="text-primary font-medium capitalize">{purpose}</span>
        </div>

        {/* Results Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <h1 className="text-lg font-bold text-foreground">
            {title} in <span className="text-primary">{properties.length} Properties</span>
          </h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 px-3 py-2 text-sm border border-border rounded-md bg-background">
              <span className="text-muted-foreground">Sort By</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-md hover:border-primary/50 transition-colors">
              <Bookmark className="h-4 w-4" />
              Save Search
            </button>
            <div className="flex border border-border rounded-md overflow-hidden">
              <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}>
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}>
                <List className="h-4 w-4" />
              </button>
              <button onClick={() => setViewMode('map')} className={`p-2 ${viewMode === 'map' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}>
                <Map className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Layout with side banner */}
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            {viewMode === 'grid' ? (
              <div className="space-y-6">
                {Array.from({ length: Math.ceil(properties.length / 3) }, (_, chunkIdx) => {
                  const chunk = properties.slice(chunkIdx * 3, (chunkIdx + 1) * 3);
                  return (
                    <div key={chunkIdx}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {chunk.map((property) => (
                          <Link key={property.id} to={`/property/${property.id}`}>
                            <PropertyCard property={property} />
                          </Link>
                        ))}
                      </div>
                      {chunkIdx < Math.ceil(properties.length / 3) - 1 && (
                        <BannerDisplay pageName={purpose === 'rent' ? 'rent' : 'buy'} bannerType="horizontal" position={chunkIdx + 1} className="my-6" />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : viewMode === 'list' ? (
              <div className="space-y-6">
                {Array.from({ length: Math.ceil(properties.length / 7) }, (_, chunkIdx) => {
                  const chunk = properties.slice(chunkIdx * 7, (chunkIdx + 1) * 7);
                  return (
                    <div key={chunkIdx} className="space-y-6">
                      {chunk.map((property) => (
                        <PropertyListCard key={property.id} property={property} />
                      ))}
                      {chunkIdx < Math.ceil(properties.length / 7) - 1 && (
                        <BannerDisplay pageName={purpose === 'rent' ? 'rent' : 'buy'} bannerType="horizontal" position={chunkIdx + 1} className="my-6" />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-muted h-[500px] flex items-center justify-center text-muted-foreground">
                <Map className="h-8 w-8 mr-2" /> Map view coming soon
              </div>
            )}
          </div>

          <div className="hidden lg:block w-[225px] shrink-0">
            <div className="sticky top-[160px]">
              <BannerDisplay pageName={purpose === 'rent' ? 'rent' : 'buy'} bannerType="vertical" className="" />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BuyPage;
