import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart, Layers, Phone, Mail, MessageCircle,
  ChevronLeft, ChevronRight, Camera, MapPin,
  Building, Maximize, BedDouble, Bath, Crown, Star, Tag
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import type { Property } from '@/data/mockProperties';
import { toggleSaveProperty, toggleCompareProperty } from '@/hooks/usePropertyActions';
import ContactCompanyDialog from '@/components/ContactCompanyDialog';

interface PropertyListCardProps {
  property: Property;
  onLocationClick?: (propertyId: string) => void;
}

const PropertyListCard = ({ property, onLocationClick }: PropertyListCardProps) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isCompared, setIsCompared] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

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
    const prev = isCompared;
    setIsCompared(!prev);
    const result = await toggleCompareProperty(property.id);
    if (result === null) setIsCompared(prev);
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const prev = isFavorited;
    setIsFavorited(!prev);
    const result = await toggleSaveProperty(property.id);
    if (result === null) setIsFavorited(prev);
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
        <div className="relative w-full md:w-[320px] lg:w-[440px] xl:w-[500px] shrink-0">
          <div className="flex h-[190px]">
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

              {/* Right arrow — only when single thumbnail (below lg) */}
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
                <button
                  onClick={handleCompare}
                  className={`p-1.5 rounded-full transition-colors ${isCompared ? 'bg-primary text-primary-foreground' : 'bg-foreground/40 hover:bg-foreground/60 text-white'}`}
                  aria-label="Compare"
                >
                  <Layers className="h-3.5 w-3.5" />
                </button>
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
              </div>

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

              {/* Advertising tag — lower right of left thumbnail (mobile only) */}
              {property.advertisingTags && property.advertisingTags.length > 0 && (
                <div className="absolute bottom-2 right-2 lg:hidden">
                  <Badge
                    className={`${tagColorMap[property.advertisingTags[0]] || 'bg-orange-500'} hover:${tagColorMap[property.advertisingTags[0]] || 'bg-orange-500'} text-white border-0 gap-1 text-[10px] uppercase font-bold shadow-md`}
                  >
                    <Tag className="h-3 w-3" /> {property.advertisingTags[0]}
                  </Badge>
                </div>
              )}

            </div>


            {/* Right image — equal size */}
            <div className="relative hidden lg:block flex-1 overflow-hidden border-l-[2px] border-background">
              <img
                src={secondaryImages[0] || property.images[currentImage]}
                alt={`${property.title} 2`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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
                  onClick={handleCompare}
                  className={`p-1.5 rounded-full transition-colors ${isCompared ? 'bg-primary text-primary-foreground' : 'bg-foreground/40 hover:bg-foreground/60 text-white'}`}
                  aria-label="Compare"
                >
                  <Layers className="h-3.5 w-3.5" />
                </button>
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
              </div>

              {/* Advertising tag — lower right of right thumbnail */}
              {property.advertisingTags && property.advertisingTags.length > 0 && (
                <div className="absolute bottom-2 right-2">
                  <Badge
                    className={`${tagColorMap[property.advertisingTags[0]] || 'bg-orange-500'} hover:${tagColorMap[property.advertisingTags[0]] || 'bg-orange-500'} text-white border-0 gap-1 text-[10px] uppercase font-bold shadow-md`}
                  >
                    <Tag className="h-3 w-3" /> {property.advertisingTags[0]}
                  </Badge>
                </div>
              )}

            </div>
          </div>

          {/* Price bar below thumbnails */}
          <div className="bg-foreground px-3 py-1.5 flex items-center justify-between">
            <span className="text-base font-bold text-background">
              $ {property.price.toLocaleString()}
              {property.listingType === 'rent' && <span className="text-sm font-normal text-background/80"> /mo</span>}
            </span>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 p-4 flex flex-col justify-between relative">
          {/* Company logo + name — upper right corner */}
          <div className="absolute top-3 right-3 flex flex-col items-center gap-1">
            <img
              src={property.agentLogo}
              alt={property.companyName}
              className="h-10 w-auto max-w-[80px] rounded object-contain"
            />
            <span className="text-[10px] text-muted-foreground text-center leading-tight max-w-[80px] line-clamp-2">{property.companyName}</span>
          </div>

          <div className="pr-24">
            {/* Title */}
            <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{property.title}</h3>

            {/* Location */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onLocationClick?.(property.id);
              }}
              className="flex items-center gap-1 text-muted-foreground text-sm hover:text-primary transition-colors"
            >
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="line-clamp-1">{property.location}</span>
            </button>

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
            {/* Agent avatar + name */}
            <div className="flex items-center gap-2">
              {property.agentAvatar && (
                <Avatar className="h-8 w-8 border-2 border-border shadow-sm">
                  <AvatarImage src={property.agentAvatar} alt="Agent" />
                  <AvatarFallback className="text-xs">AG</AvatarFallback>
                </Avatar>
              )}
              <span className="text-xs text-muted-foreground hidden sm:inline max-w-[120px] truncate">{property.agentName}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="h-9 w-9 rounded-md bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              >
                <Phone className="h-4 w-4 text-primary-foreground" fill="currentColor" />
              </button>
              <button
                className="h-9 w-9 rounded-md bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEmailDialogOpen(true); }}
              >
                <Mail className="h-4 w-4 text-primary-foreground" fill="currentColor" />
              </button>
              <button
                className="h-9 w-9 rounded-md bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              >
                <MessageCircle className="h-4 w-4 text-primary-foreground" fill="currentColor" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <ContactCompanyDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        property={{
          id: property.id,
          title: property.title,
          location: property.location,
          type: property.type,
          area: property.area,
          areaUnit: property.areaUnit,
          bathrooms: property.bathrooms,
          bedrooms: property.bedrooms,
          price: property.price,
          currency: property.currency,
          images: property.images,
        }}
        companyId={null}
        agentId={null}
        companyName={property.companyName}
      />
    </Link>
  );
};

export default PropertyListCard;
