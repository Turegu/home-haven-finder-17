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
import { toggleSaveProperty, toggleCompareProperty } from '@/hooks/usePropertyActions';

interface PropertyListCardProps {
  property: Property;
}

const PropertyListCard = ({ property }: PropertyListCardProps) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isCompared, setIsCompared] = useState(false);

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

  const handleCompare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const result = await toggleCompareProperty(property.id);
    if (result !== null) setIsCompared(result);
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const result = await toggleSaveProperty(property.id);
    if (result !== null) setIsFavorited(result);
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

  const compareButton = (
    <button
      onClick={handleCompare}
      className={`p-1.5 rounded-full transition-colors ${isCompared ? 'bg-primary text-primary-foreground' : 'bg-foreground/40 hover:bg-foreground/60 text-white'}`}
      aria-label="Compare"
    >
      <Layers className="h-3.5 w-3.5" />
    </button>
  );

  const favoriteButton = (
    <button
      onClick={handleFavorite}
      className={`p-1.5 rounded-full transition-colors ${
        isFavorited
          ? 'bg-primary text-primary-foreground'
          : 'bg-foreground/40 hover:bg-foreground/60 text-white'
      }`}
      aria-label="Favorite"
    >
      <Heart className="h-3.5 w-3.5" fill={isFavorited ? 'currentColor' : 'none'} />
    </button>
  );

  return (
    <Link to={`/property/${property.id}`} className="block">
      <div className="flex flex-col md:flex-row bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-all group">
        {/* Dual thumbnail area */}
        <div className="relative w-full md:w-[320px] lg:w-[440px] xl:w-[500px] shrink-0">
          <div className="flex h-[190px]">
            {/* Left image */}
            <div className="relative flex-1 overflow-hidden">
              <img
                src={property.images[currentImage]}
                alt={property.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {property.images.length > 1 && (
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-foreground/40 hover:bg-foreground/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}

              {property.images.length > 1 && (
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-foreground/40 hover:bg-foreground/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity lg:hidden"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}

              {/* Save & Compare — only when single thumbnail (below lg) */}
              <div className="absolute top-2 right-2 flex items-center gap-1 lg:hidden">
                {compareButton}
                {favoriteButton}
              </div>

              {property.listingTier !== 'standard' && (
                <div className="absolute top-2 left-2">
                  {tierBadge()}
                </div>
              )}

              <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-foreground/60 text-white text-xs px-2 py-1 rounded-md">
                <Camera className="h-3 w-3" />
                <span>{currentImage + 1}/{property.images.length}</span>
              </div>
            </div>

            {/* Right image */}
            <div className="relative hidden lg:block flex-1 overflow-hidden border-l-[2px] border-background">
              <img
                src={secondaryImages[0] || property.images[currentImage]}
                alt={`${property.title} 2`}
                className="w-full h-full object-cover"
              />

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
                {compareButton}
                {favoriteButton}
              </div>
            </div>
          </div>

          {/* Ad tag bottom left */}
          {property.advertisingTags && property.advertisingTags.length > 0 && (
            <div className="absolute bottom-2 left-2 z-10">
              <Badge
                className={`${tagColorMap[property.advertisingTags[0]] || 'bg-orange-500'} hover:${tagColorMap[property.advertisingTags[0]] || 'bg-orange-500'} text-white border-0 gap-1 text-[10px] uppercase font-bold`}
              >
                <Tag className="h-3 w-3" /> {property.advertisingTags[0]}
              </Badge>
            </div>
          )}
        </div>

        {/* Content area */}
        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
          <div>
            {/* Price + title */}
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="min-w-0">
                <div className="text-lg font-bold text-foreground">
                  {property.currency} {property.price.toLocaleString()}
                  {property.listingType === 'rent' && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
                </div>
                <h3 className="text-sm font-medium text-foreground/90 line-clamp-1">{property.title}</h3>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-1 text-muted-foreground text-xs mb-3">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="line-clamp-1">{property.location}</span>
            </div>

            {/* Specs Row */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
              <span className="flex items-center gap-1"><Building className="h-3.5 w-3.5" /> {property.type}</span>
              <span className="flex items-center gap-1"><Maximize className="h-3.5 w-3.5" /> {property.area} {property.areaUnit}</span>
              {property.bedrooms > 0 && <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" /> {property.bedrooms}</span>}
              <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" /> {property.bathrooms}</span>
            </div>
          </div>

          {/* Agent row + CTA */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src={property.agentAvatar || property.agentLogo} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {property.agentName?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate">{property.agentName || 'Agent'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" className="h-8 px-2.5" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                <Phone className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 px-2.5" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                <Mail className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 px-2.5" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                <MessageCircle className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PropertyListCard;
