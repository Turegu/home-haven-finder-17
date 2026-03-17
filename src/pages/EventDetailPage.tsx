import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  MapPin, Clock, CalendarDays, Phone, Mail, Share2, Heart,
  ChevronRight, ChevronLeft, Printer, Flag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BannerDisplay from '@/components/BannerDisplay';
import { mockEvents } from '@/data/mockEvents';

const EventDetailPage = () => {
  const { id } = useParams();
  const event = mockEvents.find((e) => e.id === id) || mockEvents[0];
  const [currentImage, setCurrentImage] = useState(0);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link to="/events" className="hover:text-primary">Events</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{event.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="relative rounded-lg overflow-hidden mb-6">
              <img
                src={event.images[currentImage]}
                alt={event.title}
                className="w-full h-[400px] object-cover"
              />
              {event.images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImage((p) => (p === 0 ? event.images.length - 1 : p - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setCurrentImage((p) => (p === event.images.length - 1 ? 0 : p + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
              <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm rounded-md px-2 py-1 text-xs font-medium">
                {currentImage + 1} / {event.images.length}
              </div>
              {/* Action buttons */}
              <div className="absolute top-3 right-3 flex gap-2">
                <button className="p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background">
                  <Heart className="h-4 w-4 text-foreground/70" />
                </button>
                <button className="p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background">
                  <Share2 className="h-4 w-4 text-foreground/70" />
                </button>
                <button className="p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background">
                  <Printer className="h-4 w-4 text-foreground/70" />
                </button>
                <button className="p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background">
                  <Flag className="h-4 w-4 text-foreground/70" />
                </button>
              </div>
            </div>

            {/* Event Title & Info */}
            <h1 className="text-2xl font-bold text-foreground mb-4">{event.title}</h1>

            <div className="flex items-start gap-2 mb-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <span className="text-muted-foreground">{event.location}</span>
            </div>

            <div className="flex flex-wrap items-center gap-6 mb-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="text-muted-foreground">{event.eventType}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
                <span className="text-muted-foreground">{formatDate(event.date)}</span>
              </div>
            </div>

            {/* Event Details Table */}
            <div className="border border-border rounded-lg overflow-hidden mb-6">
              <div className="bg-primary/5 px-4 py-3 border-b border-border">
                <h2 className="font-semibold text-foreground">Event Details</h2>
              </div>
              <div className="divide-y divide-border">
                {[
                  ['Event Type', event.eventType],
                  ['Date', formatDate(event.date)],
                  ['Location', event.location],
                  ['City', event.city],
                  ['Organizer', event.organizer],
                  ['Price', event.price ? `$ ${event.price.toLocaleString()}` : 'Free / Open Invitation'],
                ].map(([label, value]) => (
                  <div key={label} className="flex px-4 py-3">
                    <span className="w-1/3 text-sm text-muted-foreground">{label}</span>
                    <span className="w-2/3 text-sm font-medium text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-3">Description</h2>
              <p className="text-muted-foreground leading-relaxed">{event.description}</p>
            </div>

            {/* Map placeholder */}
            <div className="border border-border rounded-lg overflow-hidden mb-6">
              <div className="bg-primary/5 px-4 py-3 border-b border-border">
                <h2 className="font-semibold text-foreground">Location on Map</h2>
              </div>
              <div className="h-[300px] bg-muted flex items-center justify-center text-muted-foreground">
                Map View — {event.location}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-[120px] space-y-4">
              {/* Price Card */}
              <div className="border border-border rounded-lg p-6 bg-card">
                <div className="text-2xl font-bold text-foreground mb-1">
                  {event.price ? `$ ${event.price.toLocaleString()}` : 'Open Invitation'}
                </div>
                {!event.price && (
                  <p className="text-sm text-muted-foreground mb-4">This event is free to attend</p>
                )}
              </div>

              {/* Organizer Card */}
              <div className="border border-border rounded-lg p-6 bg-card">
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={event.organizerLogo}
                    alt={event.organizer}
                    className="w-14 h-14 rounded-full object-cover border-2 border-border"
                  />
                  <div>
                    <h3 className="font-semibold text-foreground">{event.organizer}</h3>
                    <p className="text-sm text-muted-foreground">Event Organizer</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Phone className="h-4 w-4 mr-2" /> Call
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Mail className="h-4 w-4 mr-2" /> Email
                  </Button>
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    </svg>
                    WhatsApp
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default EventDetailPage;
