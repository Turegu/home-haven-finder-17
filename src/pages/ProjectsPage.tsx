import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, LayoutGrid, List, Map,
  MapPin, Building, Maximize, Phone, Mail, MessageCircle, Heart, Layers, SlidersHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
import { mockProjects } from '@/data/mockProperties';

const unitTypes = [
  'Apartment', 'Penthouse', 'Restaurant/Café', 'Duplex', 'Townhouse',
  'Store', 'Office', 'Shop', 'Villa', 'Showroom',
];

const projectStatuses = ['Shell And Core', 'Under Construction', 'Renovated', 'Second-Hand', 'New', 'Any'];

const projectAmenities = [
  'Close to schools', 'Close to a park', 'Close to public transport',
  'Earthquake Regulations Compliant', 'Generator', 'Fire Lift',
  'Metal Detector', 'Security Camera', 'Security', 'Card Access System',
  'Shower cabin', 'Beach nearby', 'Beachfront', 'Private beach', 'Beach access',
];

const ProjectsPage = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('list');
  const [sortBy, setSortBy] = useState('newest');
  const [location, setLocation] = useState<{ province?: string; district?: string; neighborhood?: string }>({});
  const [selectedUnitTypes, setSelectedUnitTypes] = useState<string[]>([]);
  const [minArea, setMinArea] = useState('');
  const [maxArea, setMaxArea] = useState('');
  const [rooms, setRooms] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [projectStatus, setProjectStatus] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  useEffect(() => { document.title = 'Projects | Turegu'; }, []);

  // Build badges
  const selectedBadges: Record<string, string[]> = {};
  if (selectedUnitTypes.length > 0) selectedBadges['Unit Type'] = selectedUnitTypes;
  if (minArea || maxArea) selectedBadges['Area'] = [`${minArea || '0'} - ${maxArea || '∞'} m²`];
  if (rooms.length > 0) selectedBadges['Rooms'] = rooms;
  if (minPrice || maxPrice) selectedBadges['Price'] = [`$${minPrice || '0'} - $${maxPrice || '∞'}`];
  if (projectStatus && projectStatus !== 'Any') selectedBadges['Status'] = [projectStatus];
  if (selectedAmenities.length > 0) selectedBadges['Amenities'] = selectedAmenities;

  const hasBadges = Object.keys(selectedBadges).length > 0;
  const moreFilterCount = (projectStatus && projectStatus !== 'Any' ? 1 : 0) + selectedAmenities.length;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Search Bar with project-specific filters */}
      <div className="sticky top-[104px] z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <LocationPicker value={location} onChange={setLocation} compact />
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Enter Search Area, City, Address"
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
                  <ChevronDown className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-52 p-1" align="start">
                <ScrollArea className="max-h-[250px]">
                  <div className="space-y-0.5">
                    {unitTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setSelectedUnitTypes(prev =>
                            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                          );
                        }}
                        className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${
                          selectedUnitTypes.includes(type)
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>

            <AreaDropdown minArea={minArea} maxArea={maxArea} onChange={(min, max) => { setMinArea(min); setMaxArea(max); }} />
            <RoomsDropdown value={rooms} onChange={setRooms} />
            <PriceDropdown minPrice={minPrice} maxPrice={maxPrice} onChange={(min, max) => { setMinPrice(min); setMaxPrice(max); }} />

            {/* Filter (More) button */}
            <Dialog>
              <DialogTrigger asChild>
                <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-md hover:border-primary/50 transition-colors bg-background text-foreground/70 hover:text-foreground">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filter
                  {moreFilterCount > 0 && (
                    <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full">
                      {moreFilterCount}
                    </Badge>
                  )}
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[480px] max-h-[85vh] flex flex-col p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
                  <DialogTitle>Filter</DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex-1 px-6 py-4">
                  <div className="space-y-6">
                    {/* Status */}
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2">Status</h4>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="flex items-center justify-between w-full px-3 py-2 text-sm border border-border rounded-md bg-background">
                            <span className={projectStatus ? 'text-foreground' : 'text-muted-foreground'}>
                              {projectStatus || 'Select Status'}
                            </span>
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-1" align="start">
                          {projectStatuses.map((s) => (
                            <button
                              key={s}
                              onClick={() => setProjectStatus(s === 'Any' ? '' : s)}
                              className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${
                                projectStatus === s ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Amenities */}
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2">Amenities</h4>
                      <div className="space-y-1">
                        {projectAmenities.map((amenity) => (
                          <label key={amenity} className="flex items-center gap-2 cursor-pointer py-1.5 px-2 rounded hover:bg-muted transition-colors">
                            <Checkbox
                              checked={selectedAmenities.includes(amenity)}
                              onCheckedChange={() => {
                                setSelectedAmenities(prev =>
                                  prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
                                );
                              }}
                            />
                            <span className="text-sm text-foreground">{amenity}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
                <div className="px-6 py-4 border-t border-border">
                  <Button className="w-full" size="lg">Apply</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button className="h-10 px-6 font-semibold">
              <Search className="h-4 w-4 mr-1" />
              Search
            </Button>
          </div>

          {/* Selected filter badges */}
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
                      else if (key === 'Amenities') setSelectedAmenities(prev => prev.filter(a => a !== v));
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
            <span className="text-primary">{mockProjects.length}</span> Projects
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

        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            {viewMode === 'list' ? (
              <div className="space-y-4">
                {Array.from({ length: Math.ceil(mockProjects.length / 7) }, (_, chunkIdx) => {
                  const chunk = mockProjects.slice(chunkIdx * 7, (chunkIdx + 1) * 7);
                  return (
                    <div key={chunkIdx} className="space-y-4">
                      {chunk.map((project) => (
                        <ProjectListCard key={project.id} project={project} />
                      ))}
                      {chunkIdx < Math.ceil(mockProjects.length / 7) - 1 && (
                        <BannerDisplay pageName="projects" bannerType="horizontal" position={chunkIdx + 1} className="my-4" />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="space-y-6">
                {Array.from({ length: Math.ceil(mockProjects.length / 7) }, (_, chunkIdx) => {
                  const chunk = mockProjects.slice(chunkIdx * 7, (chunkIdx + 1) * 7);
                  return (
                    <div key={chunkIdx}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {chunk.map((project) => (
                          <Link key={project.id} to={`/projects/${project.id}`}>
                            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                              <div className="relative aspect-[16/10] overflow-hidden">
                                <img src={project.image} alt={project.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                              </div>
                              <div className="p-4">
                                <h3 className="font-semibold text-foreground mb-1">{project.title}</h3>
                                <div className="flex items-center gap-1 text-muted-foreground text-xs mb-2">
                                  <MapPin className="h-3.5 w-3.5 text-primary" />
                                  <span>{project.location}</span>
                                </div>
                                <div className="flex items-center justify-between pt-3 border-t border-border">
                                  <p className="text-sm font-bold text-foreground">Starting From ${project.priceFrom.toLocaleString()}</p>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Building className="h-3.5 w-3.5" />
                                    <span>{project.units} Units</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                      {chunkIdx < Math.ceil(mockProjects.length / 7) - 1 && (
                        <BannerDisplay pageName="projects" bannerType="horizontal" position={chunkIdx + 1} className="my-6" />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <ListingMapView
                listings={mockProjects.map(p => ({
                  id: p.id,
                  title: p.title,
                  location: p.location,
                  image: p.image,
                  price: p.priceFrom,
                  currency: p.currency,
                  linkTo: `/projects/${p.id}`,
                  type: 'project' as const,
                  subtitle: p.developer,
                  meta: `${p.units} Units`,
                  units: p.units,
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
      </div>

      <Footer />
    </div>
  );
};

const ProjectListCard = ({ project }: { project: typeof mockProjects[0] }) => (
  <Link to={`/projects/${project.id}`}>
    <div className="flex flex-col md:flex-row bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-all group">
      <div className="relative w-full md:w-[360px] aspect-[4/3] md:aspect-auto md:h-auto shrink-0 overflow-hidden">
        <img src={project.image} alt={project.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
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
            <span>{project.location}</span>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Building className="h-4 w-4" /><span>Type of Project</span></span>
            <span className="flex items-center gap-1.5"><Maximize className="h-4 w-4" /><span>{project.units} Units</span></span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
          <span className="text-lg font-bold text-foreground">
            <span className="text-xs font-normal text-muted-foreground mr-1">Starting From</span>
            ${project.priceFrom.toLocaleString()}
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

export default ProjectsPage;
