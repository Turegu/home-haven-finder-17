import { useState } from 'react';
import { MapPin, Heart, Layers, BedDouble, Bath, Maximize, Building, ChevronLeft, ChevronRight, Camera, Crown, Star, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Property } from '@/data/mockProperties';

interface PropertyCardProps {
  property: Property;
}

const PropertyCard = ({ property }: PropertyCardProps) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImage((prev) => (prev + 1) % property.images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImage((prev) => (prev - 1 + property.images.length) % property.images.length);
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
    if (price >= 1000) return `$${(price / 1000).toFixed(0)}K`;
    return `$${price.toLocaleString()}`;
  };

  return (
    <div className="group bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      {/* Image Area */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={property.images[currentImage]}
          alt={property.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Image Navigation */}
        {property.images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-foreground/40 hover:bg-foreground/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-foreground/40 hover:bg-foreground/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Photo Count */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-foreground/60 text-white text-xs px-2 py-1 rounded-md">
          <Camera className="h-3 w-3" />
          <span>{currentImage + 1}/{property.images.length}</span>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-2 right-2 flex gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); }}
            className="bg-background/90 hover:bg-background text-foreground/70 hover:text-primary p-1.5 rounded-full transition-colors shadow-sm"
            aria-label="Compare"
          >
            <Layers className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIsFavorited(!isFavorited); }}
            className={`p-1.5 rounded-full transition-colors shadow-sm ${
              isFavorited
                ? 'bg-primary text-primary-foreground'
                : 'bg-background/90 hover:bg-background text-foreground/70 hover:text-destructive'
            }`}
            aria-label="Favorite"
          >
            <Heart className="h-4 w-4" fill={isFavorited ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Agent Logo */}
        <div className="absolute bottom-2 right-2">
          <img
            src={property.agentLogo}
            alt={property.agentName}
            className="h-9 w-9 rounded-full border-2 border-background object-cover shadow-md"
          />
        </div>

        {/* Listing Type Badge */}
        <div className="absolute top-2 left-2">
          <span className="bg-primary text-primary-foreground text-[10px] font-bold uppercase px-2 py-1 rounded">
            For {property.listingType === 'buy' ? 'Sale' : 'Rent'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Price */}
        <div className="text-lg font-bold text-foreground mb-1">
          {formatPrice(property.price)}
          {property.listingType === 'rent' && <span className="text-sm font-normal text-muted-foreground">/mo</span>}
        </div>

        {/* Title */}
        <h3 className="text-sm font-medium text-foreground/90 mb-2 line-clamp-1">
          {property.title}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1 text-muted-foreground text-xs mb-3">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="line-clamp-1">{property.location}</span>
        </div>

        {/* Specs Row */}
        <div className="flex items-center gap-3 pt-3 border-t border-border">
          <SpecItem icon={<Building className="h-3.5 w-3.5" />} label={property.type} />
          <SpecItem icon={<Maximize className="h-3.5 w-3.5" />} label={`${property.area} ${property.areaUnit}`} />
          {property.bedrooms > 0 && (
            <SpecItem icon={<BedDouble className="h-3.5 w-3.5" />} label={`${property.bedrooms}`} />
          )}
          <SpecItem icon={<Bath className="h-3.5 w-3.5" />} label={`${property.bathrooms}`} />
        </div>
      </div>
    </div>
  );
};

const SpecItem = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div className="flex items-center gap-1 text-muted-foreground text-xs">
    {icon}
    <span>{label}</span>
  </div>
);

export default PropertyCard;
