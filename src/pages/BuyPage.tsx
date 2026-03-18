import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import {
  Search, ChevronDown, LayoutGrid, List, Map,
  Bookmark, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PropertyCard from '@/components/PropertyCard';
import PropertyListCard from '@/components/PropertyListCard';
import BannerDisplay from '@/components/BannerDisplay';
import SearchFilters from '@/components/SearchFilters';
import ListingMapView from '@/components/ListingMapView';
import LocationPicker from '@/components/LocationPicker';
import { mockProperties } from '@/data/mockProperties';
import horizontalBannerPlaceholder from '@/assets/banners/horizontal-banner-placeholder.jpg';
import horizontalBannerPlaceholder2 from '@/assets/banners/horizontal-banner-placeholder-2.jpg';
import verticalBannerPlaceholder from '@/assets/banners/vertical-banner-placeholder.jpg';

const horizontalBanners = [horizontalBannerPlaceholder, horizontalBannerPlaceholder2];

const BuyPage = () => {
  const routerLocation = useLocation();
  const [searchParams] = useSearchParams();
  const purpose = routerLocation.pathname === '/rent' ? 'rent' : (searchParams.get('propertyPurpose') || 'buy');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('list');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [location, setLocation] = useState<{ province?: string; district?: string; neighborhood?: string }>({
    province: searchParams.get('province') || undefined,
    district: searchParams.get('district') || undefined,
    neighborhood: searchParams.get('neighborhood') || undefined,
  });
  const [keyword, setKeyword] = useState(searchParams.get('q') || "");

  const allProperties = mockProperties;
  const GRID_ROWS_PER_PAGE = 5;
  const GRID_COLS = 3;
  const LIST_ROWS_PER_PAGE = 21;
  const itemsPerPage = viewMode === 'grid' ? GRID_ROWS_PER_PAGE * GRID_COLS : LIST_ROWS_PER_PAGE;
  const totalPages = Math.ceil(allProperties.length / itemsPerPage);
  const properties = allProperties.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
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
            {title} in <span className="text-primary">{allProperties.length} Properties</span>
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
              <button onClick={() => { setViewMode('grid'); setCurrentPage(1); }} className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}>
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button onClick={() => { setViewMode('list'); setCurrentPage(1); }} className={`p-2 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}>
                <List className="h-4 w-4" />
              </button>
              <button onClick={() => { setViewMode('map'); setCurrentPage(1); }} className={`p-2 ${viewMode === 'map' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}>
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
                        <div className="my-6">
                          <BannerDisplay pageName={purpose === 'rent' ? 'rent' : 'buy'} bannerType="horizontal" position={chunkIdx + 1} className="" />
                          <img src={horizontalBanners[chunkIdx % 2]} alt="Advertisement" className="w-full h-auto rounded-lg object-cover max-h-[160px]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : viewMode === 'list' ? (
              <div className="space-y-6">
                {Array.from({ length: Math.ceil(properties.length / 4) }, (_, chunkIdx) => {
                  const chunk = properties.slice(chunkIdx * 4, (chunkIdx + 1) * 4);
                  return (
                    <div key={chunkIdx} className="space-y-6">
                      {chunk.map((property) => (
                        <PropertyListCard key={property.id} property={property} />
                      ))}
                      {chunkIdx < Math.ceil(properties.length / 4) - 1 && (
                        <div className="my-6">
                          <BannerDisplay pageName={purpose === 'rent' ? 'rent' : 'buy'} bannerType="horizontal" position={chunkIdx + 1} className="" />
                          <img src={horizontalBanners[chunkIdx % 2]} alt="Advertisement" className="w-full h-auto rounded-lg object-cover max-h-[160px]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <ListingMapView
                listings={allProperties.map(p => ({
                  id: p.id,
                  title: p.title,
                  location: p.location,
                  image: p.images[0],
                  price: p.price,
                  currency: p.currency,
                  linkTo: `/property/${p.id}`,
                  type: 'property' as const,
                  subtitle: `${p.type} • ${p.bedrooms} bed • ${p.bathrooms} bath`,
                  meta: `${p.area} ${p.areaUnit}`,
                  logo: p.agentLogo,
                }))}
              />
            )}
          </div>

          <div className="hidden lg:block w-[225px] shrink-0">
            <div className="sticky top-[160px]">
              <BannerDisplay pageName={purpose === 'rent' ? 'rent' : 'buy'} bannerType="vertical" className="" />
              <img src={verticalBannerPlaceholder} alt="Advertisement" className="w-full h-auto rounded-lg object-cover" />
            </div>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8 mb-4">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              disabled={currentPage === 1}
              onClick={() => { setCurrentPage((p) => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? 'default' : 'outline'}
                size="sm"
                className="h-9 w-9 p-0"
                onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              disabled={currentPage === totalPages}
              onClick={() => { setCurrentPage((p) => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default BuyPage;
