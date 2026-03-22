import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LocationPicker from '@/components/LocationPicker';
import PropertyTypeDropdown from '@/components/PropertyTypeDropdown';
import PriceDropdown from '@/components/PriceDropdown';
import AreaDropdown from '@/components/AreaDropdown';
import RoomsDropdown from '@/components/RoomsDropdown';
import BathroomsDropdown from '@/components/BathroomsDropdown';
import RentDurationDropdown from '@/components/RentDurationDropdown';
import PropertyFiltersModal, { type PropertyMoreFilters, emptyMoreFilters } from '@/components/PropertyFiltersModal';

const HeroSearch = () => {
  const [activeTab, setActiveTab] = useState<'buy' | 'rent'>('buy');
  const [location, setLocation] = useState<{ province?: string; district?: string; neighborhood?: string }>({});
  const [keyword, setKeyword] = useState("");
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minArea, setMinArea] = useState('');
  const [maxArea, setMaxArea] = useState('');
  const [rooms, setRooms] = useState<string[]>([]);
  const [bathrooms, setBathrooms] = useState<string[]>([]);
  const [rentDuration, setRentDuration] = useState<string[]>([]);
  const [moreFilters, setMoreFilters] = useState<PropertyMoreFilters>(emptyMoreFilters);
  const navigate = useNavigate();

  function handleSearch() {
    const params = new URLSearchParams();
    params.set('propertyPurpose', activeTab);
    if (location.province) params.set('province', location.province);
    if (location.district) params.set('district', location.district);
    if (location.neighborhood) params.set('neighborhood', location.neighborhood);
    if (keyword.trim()) params.set('q', keyword.trim());
    if (propertyTypes.length > 0) params.set('propertyTypes', propertyTypes.join(','));
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (rooms.length > 0) params.set('rooms', rooms.join(','));
    navigate(`/${activeTab === 'rent' ? 'rent' : 'buy'}?${params.toString()}`);
  }

  function handleTabChange(tab: 'buy' | 'rent') {
    setActiveTab(tab);
    setPropertyTypes([]);
    setRooms([]);
    setBathrooms([]);
    setRentDuration([]);
  }

  return (
    <section className="relative z-20 -mt-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-background/95 backdrop-blur-md rounded-2xl shadow-2xl border border-border overflow-hidden">
          {/* Top bar: Tabs + Search button */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3">
            {/* Buy / Rent Toggle */}
            <div className="flex gap-0.5 bg-muted rounded-full p-0.5">
              <button
                onClick={() => handleTabChange('buy')}
                className={`px-5 py-1.5 text-sm font-semibold rounded-full transition-all duration-200 ${
                  activeTab === 'buy'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => handleTabChange('rent')}
                className={`px-5 py-1.5 text-sm font-semibold rounded-full transition-all duration-200 ${
                  activeTab === 'rent'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Rent
              </button>
            </div>

            <Button className="h-9 px-5 rounded-full font-semibold text-sm shadow-md" onClick={handleSearch}>
              <Search className="h-4 w-4 mr-1.5" />
              Search
            </Button>
          </div>

          {/* Divider */}
          <div className="h-px bg-border mx-5" />

          {/* Search inputs row */}
          <div className="px-5 py-3 flex items-center gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <LocationPicker value={location} onChange={setLocation} compact />
              <div className="h-6 w-px bg-border shrink-0" />
              <div className="relative flex-1 min-w-0 max-w-[240px]">
                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Keyword..."
                  className="w-full h-9 pl-8 pr-7 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                {keyword && (
                  <button onClick={() => setKeyword('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border mx-5" />

          {/* Filter Row */}
          <div className="px-5 py-2.5 flex flex-wrap items-center gap-1.5">
            <PropertyTypeDropdown selected={propertyTypes} onChange={setPropertyTypes} />
            <PriceDropdown minPrice={minPrice} maxPrice={maxPrice} onChange={(min, max) => { setMinPrice(min); setMaxPrice(max); }} />
            <AreaDropdown minArea={minArea} maxArea={maxArea} onChange={(min, max) => { setMinArea(min); setMaxArea(max); }} />
            <RoomsDropdown value={rooms} onChange={setRooms} />
            {activeTab === 'buy' ? (
              <BathroomsDropdown value={bathrooms} onChange={setBathrooms} />
            ) : (
              <RentDurationDropdown value={rentDuration} onChange={setRentDuration} />
            )}
            <div className="h-5 w-px bg-border shrink-0 mx-0.5" />
            <PropertyFiltersModal
              filters={moreFilters}
              onFiltersChange={setMoreFilters}
              onClearAll={() => {
                setLocation({});
                setKeyword('');
                setPropertyTypes([]);
                setMinPrice('');
                setMaxPrice('');
                setMinArea('');
                setMaxArea('');
                setRooms([]);
                setBathrooms([]);
                setRentDuration([]);
                setMoreFilters(emptyMoreFilters);
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSearch;
