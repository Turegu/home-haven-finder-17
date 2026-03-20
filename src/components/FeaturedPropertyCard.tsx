import { memo, useState, useEffect } from 'react';
import { MapPin, Heart, Layers, BedDouble, Bath, Maximize, Crown, Star, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toggleSaveProperty, toggleCompareProperty } from '@/hooks/usePropertyActions';
import type { Property } from '@/data/mockProperties';

interface Props {
  property: Property;
  isSaved?: boolean;
  isCompared?: boolean;
}

const FeaturedPropertyCard = memo(({ property, isSaved = false, isCompared = false }: Props) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [isFavorited, setIsFavorited] = useState(isSaved);
  const [isComparedLocal, setIsComparedLocal] = useState(isCompared);
  const queryClient = useQueryClient();

  useEffect(() => { setIsFavorited(isSaved); }, [isSaved]);
  useEffect(() => { setIsComparedLocal(isCompared); }, [isCompared]);

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

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const prev = isFavorited;
    setIsFavorited(!prev);
    const result = await toggleSaveProperty(property.id, queryClient);
    if (result === null) setIsFavorited(prev);
  };

  const handleCompare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const prev = isComparedLocal;
    setIsComparedLocal(!prev);
    const result = await toggleCompareProperty(property.id, queryClient);
    if (result === null) setIsComparedLocal(prev);
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
    if (price >= 1000) return `$${(price / 1000).toFixed(0)}K`;
    return `$${price.toLocaleString()}`;
  };

  const tagColorMap: Record<string, string> = {
    'Hot Deal': 'bg-red-500',
    'Price Drop': 'bg-green-600',
    'Exclusive': 'bg-purple-600',
    'New Launch': 'bg-teal-600',
  };

  return (
    <div className="group relative flex flex-col rounded-2xl overflow-hidden bg-card">
      {/* Full-bleed image */}
      <div className="relative aspect-[4/5] overflow-hidden">
        <img
          src={property.images[currentImage]}
          alt={property.title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[800ms] ease-out group-hover:scale-[1.04]"
        />

        {/* Gradient scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

        {/* Image navigation */}
        {property.images.length > 1 && (
          <>
            <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/15 backdrop-blur hover:bg-white/25 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10" aria-label="Previous image">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/15 backdrop-blur hover:bg-white/25 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10" aria-label="Next image">
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Top-left: tier + tags */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
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
          {property.advertisingTags?.[0] && (
            <span className={`${tagColorMap[property.advertisingTags[0]] || 'bg-orange-500'} text-white text-[10px] uppercase font-bold px-2 py-1 rounded-full flex items-center gap-1`}>
              <Tag className="h-3 w-3" /> {property.advertisingTags[0]}
            </span>
          )}
        </div>

        {/* Top-right: actions */}
        <div className="absolute top-3 right-3 flex gap-1.5 z-10">
          <button onClick={handleCompare} className={`p-1.5 rounded-full transition-colors shadow-sm backdrop-blur ${isComparedLocal ? 'bg-primary text-primary-foreground' : 'bg-white/15 hover:bg-white/25 text-white'}`} aria-label="Compare">
            <Layers className="h-4 w-4" />
          </button>
          <button onClick={handleFavorite} className={`p-1.5 rounded-full transition-colors shadow-sm backdrop-blur ${isFavorited ? 'bg-primary text-primary-foreground' : 'bg-white/15 hover:bg-white/25 text-white'}`} aria-label="Favorite">
            <Heart className="h-4 w-4" fill={isFavorited ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Bottom overlaid content */}
        <div className="absolute bottom-0 inset-x-0 p-5 flex flex-col gap-2.5 z-10">
          {/* Type badge */}
          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
            {property.type} · {property.listingType === 'rent' ? 'For Rent' : 'For Sale'}
          </span>

          {/* Price */}
          <p className="text-xl font-bold text-white tracking-tight">
            {formatPrice(property.price)}
            {property.listingType === 'rent' && <span className="text-sm font-normal text-white/60">/mo</span>}
          </p>

          {/* Title */}
          <h3 className="font-display text-[15px] font-semibold text-white leading-snug line-clamp-1">
            {property.title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-white/65 text-xs">
            <MapPin className="h-3.5 w-3.5 text-warm shrink-0" />
            <span className="line-clamp-1">{property.location}</span>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/15" />

          {/* Specs */}
          <div className="flex items-center gap-4 text-white/60 text-xs">
            <span className="flex items-center gap-1"><Maximize className="h-3.5 w-3.5" />{property.area} {property.areaUnit}</span>
            {property.bedrooms > 0 && <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" />{property.bedrooms}</span>}
            <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{property.bathrooms}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

FeaturedPropertyCard.displayName = 'FeaturedPropertyCard';

export default FeaturedPropertyCard;
