import { useState, useEffect, memo } from 'react';
import { MapPin, Heart, Layers, BedDouble, Bath, Maximize, Building, ChevronLeft, ChevronRight, Camera, Crown, Star, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';
import { toggleSaveProperty, toggleCompareProperty } from '@/hooks/usePropertyActions';
import { useAreaUnit } from '@/hooks/useAreaUnit';
import type { Property } from '@/data/mockProperties';

interface PropertyCardProps {
  property: Property;
  isSaved?: boolean;
  isCompared?: boolean;
}

const PropertyCard = memo(({ property, isSaved = false, isCompared = false }: PropertyCardProps) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [isFavorited, setIsFavorited] = useState(isSaved);
  const [isComparedLocal, setIsComparedLocal] = useState(isCompared);
  const queryClient = useQueryClient();
  const { formatArea } = useAreaUnit();

  // Sync local state when prop changes (e.g. after query refetch)
  useEffect(() => { setIsFavorited(isSaved); }, [isSaved]);
  useEffect(() => { setIsComparedLocal(isCompared); }, [isCompared]);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImage((prev) => (prev + 1) % property.images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImage((prev) => (prev - 1 + property.images.length) % property.images.length);
  };

  const handleCompare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const prev = isComparedLocal;
    setIsComparedLocal(!prev);
    const result = await toggleCompareProperty(property.id, queryClient);
    if (result === null) setIsComparedLocal(prev);
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const prev = isFavorited;
    setIsFavorited(!prev);
    const result = await toggleSaveProperty(property.id, queryClient);
    if (result === null) setIsFavorited(prev);
  };

  const formatPrice = (price: number, currency?: string) => {
    const sym = currency && currency !== 'USD' ? `${currency} ` : '$';
    return `${sym}${price.toLocaleString()}`;
  };

  const tagColorMap: Record<string, string> = {
    'Hot Deal': 'bg-red-500',
    'Price Drop': 'bg-green-600',
    'Exclusive': 'bg-purple-600',
    'New Launch': 'bg-teal-600',
  };

  return (
    <div className="group bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={property.images[currentImage]}
          alt={property.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {property.images.length > 1 && (
          <>
            <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-foreground/40 hover:bg-foreground/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Previous image">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-foreground/40 hover:bg-foreground/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Next image">
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-foreground/60 text-white text-xs px-2 py-1 rounded-md">
          <Camera className="h-3 w-3" />
          <span>{currentImage + 1}/{property.images.length}</span>
        </div>
        <div className="absolute top-2 right-2 flex gap-1.5">
          <button onClick={handleCompare} className={`p-1.5 rounded-full transition-colors shadow-sm ${isComparedLocal ? 'bg-primary text-primary-foreground' : 'bg-background/90 hover:bg-background text-foreground/70 hover:text-primary'}`} aria-label="Compare">
            <Layers className="h-4 w-4" />
          </button>
          <button onClick={handleFavorite} className={`p-1.5 rounded-full transition-colors shadow-sm ${isFavorited ? 'bg-primary text-primary-foreground' : 'bg-background/90 hover:bg-background text-foreground/70 hover:text-destructive'}`} aria-label="Favorite">
            <Heart className="h-4 w-4" fill={isFavorited ? 'currentColor' : 'none'} />
          </button>
        </div>
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {property.listingTier === 'premium' && (
            <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-amber-500 shadow-md" title="Premium">
              <Crown className="h-4 w-4 text-white" />
            </span>
          )}
          {property.listingTier === 'featured' && (
            <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-gray-400 shadow-md" title="Featured">
              <Star className="h-4 w-4 text-white" />
            </span>
          )}
          {property.advertisingTags && property.advertisingTags.length > 0 && (
            <Badge className={`${tagColorMap[property.advertisingTags[0]] || 'bg-orange-500'} hover:${tagColorMap[property.advertisingTags[0]] || 'bg-orange-500'} text-white border-0 gap-1 text-[10px] uppercase font-bold`}>
              <Tag className="h-3 w-3" /> {property.advertisingTags[0]}
            </Badge>
          )}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="text-lg font-bold text-foreground">
            {formatPrice(property.price, property.currency)}
            {property.listingType === 'rent' && <span className="text-sm font-normal text-muted-foreground">/{property.rentDuration === 'Daily' ? 'day' : property.rentDuration === 'Weekly' ? 'wk' : property.rentDuration === 'Yearly' ? 'yr' : 'mo'}</span>}
          </div>
          <img src={property.agentLogo} alt={property.agentName} className="h-7 w-auto max-w-[60px] object-contain" />
        </div>
        <h3 className="text-sm font-medium text-foreground/90 mb-2 line-clamp-1">{property.title}</h3>
        <div className="flex items-center gap-1 text-muted-foreground text-xs mb-3">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="line-clamp-1">{property.location}</span>
        </div>
        <div className="flex items-center gap-3 pt-3 border-t border-foreground/10">
          <SpecItem icon={<Building className="h-3.5 w-3.5" />} label={property.type} />
          <SpecItem icon={<Maximize className="h-3.5 w-3.5" />} label={formatArea(property.area, property.areaUnit)} />
          {property.bedrooms > 0 && <SpecItem icon={<BedDouble className="h-3.5 w-3.5" />} label={`${property.bedrooms}`} />}
          <SpecItem icon={<Bath className="h-3.5 w-3.5" />} label={`${property.bathrooms}`} />
        </div>
      </div>
    </div>
  );
});

PropertyCard.displayName = 'PropertyCard';

const SpecItem = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div className="flex items-center gap-1 text-muted-foreground text-xs">
    {icon}
    <span>{label}</span>
  </div>
);

export default PropertyCard;
