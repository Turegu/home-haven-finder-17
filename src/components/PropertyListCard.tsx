import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart, Layers, Phone, Mail, MessageCircle,
  ChevronLeft, ChevronRight, Camera, MapPin,
  Building, Maximize, BedDouble, Bath, Crown, Star, Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import type { Property } from '@/data/mockProperties';

interface PropertyListCardProps {
  property: Property;
}

const PropertyListCard = ({ property }: PropertyListCardProps) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImage((prev) => (prev + 1) % property.images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImage((prev) => (prev - 1 + property.images.length) % property.images.length);
  };

  const tierBadge = () => {
    if (property.listingTier === 'premium') {
      return (
        <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-amber-500 shadow-md" title="Premium">
          <Crown className="h-4 w-4 text-white" />
        </span>
      );
    }
    if (property.listingTier === 'featured') {
      return (
        <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-gray-400 shadow-md" title="Featured">
          <Star className="h-4 w-4 text-white" />
        </span>
      );
    }
    return null;
  };

  const tagColorMap: Record<string, string> = {
    'Hot Deal': 'bg-red-500',
    'Price Drop': 'bg-green-600',
    'Exclusive': 'bg-purple-600',
    'New Launch': 'bg-teal-600',
  };

  // Get secondary images (up to 2 for the side panel)
  const secondaryImages = property.images.length > 1
    ? property.images.filter((_, i) => i !== currentImage).slice(0, 2)
    : [];

  return (
    <Link to={`/property/${property.id}`} className="block">
      <div className="flex flex-col md:flex-row bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-all group">
        {/* Dual thumbnail area — two equal-size landscape images side by side */}
        <div className="relative w-full md:w-[420px] shrink-0">
          <div className="flex h-[200px]">
            {/* Left image */}
            <div className="relative flex-1 overflow-hidden">
              <img
                src={property.images[currentImage]}
                alt={property.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Left arrow on left thumbnail */}
              {property.images.length > 1 && (
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-foreground/40 hover:bg-foreground/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}

              {/* Tier badge — top left corner */}
              {property.listingTier !== 'standard' && (
                <div className="absolute top-2 left-2">
                  {tierBadge()}
                </div>
              )}

              {/* Photo count — lower left of left thumbnail */}
              <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-foreground/60 text-white text-xs px-2 py-1 rounded-md">
                <Camera className="h-3 w-3" />
                <span>{currentImage + 1}/{property.images.length}</span>
              </div>
            </div>

            {/* Right image — equal size */}
            <div className="relative hidden lg:block flex-1 overflow-hidden border-l-[2px] border-background">
              <img
                src={secondaryImages[0] || property.images[currentImage]}
                alt={`${property.title} 2`}
                className="w-full h-full object-cover"
              />

              {/* Right arrow on right thumbnail */}
              {property.images.length > 1 && (
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-foreground/40 hover:bg-foreground/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}

              {/* Save & Compare — upper right of right thumbnail */}
              <div className="absolute top-2 right-2 flex items-center gap-1">
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  className="bg-foreground/40 hover:bg-foreground/60 text-white p-1.5 rounded-full transition-colors"
                  aria-label="Compare"
                >
                  <Layers className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsFavorited(!isFavorited); }}
                  className={`p-1.5 rounded-full transition-colors ${
                    isFavorited
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-foreground/40 hover:bg-foreground/60 text-white'
                  }`}
                  aria-label="Favorite"
                >
                  <Heart className="h-3.5 w-3.5" fill={isFavorited ? 'currentColor' : 'none'} />
                </button>
              </div>

            </div>
          </div>

          {/* Price bar below thumbnails */}
          <div className="bg-foreground px-3 py-1.5 flex items-center justify-between">
            <span className="text-base font-bold text-background">
              $ {property.price.toLocaleString()}
              {property.listingType === 'rent' && <span className="text-sm font-normal text-background/80"> /mo</span>}
            </span>
            {property.advertisingTags && property.advertisingTags.length > 0 && (
              <Badge
                className={`${tagColorMap[property.advertisingTags[0]] || 'bg-orange-500'} hover:${tagColorMap[property.advertisingTags[0]] || 'bg-orange-500'} text-white border-0 gap-1 text-[10px] uppercase font-bold`}
              >
                <Tag className="h-3 w-3" /> {property.advertisingTags[0]}
              </Badge>
            )}
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 p-4 flex flex-col justify-between relative">
          {/* Company logo + name — upper right corner */}
          <div className="absolute top-3 right-3 flex flex-col items-center gap-1">
            <img
              src={property.agentLogo}
              alt={property.agentName}
              className="h-10 w-16 rounded object-cover border border-border shadow-sm"
            />
            <span className="text-[10px] text-muted-foreground text-center leading-tight max-w-[70px] line-clamp-2">{property.agentName}</span>
          </div>

          <div className="pr-24">
            {/* Title */}
            <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{property.title}</h3>

            {/* Location */}
            <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="line-clamp-1">{property.location}</span>
            </div>

            {/* Property specs */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
              <span className="flex items-center gap-1">
                <Building className="h-3.5 w-3.5" />
                <span className="font-medium text-foreground">{property.type}</span>
              </span>
              <span className="flex items-center gap-1">
                <Maximize className="h-3.5 w-3.5" />
                <span className="font-medium text-foreground">{property.area} {property.areaUnit}</span>
              </span>
              <span className="flex items-center gap-1">
                <Bath className="h-3.5 w-3.5" />
                <span className="font-medium text-foreground">{property.bathrooms}</span> Bath
              </span>
              {property.bedrooms > 0 && (
                <span className="flex items-center gap-1">
                  <BedDouble className="h-3.5 w-3.5" />
                  <span className="font-medium text-foreground">{property.bedrooms}</span> Bed
                </span>
              )}
            </div>
          </div>

          {/* Bottom row: agent avatar + action buttons */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
            {/* Agent avatar */}
            <div className="flex items-center gap-2">
              {property.agentAvatar && (
                <Avatar className="h-8 w-8 border-2 border-border shadow-sm">
                  <AvatarImage src={property.agentAvatar} alt="Agent" />
                  <AvatarFallback className="text-xs">AG</AvatarFallback>
                </Avatar>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              >
                <Phone className="h-3.5 w-3.5" /> Call
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              >
                <Mail className="h-3.5 w-3.5" /> Email
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs gap-1 bg-primary hover:bg-primary/90"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              >
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PropertyListCard;
