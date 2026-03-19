import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { type PropertyMoreFilters, emptyMoreFilters } from '@/components/PropertyFiltersModal';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import {
  Search, LayoutGrid, List, Map,
  Bookmark, ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PropertyCard from '@/components/PropertyCard';
import PropertyListCard from '@/components/PropertyListCard';
import BannerDisplay from '@/components/BannerDisplay';
import ListingMapView from '@/components/ListingMapView';
import LocationPicker from '@/components/LocationPicker';
import PropertyTypeDropdown from '@/components/PropertyTypeDropdown';
import PriceDropdown from '@/components/PriceDropdown';
import AreaDropdown from '@/components/AreaDropdown';
import RoomsDropdown from '@/components/RoomsDropdown';
import BathroomsDropdown from '@/components/BathroomsDropdown';
import RentDurationDropdown from '@/components/RentDurationDropdown';
import PropertyFiltersModal from '@/components/PropertyFiltersModal';
import { SelectedFilterBadges } from '@/components/SearchFilters';
import { usePropertySearch, type PropertySearchParams } from '@/hooks/usePropertySearch';
import horizontalBannerPlaceholder from '@/assets/banners/horizontal-banner-placeholder.jpg';
import horizontalBannerPlaceholder2 from '@/assets/banners/horizontal-banner-placeholder-2.jpg';
import verticalBannerPlaceholder from '@/assets/banners/vertical-banner-placeholder.jpg';

const horizontalBanners = [horizontalBannerPlaceholder, horizontalBannerPlaceholder2];

const BuyPage = () => {
  const routerLocation = useLocation();
  const [searchParams] = useSearchParams();

  const isRent = routerLocation.pathname === '/rent' || searchParams.get('propertyPurpose') === 'rent';

  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('list');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [location, setLocation] = useState<{ province?: string; district?: string; neighborhood?: string }>({
    province: searchParams.get('province') || undefined,
    district: searchParams.get('district') || undefined,
    neighborhood: searchParams.get('neighborhood') || undefined,
  });
  const [keyword, setKeyword] = useState(searchParams.get('q') || "");

  // Filter states
  const [propertyTypes, setPropertyTypes] = useState<string[]>(
    searchParams.get('propertyTypes')?.split(',').filter(Boolean) || []
  );
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [minArea, setMinArea] = useState('');
  const [maxArea, setMaxArea] = useState('');
  const [rooms, setRooms] = useState<string[]>(
    searchParams.get('rooms')?.split(',').filter(Boolean) || []
  );
  const [bathrooms, setBathrooms] = useState<string[]>([]);
  const [rentDuration, setRentDuration] = useState<string[]>([]);
  const [moreFilters, setMoreFilters] = useState<PropertyMoreFilters>(emptyMoreFilters);

  // Search params that trigger the query (committed on Search click)
  const [committedParams, setCommittedParams] = useState<PropertySearchParams>({
    propertyPurpose: isRent ? 'rent' : 'buy',
    sortBy: 'newest',
    page: 1,
    pageSize: 21,
  });

  // Reset all filters when navigating to /buy or /rent without search params (clean nav click)
  useEffect(() => {
    const hasParams = searchParams.toString().length > 0;
    if (!hasParams) {
      setLocation({});
      setKeyword('');
      setPropertyTypes([]);
      setMinPrice('');
      setMaxPrice('');
      setMinArea('');
      setMaxArea('');
      setRooms([]);
      setBathrooms([]);
      setRentDuration([]);
      setMoreFilters(emptyMoreFilters);
      setSortBy('newest');
      setCurrentPage(1);
      setCommittedParams({
        propertyPurpose: isRent ? 'rent' : 'buy',
        sortBy: 'newest',
        page: 1,
        pageSize: viewMode === 'grid' ? 15 : 21,
      });
    } else {
      // Sync from URL params (coming from HeroSearch)
      const p = searchParams.get('province') || undefined;
      const d = searchParams.get('district') || undefined;
      const n = searchParams.get('neighborhood') || undefined;
      const q = searchParams.get('q') || '';
      const pt = searchParams.get('propertyTypes')?.split(',').filter(Boolean) || [];
      const mnP = searchParams.get('minPrice') || '';
      const mxP = searchParams.get('maxPrice') || '';
      const r = searchParams.get('rooms')?.split(',').filter(Boolean) || [];

      setLocation({ province: p, district: d, neighborhood: n });
      setKeyword(q);
      setPropertyTypes(pt);
      setMinPrice(mnP);
      setMaxPrice(mxP);
      setRooms(r);
      setCurrentPage(1);
      setCommittedParams({
        propertyPurpose: isRent ? 'rent' : 'buy',
        province: p,
        district: d,
        neighborhood: n,
        keyword: q || undefined,
        propertyTypes: pt.length > 0 ? pt : undefined,
        minPrice: mnP || undefined,
        maxPrice: mxP || undefined,
        rooms: r.length > 0 ? r : undefined,
        moreFilters: emptyMoreFilters,
        sortBy: 'newest',
        page: 1,
        pageSize: viewMode === 'grid' ? 15 : 21,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routerLocation.pathname, searchParams.toString()]);


  const title = isRent ? 'Properties for Rent' : 'Properties for Sale';

  // Query
  const { data, isLoading, isFetching } = usePropertySearch(committedParams);
  const allProperties = data?.properties ?? [];
  const totalCount = data?.total ?? 0;

  const GRID_ITEMS = 15;
  const LIST_ITEMS = 21;
  const itemsPerPage = viewMode === 'grid' ? GRID_ITEMS : LIST_ITEMS;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  useEffect(() => {
    document.title = `${isRent ? 'Rent' : 'Buy'} | Turegu`;
  }, [isRent]);

  // Commit search
  const handleSearch = useCallback(() => {
    const newParams: PropertySearchParams = {
      propertyPurpose: isRent ? 'rent' : 'buy',
      province: location.province,
      district: location.district,
      neighborhood: location.neighborhood,
      keyword: keyword.trim() || undefined,
      propertyTypes: propertyTypes.length > 0 ? propertyTypes : undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      minArea: minArea || undefined,
      maxArea: maxArea || undefined,
      rooms: rooms.length > 0 ? rooms : undefined,
      bathrooms: bathrooms.length > 0 ? bathrooms : undefined,
      rentDuration: rentDuration.length > 0 ? rentDuration : undefined,
      moreFilters,
      sortBy,
      page: 1,
      pageSize: viewMode === 'grid' ? GRID_ITEMS : LIST_ITEMS,
    };
    setCommittedParams(newParams);
    setCurrentPage(1);
  }, [isRent, location, keyword, propertyTypes, minPrice, maxPrice, minArea, maxArea, rooms, bathrooms, rentDuration, moreFilters, sortBy, viewMode]);

  // Re-search when sort changes
  useEffect(() => {
    setCommittedParams(prev => ({ ...prev, sortBy, page: currentPage, pageSize: viewMode === 'grid' ? GRID_ITEMS : LIST_ITEMS }));
  }, [sortBy, currentPage, viewMode]);

  // Build selected filter badges from all filter states
  const selectedBadges: Record<string, string[]> = {};
  if (propertyTypes.length > 0) selectedBadges['Property Type'] = propertyTypes;
  if (minPrice || maxPrice) selectedBadges['Price'] = [`$${minPrice || '0'} - $${maxPrice || '∞'}`];
  if (minArea || maxArea) selectedBadges['Area'] = [`${minArea || '0'} - ${maxArea || '∞'} m²`];
  if (rooms.length > 0) selectedBadges['Rooms'] = rooms;
  if (bathrooms.length > 0) selectedBadges['Bathrooms'] = bathrooms;
  if (rentDuration.length > 0) selectedBadges['Rent Duration'] = rentDuration;
  if (moreFilters.floorLevels.length > 0) selectedBadges['Floor Level'] = moreFilters.floorLevels;
  if (moreFilters.parkingSpaces.length > 0) selectedBadges['Parking'] = moreFilters.parkingSpaces;
  if (moreFilters.furniture.length > 0) selectedBadges['Furniture'] = moreFilters.furniture;
  if (moreFilters.propertyAges.length > 0) selectedBadges['Property Age'] = moreFilters.propertyAges;
  if (moreFilters.exteriorAmenities.length > 0) selectedBadges['Ext. Amenities'] = moreFilters.exteriorAmenities;
  if (moreFilters.interiorAmenities.length > 0) selectedBadges['Int. Amenities'] = moreFilters.interiorAmenities;

  function resetAllFilters() {
    setLocation({});
    setKeyword('');
    setPropertyTypes([]);
    setMinPrice('');
    setMaxPrice('');
    setMinArea('');
    setMaxArea('');
    setRooms([]);
    setBathrooms([]);
    setRentDuration([]);
    setMoreFilters(emptyMoreFilters);
  }

  function clearBadge(categoryKey: string, value: string) {
    if (categoryKey === 'Property Type') setPropertyTypes(prev => prev.filter(t => t !== value));
    else if (categoryKey === 'Price') { setMinPrice(''); setMaxPrice(''); }
    else if (categoryKey === 'Area') { setMinArea(''); setMaxArea(''); }
    else if (categoryKey === 'Rooms') setRooms(prev => prev.filter(v => v !== value));
    else if (categoryKey === 'Bathrooms') setBathrooms(prev => prev.filter(v => v !== value));
    else if (categoryKey === 'Rent Duration') setRentDuration(prev => prev.filter(v => v !== value));
    else if (categoryKey === 'Floor Level') setMoreFilters(prev => ({ ...prev, floorLevels: prev.floorLevels.filter(v => v !== value) }));
    else if (categoryKey === 'Parking') setMoreFilters(prev => ({ ...prev, parkingSpaces: prev.parkingSpaces.filter(v => v !== value) }));
    else if (categoryKey === 'Furniture') setMoreFilters(prev => ({ ...prev, furniture: prev.furniture.filter(v => v !== value) }));
    else if (categoryKey === 'Property Age') setMoreFilters(prev => ({ ...prev, propertyAges: prev.propertyAges.filter(v => v !== value) }));
    else if (categoryKey === 'Ext. Amenities') setMoreFilters(prev => ({ ...prev, exteriorAmenities: prev.exteriorAmenities.filter(v => v !== value) }));
    else if (categoryKey === 'Int. Amenities') setMoreFilters(prev => ({ ...prev, interiorAmenities: prev.interiorAmenities.filter(v => v !== value) }));
  }

  const hasBadges = Object.keys(selectedBadges).length > 0;

  // Map DB results to card-compatible shape
  function toCardProp(p: typeof allProperties[number]) {
    return {
      id: p.id,
      title: p.title,
      price: p.price ?? 0,
      currency: p.currency ?? 'USD',
      location: p.location || [p.neighbourhood, p.town, p.province].filter(Boolean).join(', ') || 'N/A',
      city: p.town ?? '',
      type: p.property_type,
      area: p.area ?? 0,
      areaUnit: p.area_unit ?? 'm²',
      bedrooms: p.bedrooms ?? 0,
      bathrooms: p.bathrooms ?? 0,
      images: (p.images && p.images.length > 0) ? p.images : ['/placeholder.svg'],
      agentLogo: '',
      agentName: '',
      isFeatured: p.display_on_homepage,
      listingTier: 'standard' as const,
      listingType: (p.property_purpose === 'rent' ? 'rent' : 'buy') as 'buy' | 'rent',
      advertisingTags: p.advertising_tags ?? [],
    };
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Search Bar + Filters */}
      <div className="sticky top-[104px] z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4 py-3">
          {/* Search row */}
          <div className="flex flex-wrap items-center gap-2">
            <LocationPicker value={location} onChange={setLocation} compact />
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter Search Area, City, Address"
                className="w-full h-10 pl-3 pr-4 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
              />
            </div>
            <PropertyTypeDropdown selected={propertyTypes} onChange={setPropertyTypes} />
            <PriceDropdown minPrice={minPrice} maxPrice={maxPrice} onChange={(min, max) => { setMinPrice(min); setMaxPrice(max); }} />
            <AreaDropdown minArea={minArea} maxArea={maxArea} onChange={(min, max) => { setMinArea(min); setMaxArea(max); }} />
            <RoomsDropdown value={rooms} onChange={setRooms} />
            {isRent ? (
              <RentDurationDropdown value={rentDuration} onChange={setRentDuration} />
            ) : (
              <BathroomsDropdown value={bathrooms} onChange={setBathrooms} />
            )}
            <PropertyFiltersModal
              filters={moreFilters}
              onFiltersChange={setMoreFilters}
              onClearAll={resetAllFilters}
            />
            <Button className="h-10 px-6 font-semibold" onClick={handleSearch} disabled={isFetching}>
              {isFetching ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Search className="h-4 w-4 mr-1" />}
              Search
            </Button>
          </div>

          {/* Selected filter badges - separate row below */}
          {hasBadges && (
            <div className="pt-2 pb-1">
              <SelectedFilterBadges
                selectedFilters={selectedBadges}
                onFiltersChange={(updated) => {
                  if (Object.keys(updated).length === 0) {
                    resetAllFilters();
                    return;
                  }
                  Object.keys(selectedBadges).forEach(key => {
                    const oldValues = selectedBadges[key];
                    const newValues = updated[key] || [];
                    oldValues.forEach(v => {
                      if (!newValues.includes(v)) clearBadge(key, v);
                    });
                  });
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>{'>'}</span>
          <span className="text-primary font-medium">{isRent ? 'Rent' : 'Buy'}</span>
        </div>

        {/* Results Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <h1 className="text-lg font-bold text-foreground">
            {title} in <span className="text-primary">{totalCount} Properties</span>
          </h1>
          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex items-center gap-1 px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="area_desc">Area: Largest First</option>
            </select>
            <button
              onClick={() => toast.success('Search saved! You\'ll be notified of new matches.', { description: 'Visit Saved Searches to manage your alerts.' })}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-md hover:border-primary/50 transition-colors"
            >
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

        {/* Loading state */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading properties...</span>
          </div>
        ) : allProperties.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg font-medium text-foreground mb-2">No properties found</p>
            <p className="text-muted-foreground">Try adjusting your filters or search criteria.</p>
          </div>
        ) : (
          /* Layout with side banner */
          <div className="flex gap-6">
            <div className="flex-1 min-w-0">
              {viewMode === 'grid' ? (
                <div className="space-y-6">
                  {Array.from({ length: Math.ceil(allProperties.length / 3) }, (_, chunkIdx) => {
                    const chunk = allProperties.slice(chunkIdx * 3, (chunkIdx + 1) * 3);
                    return (
                      <div key={chunkIdx}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {chunk.map((property) => (
                            <Link key={property.id} to={`/property/${property.id}`}>
                              <PropertyCard property={toCardProp(property)} />
                            </Link>
                          ))}
                        </div>
                        {chunkIdx < Math.ceil(allProperties.length / 3) - 1 && (
                          <div className="my-6">
                            <BannerDisplay pageName={isRent ? 'rent' : 'buy'} bannerType="horizontal" position={chunkIdx + 1} className="" />
                            <img src={horizontalBanners[chunkIdx % 2]} alt="Advertisement" className="w-full h-auto rounded-lg object-cover max-h-[160px]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : viewMode === 'list' ? (
                <div className="space-y-6">
                  {Array.from({ length: Math.ceil(allProperties.length / 4) }, (_, chunkIdx) => {
                    const chunk = allProperties.slice(chunkIdx * 4, (chunkIdx + 1) * 4);
                    return (
                      <div key={chunkIdx} className="space-y-6">
                        {chunk.map((property) => (
                          <PropertyListCard key={property.id} property={toCardProp(property)} />
                        ))}
                        {chunkIdx < Math.ceil(allProperties.length / 4) - 1 && (
                          <div className="my-6">
                            <BannerDisplay pageName={isRent ? 'rent' : 'buy'} bannerType="horizontal" position={chunkIdx + 1} className="" />
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
                    location: p.location || [p.neighbourhood, p.town, p.province].filter(Boolean).join(', ') || '',
                    image: p.images?.[0] || '/placeholder.svg',
                    images: p.images || ['/placeholder.svg'],
                    price: p.price ?? 0,
                    currency: p.currency ?? 'USD',
                    linkTo: `/property/${p.id}`,
                    type: 'property' as const,
                    subtitle: `${p.property_type} • ${p.bedrooms ?? 0} bed • ${p.bathrooms ?? 0} bath`,
                    meta: `${p.area ?? 0} ${p.area_unit ?? 'm²'}`,
                    logo: '',
                    bedrooms: p.bedrooms ?? 0,
                    bathrooms: p.bathrooms ?? 0,
                    area: p.area ?? 0,
                    areaUnit: p.area_unit ?? 'm²',
                    propertyType: p.property_type,
                  }))}
                />
              )}
            </div>

            <div className="hidden lg:block w-[225px] shrink-0">
              <div className="sticky top-[160px]">
                <BannerDisplay pageName={isRent ? 'rent' : 'buy'} bannerType="vertical" className="" />
                <img src={verticalBannerPlaceholder} alt="Advertisement" className="w-full h-auto rounded-lg object-cover" />
              </div>
            </div>
          </div>
        )}

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
