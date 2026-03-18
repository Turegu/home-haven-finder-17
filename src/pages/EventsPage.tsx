import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin, Search, Clock, CalendarDays, Phone, Mail, Heart,
  Layers, LayoutGrid, List, Map, ChevronRight, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BannerDisplay from '@/components/BannerDisplay';
import { mockEvents } from '@/data/mockEvents';
import ListingMapView from '@/components/ListingMapView';

const EventsPage = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('list');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => { document.title = 'Events | Turegu'; }, []);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Search Bar */}
      <div className="border-b border-border bg-background sticky top-[104px] z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 border border-border rounded-md px-3 py-2 min-w-[160px]">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Location</span>
              <ChevronDown className="h-3 w-3 ml-auto text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder="Enter Search Area, City, Address"
              className="flex-1 min-w-[200px] border border-border rounded-md px-3 py-2 text-sm bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex items-center gap-2 border border-border rounded-md px-3 py-2 min-w-[140px]">
              <span className="text-sm text-muted-foreground">Event Type</span>
              <ChevronDown className="h-3 w-3 ml-auto text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2 border border-border rounded-md px-3 py-2 min-w-[160px]">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Date Range</span>
              <ChevronDown className="h-3 w-3 ml-auto text-muted-foreground" />
            </div>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-6">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb & Controls */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Link to="/" className="hover:text-primary">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-primary font-medium">Events</span>
            </div>
            <p className="text-sm text-muted-foreground">{mockEvents.length} Events</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 border border-border rounded-md px-3 py-2">
              <span className="text-sm text-muted-foreground">Sort By</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </div>
            <div className="flex border border-border rounded-md overflow-hidden">
              {[
                { mode: 'grid' as const, icon: LayoutGrid },
                { mode: 'list' as const, icon: List },
                { mode: 'map' as const, icon: Map },
              ].map(({ mode, icon: Icon }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`p-2 ${viewMode === mode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content with sidebar banner */}
        <div className="flex gap-6">
          <div className="flex-1">
            {viewMode === 'map' ? (
              <ListingMapView
                listings={mockEvents.map(e => ({
                  id: e.id,
                  title: e.title,
                  location: e.location,
                  image: e.images[0],
                  price: e.price,
                  currency: e.currency,
                  linkTo: `/events/${e.id}`,
                  type: 'event' as const,
                  subtitle: e.organizer,
                  meta: `${e.eventType} • ${new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
                  logo: e.organizerLogo,
                }))}
              />
            ) : (
              <>
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-4'}>
                  {mockEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow ${
                        viewMode === 'list' ? 'flex flex-col md:flex-row' : ''
                      }`}
                    >
                      <div className={`relative ${viewMode === 'list' ? 'md:w-[360px] md:min-h-[220px]' : ''}`}>
                        <Link to={`/events/${event.id}`}>
                          <img
                            src={event.images[0]}
                            alt={event.title}
                            className={`w-full object-cover ${viewMode === 'list' ? 'h-[200px] md:h-full' : 'h-[200px]'}`}
                          />
                        </Link>
                        <div className="absolute top-3 right-3 flex gap-2">
                          <button className="p-1.5 bg-background/80 backdrop-blur-sm rounded-md hover:bg-background">
                            <Layers className="h-4 w-4 text-foreground/70" />
                          </button>
                          <button className="p-1.5 bg-background/80 backdrop-blur-sm rounded-md hover:bg-background">
                            <Heart className="h-4 w-4 text-foreground/70" />
                          </button>
                        </div>
                        {event.organizerLogo && (
                          <img
                            src={event.organizerLogo}
                            alt={event.organizer}
                            className="absolute bottom-3 right-3 w-10 h-10 rounded-full border-2 border-background object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 p-4">
                        <Link to={`/events/${event.id}`}>
                          <h3 className="text-lg font-semibold text-foreground hover:text-primary transition-colors mb-2">
                            {event.title}
                          </h3>
                        </Link>
                        <div className="flex items-start gap-1.5 mb-3">
                          <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span className="text-sm text-muted-foreground line-clamp-1">{event.location}</span>
                        </div>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{event.eventType}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{formatDate(event.date)}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-border">
                          <span className="text-lg font-bold text-foreground">
                            {event.price ? `$ ${event.price.toLocaleString()}` : 'Open Invitation'}
                          </span>
                          <div className="flex items-center gap-2">
                            <button className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20">
                              <Phone className="h-4 w-4" />
                            </button>
                            <button className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20">
                              <Mail className="h-4 w-4" />
                            </button>
                            <button className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200">
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <BannerDisplay pageName="events" bannerType="horizontal" className="mt-6" />
              </>
            )}
          </div>

          {/* Vertical Sidebar Banner */}
          <div className="hidden lg:block w-[225px] shrink-0">
            <div className="sticky top-[160px]">
              <BannerDisplay pageName="events" bannerType="vertical" />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default EventsPage;
