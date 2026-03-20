import { useState, useEffect, useCallback, lazy } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search, LayoutGrid, List, Map,
  MapPin, Building, Maximize, Phone, Mail, Heart, SlidersHorizontal, Loader2,
  TreePine, Lamp, Check, ChevronLeft, ChevronRight, Bookmark, ChevronDown, Camera, Calendar,
  Crown, Star, Tag, X, Home
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { getIcon } from '@/components/AmenitiesViewAllDialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BannerDisplay from '@/components/BannerDisplay';
const ListingMapView = lazy(() => import('@/components/ListingMapView'));
import LocationPicker from '@/components/LocationPicker';
import AreaDropdown from '@/components/AreaDropdown';
import RoomsDropdown from '@/components/RoomsDropdown';
import PriceDropdown from '@/components/PriceDropdown';
import { SelectedFilterBadges } from '@/components/SearchFilters';
import SaveSearchDialog from '@/components/SaveSearchDialog';
import { useFilterOptions } from '@/hooks/useFilterOptions';
import { useProjectSearch, type ProjectSearchParams, type ProjectResult } from '@/hooks/useProjectSearch';
import horizontalBannerPlaceholder from '@/assets/banners/horizontal-banner-placeholder.jpg';
import horizontalBannerPlaceholder2 from '@/assets/banners/horizontal-banner-placeholder-2.jpg';
import verticalBannerPlaceholder from '@/assets/banners/vertical-banner-placeholder.jpg';

const horizontalBanners = [horizontalBannerPlaceholder, horizontalBannerPlaceholder2];

const GRID_ITEMS = 15;
const LIST_ITEMS = 21;

const ProjectsPage = () => {
  const [searchParams] = useSearchParams();
  const { options: fo } = useFilterOptions("search");
  const unitTypes = fo["project_unit_types"] || [];
  const projectStatuses = fo["project_statuses"] || [];
  const extAmenityOptions = fo["exterior_amenities"] || [];
  const intAmenityOptions = fo["interior_amenities"] || [];

  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('list');
  const [focusListingId, setFocusListingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('newest');
  const [location, setLocation] = useState<{ province?: string; district?: string; neighborhood?: string }>({
    province: searchParams.get('province') || undefined,
    district: searchParams.get('district') || undefined,
    neighborhood: searchParams.get('neighborhood') || undefined,
  });
  const [keyword, setKeyword] = useState('');
  const [selectedUnitTypes, setSelectedUnitTypes] = useState<string[]>([]);
  const [minArea, setMinArea] = useState('');
  const [maxArea, setMaxArea] = useState('');
  const [rooms, setRooms] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [projectStatus, setProjectStatus] = useState('');
  const [exteriorAmenities, setExteriorAmenities] = useState<string[]>([]);
  const [interiorAmenities, setInteriorAmenities] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [amenitySearch, setAmenitySearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [saveSearchOpen, setSaveSearchOpen] = useState(false);

  const itemsPerPage = viewMode === 'grid' ? GRID_ITEMS : LIST_ITEMS;

  const [committedParams, setCommittedParams] = useState<ProjectSearchParams>({
    sortBy: 'newest',
    page: 1,
    pageSize: LIST_ITEMS,
    province: searchParams.get('province') || undefined,
    district: searchParams.get('district') || undefined,
    neighborhood: searchParams.get('neighborhood') || undefined,
  });

  const { data, isLoading, isFetching } = useProjectSearch(committedParams);
  const projects = data?.projects ?? [];
  const totalCount = data?.total ?? 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  useEffect(() => { document.title = 'Projects | Turegu'; }, []);

  // Re-query on sort/page/viewMode change
  useEffect(() => {
    setCommittedParams(prev => ({ ...prev, sortBy, page: currentPage, pageSize: viewMode === 'grid' ? GRID_ITEMS : LIST_ITEMS }));
  }, [sortBy, currentPage, viewMode]);

  const handleSearch = useCallback(() => {
    setCommittedParams({
      province: location.province,
      district: location.district,
      neighborhood: location.neighborhood,
      keyword: keyword.trim() || undefined,
      unitTypes: selectedUnitTypes.length > 0 ? selectedUnitTypes : undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      minArea: minArea || undefined,
      maxArea: maxArea || undefined,
      rooms: rooms.length > 0 ? rooms : undefined,
      projectStatus: projectStatus || undefined,
      amenities: [...exteriorAmenities, ...interiorAmenities].length > 0 ? [...exteriorAmenities, ...interiorAmenities] : undefined,
      sortBy,
      page: 1,
      pageSize: viewMode === 'grid' ? GRID_ITEMS : LIST_ITEMS,
    });
    setCurrentPage(1);
  }, [location, keyword, selectedUnitTypes, minPrice, maxPrice, minArea, maxArea, rooms, projectStatus, exteriorAmenities, interiorAmenities, sortBy, viewMode]);

  // Build badges
  const selectedBadges: Record<string, string[]> = {};
  if (selectedUnitTypes.length > 0) selectedBadges['Unit Type'] = selectedUnitTypes;
  if (minArea || maxArea) selectedBadges['Area'] = [`${minArea || '0'} - ${maxArea || '∞'} m²`];
  if (rooms.length > 0) selectedBadges['Rooms'] = rooms;
  if (minPrice || maxPrice) selectedBadges['Price'] = [`$${minPrice || '0'} - $${maxPrice || '∞'}`];
  if (projectStatus && projectStatus !== 'Any') selectedBadges['Status'] = [projectStatus];
  const allAmenities = [...exteriorAmenities, ...interiorAmenities];
  if (allAmenities.length > 0) selectedBadges['Amenities'] = allAmenities;

  const hasBadges = Object.keys(selectedBadges).length > 0;
  const moreFilterCount = allAmenities.length;

  function resetAllFilters() {
    setLocation({});
    setKeyword('');
    setSelectedUnitTypes([]);
    setMinPrice('');
    setMaxPrice('');
    setMinArea('');
    setMaxArea('');
    setRooms([]);
    setProjectStatus('');
    setExteriorAmenities([]);
    setInteriorAmenities([]);
  }

  function clearBadge(key: string, v: string) {
    if (key === 'Unit Type') setSelectedUnitTypes(prev => prev.filter(t => t !== v));
    else if (key === 'Area') { setMinArea(''); setMaxArea(''); }
    else if (key === 'Rooms') setRooms(prev => prev.filter(r => r !== v));
    else if (key === 'Price') { setMinPrice(''); setMaxPrice(''); }
    else if (key === 'Status') setProjectStatus('');
    else if (key === 'Amenities') {
      setExteriorAmenities(prev => prev.filter(a => a !== v));
      setInteriorAmenities(prev => prev.filter(a => a !== v));
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Search Bar + Filters */}
      <div className="sticky top-[104px] z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <LocationPicker value={location} onChange={setLocation} compact />
            <div className="relative min-w-[140px] max-w-[200px]">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search keyword..."
                className="w-full h-10 pl-3 pr-8 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
              />
              {keyword && (
                <button onClick={() => setKeyword('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Unit Type dropdown */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-md hover:border-primary/50 transition-colors bg-background min-w-[110px]">
                  <span className={selectedUnitTypes.length > 0 ? 'text-foreground' : 'text-muted-foreground'}>
                    {selectedUnitTypes.length > 0 ? `${selectedUnitTypes.length} selected` : 'Unit Type'}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 ml-auto text-amber-500" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-52 p-1" align="start">
                <ScrollArea>
                  <div className="space-y-0.5">
                    {unitTypes.map((type) => (
                      <label key={type} className="flex items-center gap-2 cursor-pointer py-1.5 px-2 rounded hover:bg-muted transition-colors">
                        <Checkbox
                          checked={selectedUnitTypes.includes(type)}
                          onCheckedChange={() => setSelectedUnitTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])}
                        />
                        <span className="text-sm text-foreground">{type}</span>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>

            <AreaDropdown minArea={minArea} maxArea={maxArea} onChange={(min, max) => { setMinArea(min); setMaxArea(max); }} />
            <RoomsDropdown value={rooms} onChange={setRooms} />
            <PriceDropdown minPrice={minPrice} maxPrice={maxPrice} onChange={(min, max) => { setMinPrice(min); setMaxPrice(max); }} />

            {/* Status dropdown */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-md hover:border-primary/50 transition-colors bg-background min-w-[100px]">
                  <span className={projectStatus ? 'text-foreground' : 'text-muted-foreground'}>
                    {projectStatus || 'Status'}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 ml-auto text-amber-500" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-52 p-1" align="start">
                <ScrollArea>
                  <div className="space-y-0.5">
                    {projectStatuses.map((s) => (
                      <label
                        key={s}
                        className="flex items-center gap-2 cursor-pointer py-1.5 px-2 rounded hover:bg-muted transition-colors"
                        onClick={() => setProjectStatus(prev => prev === s ? '' : s)}
                      >
                        <Checkbox checked={projectStatus === s} onCheckedChange={() => setProjectStatus(prev => prev === s ? '' : s)} />
                        <span className="text-sm text-foreground">{s}</span>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>

            {/* Filter button */}
            <button
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-md hover:border-primary/50 transition-colors bg-background text-foreground/70 hover:text-foreground"
              onClick={() => setFilterOpen(true)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filter
              {moreFilterCount > 0 && (
                <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full">
                  {moreFilterCount}
                </Badge>
              )}
            </button>

            {/* Amenities Dialog */}
            <Dialog open={filterOpen} onOpenChange={(v) => { setFilterOpen(v); if (!v) setAmenitySearch(''); }}>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <SlidersHorizontal className="h-5 w-5 text-primary" />
                    Amenities
                    {moreFilterCount > 0 && (
                      <Badge variant="default" className="ml-2">{moreFilterCount} selected</Badge>
                    )}
                  </DialogTitle>
                </DialogHeader>

                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={amenitySearch}
                    onChange={(e) => setAmenitySearch(e.target.value)}
                    placeholder="Search amenities..."
                    className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                  />
                </div>

                <Tabs defaultValue="interior" className="flex-1 flex flex-col overflow-hidden">
                  <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="interior" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <Lamp className="h-4 w-4" />
                      Interior
                      {interiorAmenities.length > 0 && (
                        <Badge variant="secondary" className="h-5 min-w-[20px] px-1 text-[10px] rounded-full">{interiorAmenities.length}</Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="exterior" className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      <TreePine className="h-4 w-4" />
                      Exterior
                      {exteriorAmenities.length > 0 && (
                        <Badge variant="secondary" className="h-5 min-w-[20px] px-1 text-[10px] rounded-full">{exteriorAmenities.length}</Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="interior" className="flex-1 overflow-hidden mt-3">
                    <div
                      className="overflow-y-auto h-full max-h-[45vh] -mx-1 px-1"
                      onWheel={(e) => { const el = e.currentTarget; if (el.scrollHeight <= el.clientHeight) return; e.stopPropagation(); }}
                    >
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {intAmenityOptions.filter(o => o.toLowerCase().includes(amenitySearch.toLowerCase())).length === 0 && (
                          <p className="col-span-full text-sm text-muted-foreground text-center py-8">No amenities found</p>
                        )}
                        {intAmenityOptions.filter(o => o.toLowerCase().includes(amenitySearch.toLowerCase())).map((opt) => {
                          const IconComp = getIcon(opt, 'interior');
                          const isChecked = interiorAmenities.includes(opt);
                          return (
                            <label
                              key={opt}
                              className={`flex items-center gap-2.5 cursor-pointer py-2.5 px-3 rounded-lg border transition-all duration-150 ${
                                isChecked
                                  ? 'border-primary/40 bg-primary/5'
                                  : 'border-border hover:border-primary/20 hover:bg-muted/40'
                              }`}
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => setInteriorAmenities(prev => prev.includes(opt) ? prev.filter(a => a !== opt) : [...prev, opt])}
                              />
                              <IconComp className={`h-4 w-4 shrink-0 ${isChecked ? 'text-primary' : 'text-muted-foreground'}`} />
                              <span className={`text-sm leading-tight ${isChecked ? 'text-foreground font-medium' : 'text-foreground'}`}>{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="exterior" className="flex-1 overflow-hidden mt-3">
                    <div
                      className="overflow-y-auto h-full max-h-[45vh] -mx-1 px-1"
                      onWheel={(e) => { const el = e.currentTarget; if (el.scrollHeight <= el.clientHeight) return; e.stopPropagation(); }}
                    >
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {extAmenityOptions.filter(o => o.toLowerCase().includes(amenitySearch.toLowerCase())).length === 0 && (
                          <p className="col-span-full text-sm text-muted-foreground text-center py-8">No amenities found</p>
                        )}
                        {extAmenityOptions.filter(o => o.toLowerCase().includes(amenitySearch.toLowerCase())).map((opt) => {
                          const IconComp = getIcon(opt, 'exterior');
                          const isChecked = exteriorAmenities.includes(opt);
                          return (
                            <label
                              key={opt}
                              className={`flex items-center gap-2.5 cursor-pointer py-2.5 px-3 rounded-lg border transition-all duration-150 ${
                                isChecked
                                  ? 'border-primary/40 bg-primary/5'
                                  : 'border-border hover:border-primary/20 hover:bg-muted/40'
                              }`}
                            >
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={() => setExteriorAmenities(prev => prev.includes(opt) ? prev.filter(a => a !== opt) : [...prev, opt])}
                              />
                              <IconComp className={`h-4 w-4 shrink-0 ${isChecked ? 'text-primary' : 'text-muted-foreground'}`} />
                              <span className={`text-sm leading-tight ${isChecked ? 'text-foreground font-medium' : 'text-foreground'}`}>{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex items-center justify-between pt-3 border-t border-border mt-3">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-primary">{moreFilterCount}</span> of {extAmenityOptions.length + intAmenityOptions.length} selected
                  </p>
                  <Button onClick={() => { setFilterOpen(false); setAmenitySearch(''); }}>
                    <Check className="h-4 w-4 mr-1.5" />
                    Done
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button className="h-10 px-6 font-semibold" onClick={handleSearch} disabled={isFetching}>
              {isFetching ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Search className="h-4 w-4 mr-1" />}
              Search
            </Button>
          </div>

          {/* Selected filter badges */}
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
                    const oldValues = selectedBadges[key] || [];
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
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4 flex-wrap">
          <Link to="/" className="hover:text-foreground transition-colors"><Home className="h-3.5 w-3.5" /></Link>
          <span className="text-muted-foreground/50">&gt;</span>
          {!location.province ? (
            <span className="text-foreground font-medium">Projects</span>
          ) : (
            <Link to="/projects" className="hover:text-foreground transition-colors">Projects</Link>
          )}
          {location.province && (
            <>
              <span className="text-muted-foreground/50">&gt;</span>
              {!location.district ? (
                <span className="text-foreground font-medium">{location.province} Projects</span>
              ) : (
                <Link to={`/projects?province=${encodeURIComponent(location.province)}`} className="hover:text-foreground transition-colors">
                  {location.province} Projects
                </Link>
              )}
            </>
          )}
          {location.district && (
            <>
              <span className="text-muted-foreground/50">&gt;</span>
              {!location.neighborhood ? (
                <span className="text-foreground font-medium">{location.district} Projects</span>
              ) : (
                <Link to={`/projects?province=${encodeURIComponent(location.province || '')}&district=${encodeURIComponent(location.district)}`} className="hover:text-foreground transition-colors">
                  {location.district} Projects
                </Link>
              )}
            </>
          )}
          {location.neighborhood && (
            <>
              <span className="text-muted-foreground/50">&gt;</span>
              <span className="text-foreground font-medium">{location.neighborhood} Projects</span>
            </>
          )}
        </div>

        {/* Results Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <h1 className="text-lg font-bold text-foreground">
            Projects in <span className="text-primary">{totalCount} Projects</span>
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
            </select>
            <button
              onClick={() => {
                const hasLocation = location.province || location.district || location.neighborhood;
                const hasFilters = hasLocation || keyword.trim() || Object.keys(selectedBadges).length > 0;
                if (!hasFilters) {
                  toast.error('Please select at least one filter before saving a search.');
                  return;
                }
                setSaveSearchOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-md hover:border-primary/50 transition-colors"
            >
              <Bookmark className="h-4 w-4" />
              Save Search
            </button>
            <div className="flex border border-border rounded-md overflow-hidden">
              <button onClick={() => { setViewMode('grid'); setCurrentPage(1); setFocusListingId(null); }} className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}>
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button onClick={() => { setViewMode('list'); setCurrentPage(1); setFocusListingId(null); }} className={`p-2 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}>
                <List className="h-4 w-4" />
              </button>
              <button onClick={() => { setViewMode('map'); setCurrentPage(1); setFocusListingId(null); }} className={`p-2 ${viewMode === 'map' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}>
                <Map className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading projects...</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg font-medium text-foreground mb-2">No projects found</p>
            <p className="text-muted-foreground">Try adjusting your filters or search criteria.</p>
          </div>
        ) : (
          /* Layout with side banner */
          <div className="flex gap-6">
            <div className="flex-1 min-w-0">
              {viewMode === 'grid' ? (
                <div className="space-y-6">
                  {Array.from({ length: Math.ceil(projects.length / 3) }, (_, chunkIdx) => {
                    const chunk = projects.slice(chunkIdx * 3, (chunkIdx + 1) * 3);
                    return (
                      <div key={chunkIdx}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {chunk.map((project) => (
                            <ProjectGridCard key={project.id} project={project} />
                          ))}
                        </div>
                        {chunkIdx < Math.ceil(projects.length / 3) - 1 && (
                          <div className="my-6">
                            <BannerDisplay pageName="projects" bannerType="horizontal" position={chunkIdx + 1} className="" />
                            <img src={horizontalBanners[chunkIdx % 2]} alt="Advertisement" className="w-full h-auto rounded-lg object-cover max-h-[160px]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : viewMode === 'list' ? (
                <div className="space-y-6">
                  {Array.from({ length: Math.ceil(projects.length / 4) }, (_, chunkIdx) => {
                    const chunk = projects.slice(chunkIdx * 4, (chunkIdx + 1) * 4);
                    return (
                      <div key={chunkIdx} className="space-y-6">
                        {chunk.map((project) => (
                          <ProjectListCard key={project.id} project={project} />
                        ))}
                        {chunkIdx < Math.ceil(projects.length / 4) - 1 && (
                          <div className="my-6">
                            <BannerDisplay pageName="projects" bannerType="horizontal" position={chunkIdx + 1} className="" />
                            <img src={horizontalBanners[chunkIdx % 2]} alt="Advertisement" className="w-full h-auto rounded-lg object-cover max-h-[160px]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <ListingMapView
                  listings={projects.map(p => ({
                    id: p.id,
                    title: p.title,
                    location: p.location || [p.neighbourhood, p.town, p.province].filter(Boolean).join(', ') || '',
                    image: p.images?.[0] || '/placeholder.svg',
                    price: p.min_price ?? 0,
                    currency: p.currency ?? 'TRY',
                    linkTo: `/projects/${p.id}`,
                    type: 'project' as const,
                    subtitle: p.developer ?? '',
                    meta: `${p.max_units ?? 0} Units`,
                    units: p.max_units ?? 0,
                  }))}
                  focusListingId={focusListingId}
                />
              )}
            </div>

            <div className="hidden lg:block w-[225px] shrink-0">
              <div className="sticky top-[160px]">
                <BannerDisplay pageName="projects" bannerType="vertical" className="" />
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

      <SaveSearchDialog
        open={saveSearchOpen}
        onOpenChange={setSaveSearchOpen}
        searchParams={committedParams as unknown as Record<string, unknown>}
        selectedFilters={selectedBadges}
        searchType="projects"
        location={location}
        keyword={keyword}
      />
    </div>
  );
};

const tagColorMap: Record<string, string> = {
  'Hot Deal': 'bg-red-500',
  'Price Drop': 'bg-green-600',
  'Exclusive': 'bg-purple-600',
  'New Launch': 'bg-teal-600',
};

function ProjectGridCard({ project }: { project: ProjectResult }) {
  const img = project.images?.[0] || '/placeholder.svg';
  const loc = project.location || [project.neighbourhood, project.town, project.province].filter(Boolean).join(', ');
  const tier = project.property_classification;
  const adTags = project.advertising_tags ?? [];
  return (
    <Link to={`/projects/${project.id}`}>
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
        <div className="relative aspect-[16/10] overflow-hidden">
          <img src={img} alt={project.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          {/* Tier badge + Ad tag — top left */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {tier === 'premium' && (
              <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-amber-500 shadow-md" title="Premium">
                <Crown className="h-4 w-4 text-white" />
              </span>
            )}
            {tier === 'featured' && (
              <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-gray-400 shadow-md" title="Featured">
                <Star className="h-4 w-4 text-white" />
              </span>
            )}
            {adTags.length > 0 && (
              <Badge className={`${tagColorMap[adTags[0]] || 'bg-orange-500'} hover:${tagColorMap[adTags[0]] || 'bg-orange-500'} text-white border-0 gap-1 text-[10px] uppercase font-bold`}>
                <Tag className="h-3 w-3" /> {adTags[0]}
              </Badge>
            )}
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-foreground mb-1">{project.title}</h3>
          <div className="flex items-center gap-1 text-muted-foreground text-xs mb-2">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span>{loc}</span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <p className="text-sm font-bold text-foreground">
              Starting from {(project.currency ?? 'TRY')} {(project.min_price ?? 0).toLocaleString()}
            </p>
            {project.completion_date && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{project.completion_date}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
function ProjectListCard({ project }: { project: ProjectResult }) {
  const images = project.images && project.images.length > 0 ? project.images : ['/placeholder.svg'];
  const loc = project.location || [project.neighbourhood, project.town, project.province].filter(Boolean).join(', ');
  const [currentImage, setCurrentImage] = useState(0);
  const tier = project.property_classification;
  const adTags = project.advertising_tags ?? [];

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const sideImages = images.length > 1 ? images.filter((_, i) => i !== currentImage).slice(0, 2) : [];
  const descriptionSnippet = project.description
    ? project.description.replace(/[#*_~`>]/g, '').slice(0, 180) + (project.description.length > 180 ? '…' : '')
    : null;

  return (
    <Link to={`/projects/${project.id}`} className="block">
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group">
        <div className="flex flex-col lg:flex-row">
          {/* Image mosaic area */}
          <div className="relative w-full lg:w-[520px] xl:w-[580px] shrink-0">
            {/* Top overlay: photo count + status + tier icons */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-2 px-3 py-2 bg-gradient-to-b from-foreground/60 to-transparent">
              <div className="flex items-center gap-1.5 bg-foreground/70 text-white text-xs px-2 py-1 rounded">
                <Camera className="h-3 w-3" />
                <span>{currentImage + 1}/{images.length}</span>
              </div>
              {project.project_status && (
                <span className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold uppercase px-2.5 py-1 rounded shadow-sm">
                  {project.project_status}
                </span>
              )}
              {/* Tier icons */}
              {tier === 'premium' && (
                <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-amber-500 shadow-md ml-auto" title="Premium">
                  <Crown className="h-4 w-4 text-white" />
                </span>
              )}
              {tier === 'featured' && (
                <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-gray-400 shadow-md ml-auto" title="Featured">
                  <Star className="h-4 w-4 text-white" />
                </span>
              )}
            </div>

            {/* Advertising tag — bottom-right of image */}
            {adTags.length > 0 && (
              <div className="absolute bottom-[44px] right-2 z-10">
                <Badge className={`${tagColorMap[adTags[0]] || 'bg-orange-500'} hover:${tagColorMap[adTags[0]] || 'bg-orange-500'} text-white border-0 gap-1 text-[10px] uppercase font-bold shadow-md`}>
                  <Tag className="h-3 w-3" /> {adTags[0]}
                </Badge>
              </div>
            )}

            <div className="flex h-[220px] lg:h-[260px]">
              {/* Main large image */}
              <div className="relative flex-[1.6] overflow-hidden">
                <img
                  src={images[currentImage]}
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {images.length > 1 && (
                  <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-foreground/50 hover:bg-foreground/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )}
                {/* Right arrow on mobile (no side images) */}
                {images.length > 1 && (
                  <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-foreground/50 hover:bg-foreground/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity lg:hidden">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Two stacked side images */}
              {sideImages.length > 0 && (
                <div className="hidden lg:flex flex-col flex-1 gap-[2px] ml-[2px]">
                  <div className="relative flex-1 overflow-hidden">
                    <img
                      src={sideImages[0]}
                      alt={`${project.title} 2`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="relative flex-1 overflow-hidden">
                    <img
                      src={sideImages[1] || sideImages[0]}
                      alt={`${project.title} 3`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Right arrow — exact opposite of left arrow */}
                    {images.length > 1 && (
                      <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-foreground/50 hover:bg-foreground/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Price bar */}
            <div className="bg-primary px-4 py-2 flex items-center justify-between">
              <span className="text-lg font-bold text-primary-foreground">
                Starting from {project.currency ?? 'TRY'} {(project.min_price ?? 0).toLocaleString()}
              </span>
              {project.completion_date && (
                <span className="flex items-center gap-1.5 text-sm text-primary-foreground/90">
                  <Calendar className="h-3.5 w-3.5" /> {project.completion_date}
                </span>
              )}
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 p-5 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground mb-0.5 line-clamp-1 group-hover:text-primary transition-colors">{project.title}</h3>
              <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-3">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="line-clamp-1">{loc}</span>
              </div>
              <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1.5">
                  <Building className="h-4 w-4" />
                  <span className="font-medium text-foreground">{project.project_type}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Maximize className="h-4 w-4" />
                  <span className="font-medium text-foreground">{project.max_units ?? 0} Units</span>
                </span>
              </div>
              {descriptionSnippet && (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-3">{descriptionSnippet}</p>
              )}
              {project.tagline && (
                <p className="text-xs italic text-muted-foreground/80">{project.tagline}</p>
              )}
            </div>

            {/* Footer bar */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
              <div className="flex items-center gap-3">
                {project.logo_url && (
                  <img
                    src={project.logo_url}
                    alt={project.developer ?? project.title}
                    className="h-9 w-auto max-w-[100px] rounded object-contain border border-border px-2 py-1 bg-background"
                  />
                )}
                {project.developer && (
                  <span className="text-xs text-muted-foreground max-w-[140px] truncate">{project.developer}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button className="flex items-center justify-center gap-1.5 text-primary hover:bg-secondary px-3 py-2 rounded-lg text-sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                  <Phone className="h-4 w-4" /> Call
                </button>
                <div className="w-px h-5 bg-border" />
                <button className="flex items-center justify-center gap-1.5 text-primary hover:bg-secondary px-3 py-2 rounded-lg text-sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                  <Mail className="h-4 w-4" /> Email
                </button>
                <div className="w-px h-5 bg-border" />
                <button className="flex items-center justify-center gap-1.5 text-primary hover:bg-secondary px-3 py-2 rounded-lg text-sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                  <Heart className="h-4 w-4" /> Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ProjectsPage;
