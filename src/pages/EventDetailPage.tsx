import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, Clock, CalendarDays, Phone, Mail, Heart,
  ChevronLeft, ChevronRight, Camera, Video, Home,
  MessageCircle, PersonStanding, X, Building, DollarSign, Users, Ticket, FileDown, Timer
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BannerDisplay from '@/components/BannerDisplay';
import ContactCompanyDialog from '@/components/ContactCompanyDialog';
import NearbyPlacesMap from '@/components/NearbyPlacesMap';
import StreetView from '@/components/StreetView';
import { getEventTypeIcon } from '@/data/eventTypes';
import { supabase } from '@/integrations/supabase/client';
import { getCoordsFromLocation } from '@/lib/mapConstants';
import ShareDropdown from '@/components/ShareDropdown';
import PropertyDetailSkeleton from '@/components/PropertyDetailSkeleton';
import SEOHead from '@/components/SEOHead';

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [realAgentId, setRealAgentId] = useState<string | null>(null);
  const [realCompanyId, setRealCompanyId] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('photos');
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchEvent = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('events')
        .select('*, agents(id, name, designation, avatar_url, languages, companies(id, name, logo_url)), companies(id, name, logo_url)')
        .eq('id', id)
        .maybeSingle();
      if (data) {
        const e = data as any;
        setEvent({
          id: e.id,
          title: e.title || '',
          price: e.price || null,
          currency: e.currency || 'USD',
          location: e.location || [e.neighbourhood, e.town, e.province].filter(Boolean).join(', ') || '',
          city: e.province || '',
          province: e.province || '',
          town: e.town || '',
          neighbourhood: e.neighbourhood || '',
          eventType: e.event_type || '',
          entryType: e.entry_type || 'open_invitation',
          date: e.event_date || '',
          endDate: e.event_end_date || '',
          organizer: e.organizer || e.companies?.name || '',
          organizerLogo: e.logo_url || e.companies?.logo_url || '',
          listingId: e.listing_id || '',
          listingDate: e.created_at?.slice(0, 10) || '',
          images: e.images && e.images.length > 0 ? e.images : ['/placeholder.svg'],
          description: e.description || '',
          agentName: e.agents?.name || '',
          agentLogo: e.agents?.avatar_url || '',
          agentDesignation: e.agents?.designation || null,
          agentLanguages: e.agents?.languages || [],
          agentCompany: e.companies?.name || e.agents?.companies?.name || '',
          companyLogo: e.companies?.logo_url || e.agents?.companies?.logo_url || null,
          hasAgent: !!e.agents,
          pdfCatalogueUrl: e.pdf_catalogue_url || null,
          videoLink: e.video_link || '',
          pinLocation: e.pin_location || null,
        });
        setRealAgentId(e.agents?.id || null);
        setRealCompanyId(e.companies?.id || e.agents?.companies?.id || null);
      }
      setLoading(false);
    };
    fetchEvent();
  }, [id]);

  const pinLocation = useMemo(() => {
    if (event?.pinLocation) {
      try {
        const parts = event.pinLocation.split(',').map(Number);
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) return { lat: parts[0], lng: parts[1] };
      } catch {}
    }
    if (event?.location) return getCoordsFromLocation(event.location);
    return null;
  }, [event?.pinLocation, event?.location]);

  if (loading || !event) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <PropertyDetailSkeleton />
        <Footer />
      </div>
    );
  }

  const images = event.images;
  const nextImage = () => setCurrentImage((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImage((prev) => (prev - 1 + images.length) % images.length);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    } catch { return dateStr; }
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch { return '—'; }
  };

  const mediaTabs = [
    { id: 'photos', label: 'Photos', icon: Camera },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'street', label: 'Street View', icon: PersonStanding },
    { id: 'video', label: 'Video', icon: Video },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={event.title}
        description={`${event.eventType} event in ${event.location}. ${event.date ? `Date: ${formatDate(event.date)}.` : ''} ${event.price ? `Ticket: $${event.price.toLocaleString()}` : 'Free admission.'}`}
        image={event.images?.[0]}
        url={typeof window !== 'undefined' ? window.location.href : ''}
        type="website"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: event.title,
          description: event.description?.slice(0, 200),
          image: event.images,
          startDate: event.date,
          endDate: event.endDate || undefined,
          location: { '@type': 'Place', name: event.location, address: { '@type': 'PostalAddress', addressLocality: event.town, addressRegion: event.province } },
          organizer: { '@type': 'Organization', name: event.organizer },
          offers: event.price ? { '@type': 'Offer', price: event.price, priceCurrency: event.currency } : undefined,
        }}
      />
      <Header />

      {/* Media Gallery */}
      <div className="relative w-full h-[300px] md:h-[450px] bg-muted overflow-hidden">
        {/* Photos */}
        <div className={activeTab === 'photos' ? 'h-full' : 'hidden'}>
          <div className="flex h-full">
            {images.slice(currentImage, currentImage + 3).concat(
              currentImage + 3 > images.length ? images.slice(0, (currentImage + 3) - images.length) : []
            ).map((img: string, i: number) => (
              <div key={`${currentImage}-${i}`} className="h-full flex-1 min-w-0 px-[1px] first:pl-0 last:pr-0 cursor-pointer" onClick={() => { setCurrentImage((currentImage + i) % images.length); setLightboxOpen(true); }}>
                <img src={img} alt={`${event.title} ${i + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <button onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background p-2.5 rounded-full shadow-lg z-10"><ChevronLeft className="h-5 w-5" /></button>
          <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background p-2.5 rounded-full shadow-lg z-10"><ChevronRight className="h-5 w-5" /></button>
          <div className="absolute bottom-4 left-4 bg-foreground/60 text-white text-sm px-3 py-1 rounded-md flex items-center gap-1 z-10">
            <Camera className="h-3.5 w-3.5" />{currentImage + 1}/{images.length}
          </div>
        </div>

        {/* Location — mounted once */}
        {pinLocation && (
          <div className={activeTab === 'location' ? 'h-full' : 'hidden'}>
            <NearbyPlacesMap lat={pinLocation.lat} lng={pinLocation.lng} propertyTitle={event.title} embedded />
          </div>
        )}
        {!pinLocation && activeTab === 'location' && (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Location coordinates are unavailable.</div>
        )}

        {/* Street View — mounted once */}
        {pinLocation && (
          <div className={activeTab === 'street' ? 'h-full' : 'hidden'}>
            <StreetView lat={pinLocation.lat} lng={pinLocation.lng} className="h-full w-full" />
          </div>
        )}
        {!pinLocation && activeTab === 'street' && (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Location coordinates are unavailable.</div>
        )}

        {/* Video */}
        <div className={activeTab === 'video' ? 'h-full' : 'hidden'}>
          {event.videoLink ? (
            <iframe src={event.videoLink.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} className="w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="Event Video" />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              <div className="text-center"><Video className="h-10 w-10 mx-auto mb-2 opacity-40" />No video available.</div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="absolute top-4 left-4 flex gap-2 z-10">
          <ShareDropdown title={event.title} />
          <button onClick={() => navigate('/login')} className="bg-background/90 p-2 rounded-full shadow-sm hover:bg-background active:scale-95 transition-transform" title="Save"><Heart className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <button className="absolute top-4 right-4 text-white/80 hover:text-white p-2" onClick={() => setLightboxOpen(false)}><X className="h-6 w-6" /></button>
          <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-3 rounded-full"><ChevronLeft className="h-6 w-6 text-white" /></button>
          <img src={images[currentImage]} alt={event.title} className="max-h-[90vh] max-w-[90vw] object-contain" onClick={(e) => e.stopPropagation()} />
          <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-3 rounded-full"><ChevronRight className="h-6 w-6 text-white" /></button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">{currentImage + 1} / {images.length}</div>
        </div>
      )}

      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-6 flex-wrap">
          <Link to="/" className="hover:text-foreground transition-colors"><Home className="h-3.5 w-3.5" /></Link>
          <span className="text-muted-foreground/50">&gt;</span>
          <Link to="/events" className="hover:text-foreground transition-colors">Events</Link>
          {event.province && (
            <>
              <span className="text-muted-foreground/50">&gt;</span>
              <Link to={`/events?province=${encodeURIComponent(event.province)}`} className="hover:text-foreground transition-colors">
                {event.province} Events
              </Link>
            </>
          )}
          {event.town && (
            <>
              <span className="text-muted-foreground/50">&gt;</span>
              <Link to={`/events?province=${encodeURIComponent(event.province)}&town=${encodeURIComponent(event.town)}`} className="hover:text-foreground transition-colors">
                {event.town} Events
              </Link>
            </>
          )}
          {event.neighbourhood && (
            <>
              <span className="text-muted-foreground/50">&gt;</span>
              <Link to={`/events?province=${encodeURIComponent(event.province)}&town=${encodeURIComponent(event.town)}&neighbourhood=${encodeURIComponent(event.neighbourhood)}`} className="hover:text-foreground transition-colors">
                {event.neighbourhood} Events
              </Link>
            </>
          )}
          <span className="text-muted-foreground/50">&gt;</span>
          <span className="text-foreground font-medium">{event.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Title Block */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  {(() => { const TypeIcon = getEventTypeIcon(event.eventType); return <div className="h-10 w-10 rounded-lg bg-muted/30 flex items-center justify-center flex-shrink-0"><TypeIcon className="h-5 w-5 text-foreground" /></div>; })()}
                  <h1 className="text-xl font-bold text-foreground">{event.title}</h1>
                </div>
                <div className="hidden md:flex items-center gap-0.5 bg-muted/80 rounded-lg p-1 border border-border">
                  {mediaTabs.map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`p-2 rounded-md transition-all active:scale-95 ${activeTab === tab.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background'}`} title={tab.label}>
                      <tab.icon className="h-4.5 w-4.5" />
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-2xl font-bold text-primary mb-2">
                {event.price ? `$ ${event.price.toLocaleString()}` : 'Open Invitation'}
              </p>
              <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
                <MapPin className="h-4 w-4 text-primary" /><span>{event.location}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
                <div className="flex flex-wrap items-center gap-6">
                  <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{event.eventType}</span>
                  <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-warm" />{formatDate(event.date)}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span>Ad ID: <span className="font-medium text-foreground">{event.listingId}</span></span>
                  <span>Added: <span className="font-medium text-foreground">{event.listingDate}</span></span>
                </div>
              </div>
            </div>

            {/* Overview */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <OverviewItem icon={Clock} label="Event Type" value={event.eventType} />
                <OverviewItem icon={CalendarDays} label="Date" value={formatDate(event.date)} />
                <OverviewItem icon={Timer} label="Time" value={`From ${formatTime(event.date)}${event.endDate ? ` To ${formatTime(event.endDate)}` : ''}`} />
                <OverviewItem icon={Users} label="Organizer" value={event.organizer} />
                <OverviewItem icon={Ticket} label="Admission" value={event.entryType === 'open_invitation' ? 'Open Invitation' : event.entryType} />
                <OverviewItem icon={DollarSign} label="Ticket Price" value={event.price ? `$ ${event.price.toLocaleString()}` : 'Free'} />
              </div>
              {event.pdfCatalogueUrl && (
                <a
                  href={event.pdfCatalogueUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <FileDown className="h-4 w-4" />
                  Download Brochure
                </a>
              )}
            </div>

            {/* Description */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Description</h2>
              <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{event.description}</div>
            </div>

            {/* Map placeholder */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="text-lg font-bold text-foreground">Location on Map</h2>
              </div>
              <div className="h-[300px] bg-muted flex items-center justify-center text-muted-foreground">Map View — {event.location}</div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6 sticky top-[120px]">
              {event.hasAgent ? (
                <>
                  <Link to={realAgentId ? `/agents/${realAgentId}` : '#'} className="block text-center mb-4 group">
                    {event.agentLogo ? (
                      <img src={event.agentLogo} alt={event.agentName} className="h-32 w-32 rounded-lg object-cover border-2 border-border mx-auto mb-3 group-hover:border-primary transition-colors" />
                    ) : (
                      <div className="h-32 w-32 rounded-lg bg-muted border-2 border-border mx-auto mb-3 flex items-center justify-center">
                        <Building className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">{event.agentName}</h3>
                    {event.agentDesignation && <p className="text-sm text-muted-foreground">{event.agentDesignation}</p>}
                  </Link>

                  {event.agentLanguages && event.agentLanguages.length > 0 && (
                    <p className="text-xs text-muted-foreground text-center mb-4">
                      <span className="font-medium text-foreground">Speaks:</span> {event.agentLanguages.join(', ')}
                    </p>
                  )}

                  {(event.companyLogo || event.organizerLogo) && (
                    <Link to={realCompanyId ? `/company/${realCompanyId}` : '#'} className="flex flex-col items-center gap-2 py-4 border-t border-border group">
                      <img src={event.companyLogo || event.organizerLogo} alt={event.agentCompany || event.organizer} className="h-14 w-auto max-w-[120px] rounded-lg object-contain group-hover:opacity-80 transition-opacity" />
                      <div className="text-center">
                        <h4 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">{event.agentCompany || event.organizer}</h4>
                        <p className="text-xs text-muted-foreground">Real Estate Brokers</p>
                      </div>
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link to={realCompanyId ? `/company/${realCompanyId}` : '#'} className="block text-center mb-4 group">
                    {(event.companyLogo || event.organizerLogo) ? (
                      <img src={event.companyLogo || event.organizerLogo} alt={event.agentCompany || event.organizer} className="h-32 w-32 rounded-lg object-contain border-2 border-border mx-auto mb-3 p-2 group-hover:border-primary transition-colors" />
                    ) : (
                      <div className="h-32 w-32 rounded-lg bg-muted border-2 border-border mx-auto mb-3 flex items-center justify-center">
                        <Building className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">{event.agentCompany || event.organizer || 'Company'}</h3>
                    <p className="text-sm text-muted-foreground">Event Organizer</p>
                  </Link>
                </>
              )}


              {!event.price && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 text-center mb-4">
                  <p className="text-sm font-medium text-primary">This event is free to attend</p>
                </div>
              )}

              <div className="flex items-center justify-center gap-0 border-t border-border pt-3">
                <button className="flex-1 flex items-center justify-center gap-1.5 text-primary hover:bg-secondary py-2.5 rounded-lg text-sm"><Phone className="h-4 w-4" />Call</button>
                <div className="w-px h-6 bg-border" />
                <button onClick={() => setEmailDialogOpen(true)} className="flex-1 flex items-center justify-center gap-1.5 text-primary hover:bg-secondary py-2.5 rounded-lg text-sm"><Mail className="h-4 w-4" />Email</button>
                <div className="w-px h-6 bg-border" />
                <button className="flex-1 flex items-center justify-center gap-1.5 text-primary hover:bg-secondary py-2.5 rounded-lg text-sm"><MessageCircle className="h-4 w-4" />WhatsApp</button>
              </div>
            </div>

            <BannerDisplay pageName="event-detail" bannerType="vertical" />
          </div>
        </div>

        <BannerDisplay pageName="event-detail" bannerType="horizontal" className="mt-8" />
      </div>

      <ContactCompanyDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        property={{
          id: event.id,
          title: event.title,
          location: event.location,
          type: event.eventType,
          area: 0,
          areaUnit: 'm²',
          bathrooms: 0,
          bedrooms: 0,
          price: event.price || 0,
          currency: event.currency,
          images: event.images,
          listingId: event.listingId,
        }}
        companyId={realCompanyId}
        agentId={realAgentId}
        companyName={event.agentCompany || event.organizer}
        listingType="event"
      />

      <Footer />
    </div>
  );
};

const OverviewItem = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
    <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <div>
      <p className="text-muted-foreground text-[11px] leading-tight">{label}</p>
      <p className="font-semibold text-foreground text-sm">{value}</p>
    </div>
  </div>
);

export default EventDetailPage;
