import { useState, memo } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Camera, MapPin,
  CalendarDays, Users, Phone, Mail, MessageCircle, Star,
  Home, Rocket, Bus, Gavel, Store, Mic
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import type { EventResult } from '@/hooks/useEventSearch';
import { useTranslation } from "react-i18next";

interface EventListCardProps {
  event: EventResult;
  onLocationClick?: (eventId: string) => void;
}

const formatDate = (dateStr: string | null) => {
  const { t } = useTranslation();
  if (!dateStr) return 'TBA';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const entryLabel = (entry: string) => {
  if (entry === 'open_invitation') return 'Open Invitation';
  if (entry === 'paid') return 'Paid Entry';
  if (entry === 'rsvp') return 'RSVP Required';
  return entry;
};

const eventTypeIcons: Record<string, React.ElementType> = {
  open_house: Home,
  project_launch: Rocket,
  viewing_tour: Bus,
  auction: Gavel,
  exhibition: Store,
  exhibition_trade_show: Store,
  seminar_conference: Mic,
};

const TierBadge = ({ displayOnHomepage }: { displayOnHomepage: boolean }) => {
  if (!displayOnHomepage) return null;
  return (
    <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-gray-400 shadow-md" title="Featured">
      <Star className="h-4 w-4 text-white" />
    </span>
  );
};

const EventListCard = memo(({ event, onLocationClick }: EventListCardProps) => {
  const [currentImage, setCurrentImage] = useState(0);
  const images = event.images && event.images.length > 0 ? event.images : ['/placeholder.svg'];

  const nextImage = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setCurrentImage((prev) => (prev + 1) % images.length); };
  const prevImage = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setCurrentImage((prev) => (prev - 1 + images.length) % images.length); };

  const companyName = event.companies?.name ?? event.organizer ?? '';
  const companyLogo = event.companies?.logo_url ?? event.logo_url ?? '';
  const agentName = event.agents?.name ?? '';
  const agentAvatar = event.agents?.avatar_url ?? '';
  const TypeIcon = eventTypeIcons[event.event_type] || CalendarDays;

  return (
    <Link to={`/events/${event.id}`} className="block">
      <div className="flex flex-col md:flex-row bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-all group">
        <div className="relative w-full md:w-[320px] lg:w-[380px] shrink-0">
          <div className="relative h-[190px] overflow-hidden">
            <img src={images[currentImage]} alt={event.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            {images.length > 1 && (
              <>
                <button onClick={prevImage} aria-label="Previous image" className="absolute left-2 top-1/2 -translate-y-1/2 bg-foreground/40 hover:bg-foreground/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft className="h-4 w-4" /></button>
                <button onClick={nextImage} aria-label="Next image" className="absolute right-2 top-1/2 -translate-y-1/2 bg-foreground/40 hover:bg-foreground/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight className="h-4 w-4" /></button>
              </>
            )}
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-foreground/60 text-white text-xs px-2 py-1 rounded-md"><Camera className="h-3 w-3" /><span>{currentImage + 1}/{images.length}</span></div>
            <div className="absolute top-2 left-2"><TierBadge displayOnHomepage={event.display_on_homepage} /></div>
            <div className="absolute top-2 right-2">
              <Badge className="bg-primary hover:bg-primary text-primary-foreground border-0 text-[10px] uppercase font-bold gap-1"><TypeIcon className="h-3 w-3" />{event.event_type.replace(/_/g, ' ')}</Badge>
            </div>
          </div>
          <div className="bg-foreground px-3 py-1.5 flex items-center justify-between">
            <span className="text-base font-bold text-background">{event.price ? `${event.currency || 'USD'} ${event.price.toLocaleString()}` : 'Free Entry'}</span>
            <span className="text-xs text-background/70 flex items-center gap-1"><Users className="h-3 w-3" /> {entryLabel(event.entry_type)}</span>
          </div>
        </div>
        <div className="flex-1 p-4 flex flex-col justify-between relative">
          {companyLogo && (
            <div className="absolute top-3 right-3 flex-col items-center gap-1 hidden md:flex">
              <img src={companyLogo} alt={companyName} className="h-10 w-auto max-w-[80px] rounded-lg object-contain" />
              <span className="text-[10px] text-muted-foreground text-center leading-tight max-w-[80px] line-clamp-1">{companyName}</span>
            </div>
          )}
          <div className="pr-24">
            <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{event.title}</h3>
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onLocationClick?.(event.id); }} className="flex items-center gap-1 text-muted-foreground text-sm hover:text-primary transition-colors mb-2">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="line-clamp-1">{event.location || [event.neighbourhood, event.town, event.province].filter(Boolean).join(', ') || 'N/A'}</span>
            </button>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
              <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /><span className="font-medium text-foreground">{formatDate(event.event_date)}</span></span>
              <span className="flex items-center gap-1"><TypeIcon className="h-3.5 w-3.5" /><span className="font-medium text-foreground">{event.event_type.replace(/_/g, ' ')}</span></span>
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /><span className="font-medium text-foreground">{entryLabel(event.entry_type)}</span></span>
            </div>
            {event.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{event.description}</p>}
          </div>
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              {agentAvatar ? (
                <>
                  <Avatar className="h-8 w-8 border-2 border-border shadow-sm"><AvatarImage src={agentAvatar} alt={agentName} className="object-cover" /><AvatarFallback className="text-xs">{agentName?.charAt(0) || 'A'}</AvatarFallback></Avatar>
                  <span className="text-xs text-muted-foreground hidden sm:inline max-w-[120px] truncate">{agentName}</span>
                </>
              ) : companyLogo ? (
                <>
                  <img src={companyLogo} alt={companyName} className="h-7 w-auto max-w-[60px] rounded-lg border border-border object-contain" />
                  <span className="text-xs text-muted-foreground hidden sm:inline max-w-[120px] truncate">{companyName}</span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground hidden sm:inline max-w-[120px] truncate">{companyName || event.organizer}</span>
              )}
            </div>
            <div className="flex items-center gap-0">
              <button className="flex items-center justify-center gap-1.5 text-primary hover:bg-secondary px-3 py-2 rounded-lg text-sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}><Phone className="h-4 w-4" /> Call</button>
              <div className="w-px h-5 bg-border" />
              <button className="flex items-center justify-center gap-1.5 text-primary hover:bg-secondary px-3 py-2 rounded-lg text-sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}><Mail className="h-4 w-4" /> Email</button>
              <div className="w-px h-5 bg-border" />
              <button className="flex items-center justify-center gap-1.5 text-primary hover:bg-secondary px-3 py-2 rounded-lg text-sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}><MessageCircle className="h-4 w-4" /> WhatsApp</button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
});

EventListCard.displayName = 'EventListCard';

export default EventListCard;
