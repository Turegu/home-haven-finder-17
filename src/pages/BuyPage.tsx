import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search, ChevronDown, SlidersHorizontal, LayoutGrid, List, Map,
  Bookmark, Phone, Mail, MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PropertyCard from '@/components/PropertyCard';
import { mockProperties } from '@/data/mockProperties';

const SearchBar = () => (
  <div className="sticky top-[104px] z-40 bg-background border-b border-border">
    <div className="container mx-auto px-4 py-3 flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 px-3 py-2 text-sm border border-border rounded-md bg-background min-w-[120px]">
        <Map className="h-4 w-4 text-primary" />
        <span className="text-foreground/70">Location</span>
        <ChevronDown className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
      </div>
      <div className="relative flex-1 min-w-[200px]">
        <input
          type="text"
          placeholder="Enter Search Area, City, Address"
          className="w-full h-10 pl-3 pr-4 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
        />
      </div>
      <FilterButton label="Property Type" />
      <FilterButton label="Price" />
      <FilterButton label="Area" />
      <FilterButton label="Rooms" />
      <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-primary font-medium hover:bg-secondary rounded-md transition-colors">
        <SlidersHorizontal className="h-4 w-4" />
        Filters
      </button>
      <Button className="h-10 px-6 font-semibold">
        <Search className="h-4 w-4 mr-1" />
        Search
      </Button>
    </div>
  </div>
);

const FilterButton = ({ label }: { label: string }) => (
  <button className="hidden md:flex items-center gap-1 px-3 py-2 text-sm text-foreground/70 border border-border rounded-md hover:border-primary/50 hover:text-foreground transition-colors bg-background">
    {label}
    <ChevronDown className="h-3.5 w-3.5" />
  </button>
);

const BuyPage = () => {
  const [searchParams] = useSearchParams();
  const purpose = searchParams.get('propertyPurpose') || 'buy';
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('list');

  const properties = mockProperties;
  const title = purpose === 'rent' ? 'Residential Properties for rent' : 'Residential Properties for sale';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <SearchBar />

      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>{'>'}</span>
          <span className="text-primary font-medium capitalize">{purpose}</span>
        </div>

        {/* Results Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <h1 className="text-lg font-bold text-foreground">
            {title} in <span className="text-primary">{properties.length} Properties</span>
          </h1>
          <div className="flex items-center gap-3">
            {/* Sort */}
            <div className="flex items-center gap-1 px-3 py-2 text-sm border border-border rounded-md bg-background">
              <span className="text-muted-foreground">Sort By</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            {/* Save Search */}
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-border rounded-md hover:border-primary/50 transition-colors">
              <Bookmark className="h-4 w-4" />
              Save Search
            </button>
            {/* View Toggles */}
            <div className="flex border border-border rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-2 ${viewMode === 'map' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}
              >
                <Map className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Link key={property.id} to={`/property/${property.id}`}>
                <PropertyCard property={property} />
              </Link>
            ))}
          </div>
        ) : viewMode === 'list' ? (
          <div className="flex flex-col gap-4">
            {properties.map((property) => (
              <PropertyListCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-muted h-[500px] flex items-center justify-center text-muted-foreground">
            <Map className="h-8 w-8 mr-2" /> Map view coming soon
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

// List view card matching Turegu reference
const PropertyListCard = ({ property }: { property: typeof mockProperties[0] }) => {
  const [currentImage, setCurrentImage] = useState(0);

  return (
    <Link to={`/property/${property.id}`}>
      <div className="flex flex-col md:flex-row bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-all group">
        {/* Image */}
        <div className="relative w-full md:w-[360px] aspect-[4/3] md:aspect-auto md:h-auto shrink-0 overflow-hidden">
          <img
            src={property.images[currentImage]}
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-2 right-2 flex gap-1.5">
            <button className="bg-background/90 hover:bg-background text-foreground/70 hover:text-primary p-1.5 rounded-full shadow-sm text-xs font-medium px-2">
              Compare
            </button>
            <button className="bg-background/90 hover:bg-background text-foreground/70 hover:text-destructive p-1.5 rounded-full shadow-sm text-xs font-medium px-2">
              ♡ Favorite
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{property.title}</h3>
            <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
              <span className="text-primary">📍</span>
              <span className="line-clamp-1">{property.location}</span>
            </div>
            {/* Agent logo */}
            <div className="flex items-center gap-2 mb-3">
              <img src={property.agentLogo} alt={property.agentName} className="h-8 w-8 rounded-full object-cover border border-border" />
              <span className="text-xs text-muted-foreground">{property.agentName}</span>
            </div>
            {/* Specs */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">🏠 <span className="font-medium text-foreground">{property.type}</span></span>
              <span className="flex items-center gap-1">📐 <span className="font-medium text-foreground">{property.area} {property.areaUnit}</span></span>
              <span className="flex items-center gap-1">🛁 <span className="font-medium text-foreground">{property.bathrooms}</span> Bathrooms</span>
              {property.bedrooms > 0 && (
                <span className="flex items-center gap-1">🛏️ <span className="font-medium text-foreground">{property.bedrooms}</span> Rooms</span>
              )}
            </div>
          </div>

          {/* Bottom row */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
            <div className="flex items-center gap-3">
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1">
                <Phone className="h-3.5 w-3.5" /> Call
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1">
                <Mail className="h-3.5 w-3.5" /> Email
              </Button>
              <Button size="sm" className="h-8 text-xs gap-1 bg-primary hover:bg-primary/90">
                <MessageCircle className="h-3.5 w-3.5" /> Whatsapp
              </Button>
            </div>
            <span className="text-lg font-bold text-foreground">
              $ {property.price.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default BuyPage;
