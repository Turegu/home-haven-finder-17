import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
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
      <div className="container mx-auto px-4 max-w-[700px]">
        <div className="bg-background/95 backdrop-blur-md rounded-xl p-4 shadow-2xl border border-border">
          {/* Buy / Rent Toggle */}
          <div className="flex gap-1 mb-4 bg-muted rounded-lg p-1 w-fit">
            <button
              onClick={() => handleTabChange('buy')}
              className={`px-6 py-2 text-sm font-semibold rounded-md transition-all ${
                activeTab === 'buy'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => handleTabChange('rent')}
              className={`px-6 py-2 text-sm font-semibold rounded-md transition-all ${
                activeTab === 'rent'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Rent
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2 mb-4">
            <LocationPicker value={location} onChange={setLocation} compact />
            <div className="relative flex-1">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Enter Search Area, City, Address"
                className="w-full h-10 px-4 pr-8 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              {keyword && (
                <button onClick={() => setKeyword('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button className="h-10 px-6 font-semibold" onClick={handleSearch}>
              <Search className="h-4 w-4 mr-1.5" />
              Search
            </Button>
          </div>

          {/* Filter Row */}
          <div className="flex items-center gap-2">
            <PropertyTypeDropdown selected={propertyTypes} onChange={setPropertyTypes} />
            <PriceDropdown minPrice={minPrice} maxPrice={maxPrice} onChange={(min, max) => { setMinPrice(min); setMaxPrice(max); }} />
            <AreaDropdown minArea={minArea} maxArea={maxArea} onChange={(min, max) => { setMinArea(min); setMaxArea(max); }} />
            <RoomsDropdown value={rooms} onChange={setRooms} />
            {activeTab === 'buy' ? (
              <BathroomsDropdown value={bathrooms} onChange={setBathrooms} />
            ) : (
              <RentDurationDropdown value={rentDuration} onChange={setRentDuration} />
            )}
            <div className="flex-1" />
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
