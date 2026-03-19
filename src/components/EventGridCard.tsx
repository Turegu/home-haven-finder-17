import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Camera, MapPin,
  CalendarDays, Clock, Users, Tag
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { EventResult } from '@/hooks/useEventSearch';

interface EventGridCardProps {
  event: EventResult;
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return 'TBA';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const EventGridCard = ({ event }: EventGridCardProps) => {
  const [currentImage, setCurrentImage] = useState(0);
  const images = event.images && event.images.length > 0 ? event.images : ['/placeholder.svg'];

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

  const companyLogo = event.companies?.logo_url ?? event.logo_url ?? '';

  return (
    <Link to={`/events/${event.id}`}>
      <div className="group bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        {/* Image Area */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={images[currentImage]}
            alt={event.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {images.length > 1 && (
            <>
              <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-foreground/40 hover:bg-foreground/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-foreground/40 hover:bg-foreground/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}

          {/* Photo Count */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-foreground/60 text-white text-xs px-2 py-1 rounded-md">
            <Camera className="h-3 w-3" />
            <span>{currentImage + 1}/{images.length}</span>
          </div>

          {/* Event type badge + entry type */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <Badge className="bg-primary hover:bg-primary text-primary-foreground border-0 text-[10px] uppercase font-bold gap-1">
              <Tag className="h-3 w-3" /> {event.event_type.replace(/_/g, ' ')}
            </Badge>
            {event.entry_type === 'open_invitation' && (
              <Badge className="bg-green-600 hover:bg-green-600 text-white border-0 text-[10px] uppercase font-bold gap-1">
                <Users className="h-3 w-3" /> Open Invitation
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Price + Company Logo Row */}
          <div className="flex items-center justify-between mb-1">
            <div className="text-lg font-bold text-foreground">
              {event.price ? `${event.currency || 'USD'} ${event.price.toLocaleString()}` : 'Free Entry'}
            </div>
            {companyLogo && (
              <img src={companyLogo} alt="" className="h-7 w-auto max-w-[60px] object-contain" />
            )}
          </div>

          {/* Title */}
          <h3 className="text-sm font-medium text-foreground/90 mb-2 line-clamp-1">{event.title}</h3>

          {/* Location */}
          <div className="flex items-center gap-1 text-muted-foreground text-xs mb-3">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="line-clamp-1">{event.location || [event.neighbourhood, event.town, event.province].filter(Boolean).join(', ') || 'N/A'}</span>
          </div>

          {/* Specs Row */}
          <div className="flex items-center gap-3 pt-3 border-t border-foreground/10">
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>{formatDate(event.event_date)}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <Clock className="h-3.5 w-3.5" />
              <span>{event.event_type.replace(/_/g, ' ')}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default EventGridCard;
