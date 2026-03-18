import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, Clock, CalendarDays, Phone, Mail, Share2, Heart,
  ChevronLeft, ChevronRight, Camera, Images, Globe, Video,
  MessageCircle, PersonStanding, X
} from 'lucide-react';
import Header from '@/components/Header';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BannerDisplay from '@/components/BannerDisplay';
import { mockEvents } from '@/data/mockEvents';

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const event = mockEvents.find((e) => e.id === id) || mockEvents[0];
  const [currentImage, setCurrentImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('photos');

  const nextImage = () => setCurrentImage((prev) => (prev + 1) % event.images.length);
  const prevImage = () => setCurrentImage((prev) => (prev - 1 + event.images.length) % event.images.length);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  const mediaTabs = [
    { id: 'photos', label: 'Photos', icon: Camera },
    { id: 'plans', label: 'Plans', icon: Images },
    { id: '360', label: '360 View', icon: Globe },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'street', label: 'Street View', icon: PersonStanding },
    { id: 'video', label: 'Video', icon: Video },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Image Gallery — 3 side-by-side on desktop */}
      <div className="relative w-full h-[300px] md:h-[450px] bg-muted overflow-hidden">
        <div className="flex h-full">
          {event.images.slice(currentImage, currentImage + 3).concat(
            currentImage + 3 > event.images.length
              ? event.images.slice(0, (currentImage + 3) - event.images.length)
              : []
          ).map((img, i) => (
            <div key={`${currentImage}-${i}`} className="h-full flex-1 min-w-0 px-[1px] first:pl-0 last:pr-0 cursor-pointer" onClick={() => { setCurrentImage((currentImage + i) % event.images.length); setLightboxOpen(true); }}>
              <img src={img} alt={`${event.title} ${i + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
        <button onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background p-2.5 rounded-full shadow-lg z-10">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background p-2.5 rounded-full shadow-lg z-10">
          <ChevronRight className="h-5 w-5" />
        </button>
        <div className="absolute top-4 left-4 flex gap-2 z-10">
          <button onClick={() => { if (navigator.share) { navigator.share({ title: event.title, url: window.location.href }); } else { navigator.clipboard.writeText(window.location.href); } }} className="bg-background/90 p-2 rounded-full shadow-sm hover:bg-background" title="Share">
            <Share2 className="h-4 w-4" />
          </button>
          <button onClick={() => navigate('/login')} className="bg-background/90 p-2 rounded-full shadow-sm hover:bg-background" title="Save to favorites">
            <Heart className="h-4 w-4" />
          </button>
        </div>
        <div className="absolute bottom-4 left-4 bg-foreground/60 text-white text-sm px-3 py-1 rounded-md flex items-center gap-1 z-10">
          <Camera className="h-3.5 w-3.5" />
          {currentImage + 1}/{event.images.length}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <button className="absolute top-4 right-4 text-white/80 hover:text-white p-2" onClick={() => setLightboxOpen(false)}>
            <X className="h-6 w-6" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-3 rounded-full">
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <img src={event.images[currentImage]} alt={event.title} className="max-h-[90vh] max-w-[90vw] object-contain" onClick={(e) => e.stopPropagation()} />
          <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-3 rounded-full">
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
            {currentImage + 1} / {event.images.length}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6 flex-wrap">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <Link to="/events" className="hover:text-foreground">Events</Link>
          <span>/</span>
          <span className="text-foreground">{event.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title Block */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h1 className="text-xl font-bold text-foreground">{event.title}</h1>
                {/* Media tabs */}
                <div className="hidden md:flex items-center gap-1 bg-muted/80 rounded-lg p-1 border border-border">
                  {mediaTabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`p-2.5 rounded-md transition-all ${activeTab === tab.id ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-background'}`}
                      title={tab.label}
                    >
                      <tab.icon className="h-5 w-5" />
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-2xl font-bold text-primary mb-2">
                {event.price ? `$ ${event.price.toLocaleString()}` : 'Open Invitation'}
              </p>
              <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{event.location}</span>
              </div>

              <div className="flex flex-wrap items-center gap-6 mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {event.eventType}
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-warm" />
                  {formatDate(event.date)}
                </span>
              </div>
            </div>

            {/* Event Details */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Event Details</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <OverviewItem label="Event Type" value={event.eventType} />
                <OverviewItem label="Date" value={formatDate(event.date)} />
                <OverviewItem label="Location" value={event.location} />
                <OverviewItem label="City" value={event.city} />
                <OverviewItem label="Organizer" value={event.organizer} />
                <OverviewItem label="Price" value={event.price ? `$ ${event.price.toLocaleString()}` : 'Free / Open Invitation'} />
              </div>
            </div>

            {/* Description */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Description</h2>
              <div className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                {event.description}
              </div>
            </div>

            {/* Map placeholder */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="text-lg font-bold text-foreground">Location on Map</h2>
              </div>
              <div className="h-[300px] bg-muted flex items-center justify-center text-muted-foreground">
                Map View — {event.location}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6 sticky top-[120px]">
              {/* Organizer info */}
              <div className="text-center mb-4">
                <img
                  src={event.organizerLogo}
                  alt={event.organizer}
                  className="h-24 w-24 rounded-lg object-cover border-2 border-border mx-auto mb-3"
                />
                <h3 className="font-bold text-foreground text-lg">{event.organizer}</h3>
                <p className="text-sm text-muted-foreground">Event Organizer</p>
              </div>

              {!event.price && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 text-center mb-4">
                  <p className="text-sm font-medium text-primary">This event is free to attend</p>
                </div>
              )}

              <div className="flex items-center justify-center gap-0 border-t border-border pt-3">
                <button className="flex-1 flex items-center justify-center gap-1.5 text-primary hover:bg-secondary py-2.5 rounded-lg text-sm">
                  <Phone className="h-4 w-4" />
                  Call
                </button>
                <div className="w-px h-6 bg-border" />
                <button className="flex-1 flex items-center justify-center gap-1.5 text-primary hover:bg-secondary py-2.5 rounded-lg text-sm">
                  <Mail className="h-4 w-4" />
                  Email
                </button>
                <div className="w-px h-6 bg-border" />
                <button className="flex-1 flex items-center justify-center gap-1.5 text-primary hover:bg-secondary py-2.5 rounded-lg text-sm">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </button>
              </div>
            </div>

            {/* Vertical Banner */}
            <BannerDisplay pageName="event-detail" bannerType="vertical" />
          </div>
        </div>

        {/* Horizontal Banner */}
        <BannerDisplay pageName="event-detail" bannerType="horizontal" className="mt-8" />
      </div>

      <Footer />
    </div>
  );
};

const OverviewItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-muted-foreground text-xs">{label}</p>
    <p className="font-medium text-foreground">{value}</p>
  </div>
);

export default EventDetailPage;