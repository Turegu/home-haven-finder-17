import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, ChevronDown, LayoutGrid, List, Map,
  MapPin, Building, Maximize, Phone, Mail, MessageCircle, Heart, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BannerDisplay from '@/components/BannerDisplay';
import SearchFilters from '@/components/SearchFilters';
import ListingMapView from '@/components/ListingMapView';
import { mockProjects } from '@/data/mockProperties';

const ProjectsPage = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('list');
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Search Bar with dynamic filters */}
      <div className="sticky top-[104px] z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4 py-3 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 px-3 py-2 text-sm border border-border rounded-md bg-background min-w-[120px]">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-foreground/70">Location</span>
            <ChevronDown className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Enter Search Area, City, Address"
              className="w-full h-10 pl-3 pr-4 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>
          <SearchFilters
            context="project"
            selectedFilters={selectedFilters}
            onFiltersChange={setSelectedFilters}
            quickFilterKeys={["project_types", "project_unit_types", "rooms", "exterior_amenities"]}
          />
          <Button className="h-10 px-6 font-semibold">
            <Search className="h-4 w-4 mr-1" />
            Search
          </Button>
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
            <div className="flex items-center gap-1 px-3 py-2 text-sm border border-border rounded-md bg-background">
              <span className="text-muted-foreground">Sort By</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
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
