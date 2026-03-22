import { useState } from 'react';
import { turkishIncludes } from '@/lib/utils';
import {
  TreePine, Lamp, Flower2, Fence, Sofa, Waves, Dumbbell, ShieldCheck,
  Car, Wifi, Baby, SwissFranc, Flame, Snowflake, Droplets, Shield,
  Camera, Zap, Building2, Coffee, Scissors, Shirt, Film, Palmtree,
  ShowerHead, CreditCard, ScanLine, FireExtinguisher, Mountain,
  Bus, School, ShoppingBag, UtensilsCrossed, MapPin, Bike,
  CookingPot, DoorOpen, BedDouble, Bath, WashingMachine, Armchair,
  Warehouse, Sparkles, Tv, Phone, Cylinder, Volume2, Sun,
  ParkingCircle, Dog, Thermometer, Wind, CircleDot, Heater,
  Fuel, Wrench, Grid3X3, KeyRound, Paintbrush, DoorClosed, Wallpaper,
  ArrowUp, LayoutGrid, Check
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type IconComponent = typeof TreePine;

const exteriorIconMap: Record<string, IconComponent> = {
  'Garden': Flower2,
  'Terrace': Fence,
  'Balcony': Sofa,
  'Lift': ArrowUp,
  'Parking': Car,
  'Parking Lift': Car,
  'WIFI': Wifi,
  "Children's Playground": Baby,
  'Children Swimming Pool': Waves,
  'Outdoor Swimming Pool': Waves,
  'Indoor Swimming Pool': Waves,
  'Sauna': Flame,
  'Jacuzzi': Droplets,
  'Spa': Sparkles,
  'Gym': Dumbbell,
  'Table Tennis': CircleDot,
  'Squash Court': CircleDot,
  'Tennis Court': CircleDot,
  'Football / Basketball Court': CircleDot,
  'Billiards': CircleDot,
  'Party Area': Sparkles,
  'BBQ Area': Flame,
  'Guest Lounge': Armchair,
  'Meeting Room': Building2,
  'Restaurant / Café': Coffee,
  'Patisserie': Coffee,
  'Tailor': Scissors,
  'Shoe Repair Shop': Wrench,
  'Hairdresser': Scissors,
  'Dry Cleaning': Shirt,
  'Flower Shop': Flower2,
  'Barber': Scissors,
  'Cinema / Theater': Film,
  'Beach Access': Palmtree,
  'Private Beach': Palmtree,
  'Beachfront': Palmtree,
  'Beach Nearby': Palmtree,
  'Shower Cabin': ShowerHead,
  'Card Access System': CreditCard,
  'Security': Shield,
  'Security Camera': Camera,
  'Metal Detector': ScanLine,
  'Fire Lift': FireExtinguisher,
  'Generator': Zap,
  'Earthquake Regulations Compliant': ShieldCheck,
  'Close to Public Transport': Bus,
  'Close to a Park': TreePine,
  'Close to Schools': School,
  'Close to Shopping Centers': ShoppingBag,
  'Close to the Beach': Palmtree,
  'Close to Restaurants and Cafes': UtensilsCrossed,
  'Close to the City Center': MapPin,
  'Close to Gym': Bike,
};

const interiorIconMap: Record<string, IconComponent> = {
  'Kitchen Appliances': CookingPot,
  'Balcony': Sofa,
  'Terrace': Fence,
  'Walk-in Closet': DoorOpen,
  'Built in Wardrobes': Warehouse,
  'Washing Machine': WashingMachine,
  'Maid Room': BedDouble,
  'Cloakroom': DoorOpen,
  'Bathtub': Bath,
  'Jacuzzi': Droplets,
  'Laundry Room': WashingMachine,
  'Shower Cabin': ShowerHead,
  'Master Bathroom': Bath,
  'Shared Pool': Waves,
  'Shared Spa': Sparkles,
  'Shared Gym': Dumbbell,
  'Private Garden': Flower2,
  'Private Pool': Waves,
  'Private Gym': Dumbbell,
  'Private Jacuzzi': Droplets,
  "Children's Play Area": Baby,
  "Children's Pool": Waves,
  'Barbecue Area': Flame,
  'Room Service': UtensilsCrossed,
  'Concierge Service': Phone,
  'Video Doorphone': Tv,
  'Water Tank': Cylinder,
  'Sound Insulation': Volume2,
  'Solar Power': Sun,
  'Covered Parking': ParkingCircle,
  'Pets Allowed': Dog,
  'Water Heater': Thermometer,
  'Central A/C': Snowflake,
  'Geothermal': Mountain,
  'Split A/C': Wind,
  'Central Heating (Fuel Oil)': Fuel,
  'Central Heating (Natural Gas)': Flame,
  'Boiler': Heater,
  'Combi Boiler (Natural Gas)': Heater,
  'Combi Boiler (Electric)': Heater,
  'Central System': Grid3X3,
  'Central System (Heat Share Meter)': Grid3X3,
  'Floor Heating': Heater,
  'Kitchen Natural Gas': Flame,
  'Fireplace': Flame,
  'Painted': Paintbrush,
  'Steel Door': DoorClosed,
  'Wallpaper': Wallpaper,
  'High Ceiling': ArrowUp,
};

function getIcon(name: string, type: 'exterior' | 'interior'): IconComponent {
  const map = type === 'exterior' ? exteriorIconMap : interiorIconMap;
  return map[name] || (type === 'exterior' ? TreePine : Lamp);
}

interface AmenitiesViewAllDialogProps {
  type: 'exterior' | 'interior';
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  trigger?: React.ReactNode;
}

export default function AmenitiesViewAllDialog({ type, options, selected, onToggle, trigger }: AmenitiesViewAllDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = search
    ? options.filter(o => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  const title = type === 'exterior' ? 'Exterior Amenities' : 'Interior Amenities';

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => setOpen(true)}
          title={`View all ${title.toLowerCase()}`}
        >
          <LayoutGrid className="h-4 w-4 text-primary" />
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {type === 'exterior' ? <TreePine className="h-5 w-5 text-primary" /> : <Lamp className="h-5 w-5 text-primary" />}
              {title}
              {selected.length > 0 && (
                <Badge variant="default" className="ml-2">{selected.length} selected</Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="relative mb-3">
            <LayoutGrid className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}...`}
              className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>

          <div
            className="overflow-y-auto flex-1 -mx-1 px-1"
            onWheel={(e) => {
              const el = e.currentTarget;
              if (el.scrollHeight <= el.clientHeight) return;
              e.preventDefault();
              e.stopPropagation();
              el.scrollTop += e.deltaY;
            }}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filtered.length === 0 && (
                <p className="col-span-full text-sm text-muted-foreground text-center py-8">No amenities found</p>
              )}
              {filtered.map((opt) => {
                const IconComp = getIcon(opt, type);
                const isChecked = selected.includes(opt);
                return (
                  <label
                    key={opt}
                    className={`flex items-center gap-2.5 cursor-pointer py-2.5 px-3 rounded-lg border transition-all duration-150 ${
                      isChecked
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border hover:border-primary/20 hover:bg-muted/40'
                    }`}
                  >
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => onToggle(opt)}
                    />
                    <IconComp className={`h-4 w-4 shrink-0 ${isChecked ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-sm leading-tight ${isChecked ? 'text-foreground font-medium' : 'text-foreground'}`}>
                      {opt}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border mt-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-primary">{selected.length}</span> of {options.length} selected
            </p>
            <Button onClick={() => setOpen(false)}>
              <Check className="h-4 w-4 mr-1.5" />
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { getIcon, exteriorIconMap, interiorIconMap };
