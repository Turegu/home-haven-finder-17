import { useState, useEffect, useCallback, lazy } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Search, LayoutGrid, List, Map, ChevronLeft, ChevronRight,
  ChevronDown, CalendarDays, Loader2, X, Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BannerDisplay from '@/components/BannerDisplay';
import LocationPicker from '@/components/LocationPicker';
const ListingMapView = lazy(() => import('@/components/ListingMapView'));
import EventListCard from '@/components/EventListCard';
import EventGridCard from '@/components/EventGridCard';
import { useFilterOptions } from '@/hooks/useFilterOptions';
import { useEventSearch, type EventSearchParams } from '@/hooks/useEventSearch';

const EventsPage = () => {
  const { options: fo } = useFilterOptions('search');
  const eventTypes = fo['event_types'] || [];
  const routeLocation = useLocation();

  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('list');
  const [focusListingId, setFocusListingId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEventType, setSelectedEventType] = useState('');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [location, setLocation] = useState<{ province?: string; district?: string; neighborhood?: string }>({});
  const [keyword, setKeyword] = useState('');

  // Reset all filters when navigating to /events (e.g. clicking nav link)
  useEffect(() => {
    setKeyword('');
    setSelectedEventType('');
    setDateRange({});
    setLocation({});
    setSortBy('newest');
    setCurrentPage(1);
    setCommittedParams({ sortBy: 'newest', page: 1, pageSize: LIST_ITEMS });
  }, [routeLocation.key]);

  const GRID_ITEMS = 15;
  const LIST_ITEMS = 12;
  const itemsPerPage = viewMode === 'grid' ? GRID_ITEMS : LIST_ITEMS;

  const [committedParams, setCommittedParams] = useState<EventSearchParams>({
    sortBy: 'newest',
    page: 1,
    pageSize: LIST_ITEMS,
  });

  useEffect(() => { document.title = 'Events | Turegu'; }, []);

  const { data, isLoading, isFetching } = useEventSearch(committedParams);
  const allEvents = data?.events ?? [];
  const totalCount = data?.total ?? 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleSearch = useCallback(() => {
    const params: EventSearchParams = {
      province: location.province,
      district: location.district,
      neighborhood: location.neighborhood,
      keyword: keyword.trim() || undefined,
      eventType: selectedEventType || undefined,
      dateFrom: dateRange.from?.toISOString(),
      dateTo: dateRange.to?.toISOString(),
      sortBy,
      page: 1,
      pageSize: viewMode === 'grid' ? GRID_ITEMS : LIST_ITEMS,
    };
    setCommittedParams(params);
    setCurrentPage(1);
  }, [location, keyword, selectedEventType, dateRange, sortBy, viewMode]);

  useEffect(() => {
    setCommittedParams(prev => ({ ...prev, sortBy, page: currentPage, pageSize: viewMode === 'grid' ? GRID_ITEMS : LIST_ITEMS }));
  }, [sortBy, currentPage, viewMode]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Search Bar */}
      <div className="sticky top-[104px] z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <LocationPicker value={location} onChange={setLocation} compact />
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search events by name, venue..."
                className="w-full h-10 pl-3 pr-8 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
              />
              {keyword && (
                <button onClick={() => setKeyword('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Event Type Dropdown */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 border border-border rounded-md px-3 py-2 h-10 min-w-[180px] text-sm hover:border-primary/50 transition-colors bg-background">
                  <span className={!selectedEventType ? 'text-muted-foreground' : 'text-foreground'}>
                    {selectedEventType || 'Event Type'}
                  </span>
                  <ChevronDown className="h-3 w-3 ml-auto text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <div className="space-y-0.5">
                  {eventTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedEventType(prev => prev === type ? '' : type)}
                      className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-colors ${
                        selectedEventType === type
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Date Range Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-2 border border-border rounded-md px-3 py-2 h-10 min-w-[160px] text-sm hover:border-primary/50 transition-colors bg-background">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span className={dateRange.from ? 'text-foreground' : 'text-muted-foreground'}>
                    {dateRange.from
                      ? `${dateRange.from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}${dateRange.to ? ` - ${dateRange.to.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}`
                      : 'Date Range'}
                  </span>
                  <ChevronDown className="h-3 w-3 ml-auto text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange.from ? { from: dateRange.from, to: dateRange.to } : undefined}
                  onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                  numberOfMonths={1}
                />
                <div className="p-3 border-t border-border flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setDateRange({})}>Clear</Button>
                </div>
              </PopoverContent>
            </Popover>

            <Button className="h-10 px-6 font-semibold" onClick={handleSearch} disabled={isFetching}>
              {isFetching ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Search className="h-4 w-4 mr-1" />}
              Search
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>{'>'}</span>
          <span className="text-primary font-medium">Events</span>
        </div>

        {/* Results Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <h1 className="text-lg font-bold text-foreground">
            Public Gatherings & Events <span className="text-primary">({totalCount})</span>
          </h1>
          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex items-center gap-1 px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="newest">Newest First</option>
              <option value="date_asc">Date: Earliest</option>
              <option value="date_desc">Date: Latest</option>
            </select>
            <div className="flex border border-border rounded-md overflow-hidden">
              {[
                { mode: 'grid' as const, icon: LayoutGrid },
                { mode: 'list' as const, icon: List },
                { mode: 'map' as const, icon: Map },
              ].map(({ mode, icon: Icon }) => (
                <button
                  key={mode}
                  onClick={() => { setViewMode(mode); setCurrentPage(1); setFocusListingId(null); }}
                  className={`p-2 ${viewMode === mode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Loading events...</span>
          </div>
        ) : allEvents.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg font-medium text-foreground mb-2">No events found</p>
            <p className="text-muted-foreground">Try adjusting your filters or search criteria.</p>
          </div>
        ) : (
          <div className="flex gap-6">
            <div className="flex-1 min-w-0">
              {viewMode === 'grid' ? (
                <div className="space-y-6">
                  {Array.from({ length: Math.ceil(allEvents.length / 3) }, (_, chunkIdx) => {
                    const chunk = allEvents.slice(chunkIdx * 3, (chunkIdx + 1) * 3);
                    return (
                      <div key={chunkIdx}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {chunk.map((event) => (
                            <EventGridCard key={event.id} event={event} />
                          ))}
                        </div>
                        {chunkIdx < Math.ceil(allEvents.length / 3) - 1 && chunkIdx % 2 === 1 && (
                          <div className="my-6">
                            <BannerDisplay pageName="events" bannerType="horizontal" position={chunkIdx + 1} className="" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : viewMode === 'list' ? (
                <div className="space-y-6">
                  {Array.from({ length: Math.ceil(allEvents.length / 4) }, (_, chunkIdx) => {
                    const chunk = allEvents.slice(chunkIdx * 4, (chunkIdx + 1) * 4);
                    return (
                      <div key={chunkIdx} className="space-y-6">
                        {chunk.map((event) => (
                          <EventListCard
                            key={event.id}
                            event={event}
                            onLocationClick={(id) => { setFocusListingId(id); setViewMode('map'); }}
                          />
                        ))}
                        {chunkIdx < Math.ceil(allEvents.length / 4) - 1 && (
                          <div className="my-6">
                            <BannerDisplay pageName="events" bannerType="horizontal" position={chunkIdx + 1} className="" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <ListingMapView
                  listings={allEvents.map(e => ({
                    id: e.id,
                    title: e.title,
                    location: e.location || [e.neighbourhood, e.town, e.province].filter(Boolean).join(', ') || '',
                    image: e.images?.[0] || '/placeholder.svg',
                    price: e.price ?? 0,
                    currency: e.currency ?? 'USD',
                    linkTo: `/events/${e.id}`,
                    type: 'event' as const,
                    subtitle: e.organizer || e.companies?.name || '',
                    meta: `${e.event_type.replace(/_/g, ' ')} • ${e.event_date ? new Date(e.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBA'}`,
                    logo: e.companies?.logo_url || e.logo_url || '',
                  }))}
                  focusListingId={focusListingId}
                />
              )}
            </div>

            {/* Vertical Sidebar Banner */}
            <div className="hidden lg:block w-[225px] shrink-0">
              <div className="sticky top-[160px]">
                <BannerDisplay pageName="events" bannerType="vertical" />
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

export default EventsPage;
