import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, LayoutGrid, List, Map,
  MapPin, Building, Maximize, Phone, Mail, MessageCircle, Heart, Layers, SlidersHorizontal, Loader2,
  TreePine, Lamp, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { getIcon } from '@/components/AmenitiesViewAllDialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BannerDisplay from '@/components/BannerDisplay';
import ListingMapView from '@/components/ListingMapView';
import LocationPicker from '@/components/LocationPicker';
import AreaDropdown from '@/components/AreaDropdown';
import RoomsDropdown from '@/components/RoomsDropdown';
import PriceDropdown from '@/components/PriceDropdown';
import { SelectedFilterBadges } from '@/components/SearchFilters';
import { useFilterOptions } from '@/hooks/useFilterOptions';
import { useProjectSearch, type ProjectSearchParams, type ProjectResult } from '@/hooks/useProjectSearch';

const ProjectsPage = () => {
  const { options: fo } = useFilterOptions("search");
  const unitTypes = fo["project_unit_types"] || [];
  const projectStatuses = fo["project_statuses"] || [];
  const extAmenityOptions = fo["exterior_amenities"] || [];
  const intAmenityOptions = fo["interior_amenities"] || [];

  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('list');
  const [sortBy, setSortBy] = useState('newest');
  const [location, setLocation] = useState<{ province?: string; district?: string; neighborhood?: string }>({});
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

  const [committedParams, setCommittedParams] = useState<ProjectSearchParams>({
    sortBy: 'newest',
    page: 1,
    pageSize: 21,
  });

  const { data, isLoading, isFetching } = useProjectSearch(committedParams);
  const projects = data?.projects ?? [];
  const totalCount = data?.total ?? 0;

  useEffect(() => { document.title = 'Projects | Turegu'; }, []);

  // Re-query on sort/page change
  useEffect(() => {
    setCommittedParams(prev => ({ ...prev, sortBy, page: currentPage }));
  }, [sortBy, currentPage]);

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
      pageSize: 21,
    });
    setCurrentPage(1);
  }, [location, keyword, selectedUnitTypes, minPrice, maxPrice, minArea, maxArea, rooms, projectStatus, exteriorAmenities, interiorAmenities, sortBy]);

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

  return (
    <div className="min-h-screen bg-background">
      <Header />

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
                className="w-full h-10 pl-3 pr-4 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
              />
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

            {/* Status dropdown - same design as Unit Type */}
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
                        onClick={() => setProjectStatus(s === 'Any' ? '' : s)}
                      >
                        <Checkbox checked={projectStatus === s || (s === 'Any' && !projectStatus)} onCheckedChange={() => setProjectStatus(s === 'Any' ? '' : s)} />
                        <span className="text-sm text-foreground">{s}</span>
                      </label>
                    ))}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
            {/* Filter button - opens amenities dialog directly */}
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

          {hasBadges && (
            <div className="pt-2 pb-1">
              <SelectedFilterBadges
                selectedFilters={selectedBadges}
                onFiltersChange={(updated) => {
                  Object.keys(selectedBadges).forEach(key => {
                    const removed = (selectedBadges[key] || []).filter(v => !(updated[key] || []).includes(v));
                    removed.forEach(v => {
                      if (key === 'Unit Type') setSelectedUnitTypes(prev => prev.filter(t => t !== v));
                      else if (key === 'Area') { setMinArea(''); setMaxArea(''); }
                      else if (key === 'Rooms') setRooms(prev => prev.filter(r => r !== v));
                      else if (key === 'Price') { setMinPrice(''); setMaxPrice(''); }
                      else if (key === 'Status') setProjectStatus('');
                      else if (key === 'Amenities') {
                        setExteriorAmenities(prev => prev.filter(a => a !== v));
                        setInteriorAmenities(prev => prev.filter(a => a !== v));
                      }
                    });
                  });
                }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>{'>'}</span>
          <span className="text-primary font-medium">Projects</span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <h1 className="text-lg font-bold text-foreground">
            <span className="text-primary">{totalCount}</span> Projects
          </h1>
          <div className="flex items-center gap-3">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="flex items-center gap-1 px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
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
          <div className="flex gap-6">
            <div className="flex-1 min-w-0">
              {viewMode === 'list' ? (
                <div className="space-y-6">
                  {projects.map((project) => (
                    <ProjectListCard key={project.id} project={project} />
                  ))}
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((project) => (
                    <ProjectGridCard key={project.id} project={project} />
                  ))}
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
                />
              )}
            </div>

            <div className="hidden lg:block w-[225px] shrink-0">
              <div className="sticky top-[160px]">
                <BannerDisplay pageName="projects" bannerType="vertical" />
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

function ProjectGridCard({ project }: { project: ProjectResult }) {
  const img = project.images?.[0] || '/placeholder.svg';
  const loc = project.location || [project.neighbourhood, project.town, project.province].filter(Boolean).join(', ');
  return (
    <Link to={`/projects/${project.id}`}>
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
        <div className="relative aspect-[16/10] overflow-hidden">
          <img src={img} alt={project.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-foreground mb-1">{project.title}</h3>
          <div className="flex items-center gap-1 text-muted-foreground text-xs mb-2">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span>{loc}</span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <p className="text-sm font-bold text-foreground">
              Starting From {(project.currency ?? 'TRY')} {(project.min_price ?? 0).toLocaleString()}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Building className="h-3.5 w-3.5" />
              <span>{project.max_units ?? 0} Units</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ProjectListCard({ project }: { project: ProjectResult }) {
  const img = project.images?.[0] || '/placeholder.svg';
  const loc = project.location || [project.neighbourhood, project.town, project.province].filter(Boolean).join(', ');
  return (
    <Link to={`/projects/${project.id}`}>
      <div className="flex flex-col md:flex-row bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-all group">
        <div className="relative w-full md:w-[360px] aspect-[4/3] md:aspect-auto md:h-auto shrink-0 overflow-hidden">
          <img src={img} alt={project.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute top-2 right-2 flex gap-1.5">
            <button className="bg-background/90 hover:bg-background text-foreground/70 p-1.5 rounded-full shadow-sm"><Layers className="h-4 w-4" /></button>
            <button className="bg-background/90 hover:bg-background text-foreground/70 p-1.5 rounded-full shadow-sm"><Heart className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold text-foreground mb-1">{project.title}</h3>
            <p className="text-sm text-muted-foreground mb-2">{project.developer}</p>
            <div className="flex items-center gap-1 text-muted-foreground text-sm mb-4">
              <MapPin className="h-4 w-4 text-primary" />
              <span>{loc}</span>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Building className="h-4 w-4" /><span>{project.project_type}</span></span>
              <span className="flex items-center gap-1.5"><Maximize className="h-4 w-4" /><span>{project.max_units ?? 0} Units</span></span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
            <span className="text-lg font-bold text-foreground">
              <span className="text-xs font-normal text-muted-foreground mr-1">Starting From</span>
              {project.currency ?? 'TRY'} {(project.min_price ?? 0).toLocaleString()}
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1"><Phone className="h-3.5 w-3.5" /> Call</Button>
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1"><Mail className="h-3.5 w-3.5" /> Email</Button>
              <Button size="sm" className="h-8 text-xs gap-1 bg-primary hover:bg-primary/90"><MessageCircle className="h-3.5 w-3.5" /> Whatsapp</Button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ProjectsPage;
