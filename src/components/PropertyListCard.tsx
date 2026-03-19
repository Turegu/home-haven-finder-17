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

  const tagColorMap: Record<string, string> = {
    'Hot Deal': 'bg-red-500',
    'Price Drop': 'bg-green-600',
    'Exclusive': 'bg-purple-600',
    'New Launch': 'bg-teal-600',
  };

  return (
    <Link to={`/property/${property.id}`} className="block">
      <div className="flex flex-col md:flex-row bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-all group">
        {/* Single thumbnail */}
        <div className="relative w-full md:w-[280px] lg:w-[340px] xl:w-[380px] shrink-0">
          <div className="relative h-[200px] md:h-full overflow-hidden">
            <img
              src={property.images[currentImage]}
              alt={property.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Navigation arrows */}
            {property.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-foreground/40 hover:bg-foreground/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-foreground/40 hover:bg-foreground/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}

            {/* Top-left: Tier badge + Ad tag stacked */}
            <div className="absolute top-2 left-2 flex flex-col gap-1.5">
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
                <Badge
                  className={`${tagColorMap[property.advertisingTags[0]] || 'bg-orange-500'} hover:${tagColorMap[property.advertisingTags[0]] || 'bg-orange-500'} text-white border-0 gap-1 text-[10px] uppercase font-bold shadow-md`}
                >
                  <Tag className="h-3 w-3" /> {property.advertisingTags[0]}
                </Badge>
              )}
            </div>

            {/* Top-right: Save & Compare */}
            <div className="absolute top-2 right-2 flex items-center gap-1">
              <button
                onClick={handleCompare}
                className={`p-1.5 rounded-full transition-colors ${isCompared ? 'bg-primary text-primary-foreground' : 'bg-foreground/40 hover:bg-foreground/60 text-white'}`}
              >
                <Layers className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleFavorite}
                className={`p-1.5 rounded-full transition-colors ${isFavorited ? 'bg-primary text-primary-foreground' : 'bg-foreground/40 hover:bg-foreground/60 text-white'}`}
              >
                <Heart className="h-3.5 w-3.5" fill={isFavorited ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Bottom-left: Photo count */}
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-foreground/60 text-white text-xs px-2 py-1 rounded-md">
              <Camera className="h-3 w-3" />
              <span>{currentImage + 1}/{property.images.length}</span>
            </div>

            {/* Bottom-right: Company logo */}
            {property.agentLogo && (
              <div className="absolute bottom-2 right-2">
                <img
                  src={property.agentLogo}
                  alt={property.agentName}
                  className="h-8 w-14 rounded object-cover border border-white/50 shadow-sm bg-white/90"
                />
              </div>
            )}
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 p-4 flex flex-col justify-between">
          {/* Price on top */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-bold text-primary">
                $ {property.price.toLocaleString()}
                {property.listingType === 'rent' && <span className="text-sm font-normal text-muted-foreground"> /mo</span>}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-semibold text-foreground mb-1 line-clamp-1 text-sm">{property.title}</h3>

            {/* Location */}
            <div className="flex items-center gap-1 text-muted-foreground text-xs mb-3">
              <MapPin className="h-3 w-3 shrink-0 text-primary" />
              <span className="line-clamp-1">{property.location}</span>
            </div>

            {/* Property specs */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
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
              <span className="text-xs text-muted-foreground hidden sm:inline max-w-[100px] truncate">{property.agentName}</span>
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
