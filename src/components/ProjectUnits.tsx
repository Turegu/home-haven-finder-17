import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAreaUnit } from "@/hooks/useAreaUnit";
import {
  ChevronLeft, ChevronRight, Building, Maximize,
  BedDouble, Bath, Car, Eye, DollarSign, Home, CheckCircle
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface ProjectUnit {
  id: string;
  unit_name: string;
  unit_type: string;
  price: number | null;
  currency: string | null;
  area: number | null;
  area_unit: string | null;
  rooms: string | null;
  bathrooms: number | null;
  car_parking: number | null;
  images: string[] | null;
  status: string;
}

interface ProjectUnitsProps {
  projectId: string;
}

const MOCK_UNITS: ProjectUnit[] = [
  {
    id: "mock-1",
    unit_name: "Villa 1",
    unit_type: "Villa",
    price: 285000,
    currency: "$",
    area: 180,
    area_unit: "m²",
    rooms: "3+1",
    bathrooms: 2,
    car_parking: 1,
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
    ],
    status: "available",
  },
  {
    id: "mock-2",
    unit_name: "Apartment A2",
    unit_type: "Apartment",
    price: 145000,
    currency: "$",
    area: 95,
    area_unit: "m²",
    rooms: "2+1",
    bathrooms: 1,
    car_parking: 1,
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop",
    ],
    status: "available",
  },
  {
    id: "mock-3",
    unit_name: "Penthouse B1",
    unit_type: "Penthouse",
    price: 520000,
    currency: "$",
    area: 310,
    area_unit: "m²",
    rooms: "4+1",
    bathrooms: 3,
    car_parking: 2,
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop",
    ],
    status: "reserved",
  },
];

const statusColors: Record<string, string> = {
  available: "bg-emerald-100 text-emerald-800 border-emerald-200",
  reserved: "bg-amber-100 text-amber-800 border-amber-200",
  sold: "bg-red-100 text-red-800 border-red-200",
};

const ProjectUnits = ({ projectId }: ProjectUnitsProps) => {
  const [units, setUnits] = useState<ProjectUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { formatArea } = useAreaUnit();

  useEffect(() => {
    const fetchUnits = async () => {
      const { data } = await supabase
        .from("project_units")
        .select("*")
        .eq("project_id", projectId)
        .order("unit_name");
      const dbUnits = (data as ProjectUnit[]) || [];
      const finalUnits = dbUnits.length > 0 ? dbUnits : MOCK_UNITS;
      setUnits(finalUnits);
      if (finalUnits.length > 0) setSelectedUnit(finalUnits[0].id);
      setLoading(false);
    };
    fetchUnits();
  }, [projectId]);

  const filtered = filter === "all"
    ? units
    : units.filter((u) => u.status === filter);

  const currentUnit = filtered.find((u) => u.id === selectedUnit) || filtered[0];

  const nextImage = () => {
    if (!currentUnit?.images?.length) return;
    setCurrentImageIndex((prev) => (prev + 1) % currentUnit.images!.length);
  };
  const prevImage = () => {
    if (!currentUnit?.images?.length) return;
    setCurrentImageIndex((prev) => (prev - 1 + currentUnit.images!.length) % currentUnit.images!.length);
  };

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [selectedUnit, filter]);

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Available Units</h2>
        <p className="text-sm text-muted-foreground">Loading units...</p>
      </div>
    );
  }

  if (units.length === 0) return null;

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-foreground">Available Units</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} unit{filtered.length !== 1 ? 's' : ''} found</p>
        </div>
        <Select value={selectedUnit || ''} onValueChange={(v) => setSelectedUnit(v)}>
          <SelectTrigger className="w-[200px] h-9 text-sm">
            <SelectValue placeholder="Select a unit" />
          </SelectTrigger>
          <SelectContent>
            {units.map((unit) => (
              <SelectItem key={unit.id} value={unit.id}>{unit.unit_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No units match this filter.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Unit List (left) */}
            <div className="lg:col-span-2">
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {filtered.map((unit) => (
                  <button
                    key={unit.id}
                    onClick={() => setSelectedUnit(unit.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      currentUnit?.id === unit.id
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-primary/40 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="font-semibold text-foreground text-sm">{unit.unit_name}</h4>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusColors[unit.status] || ''}`}>
                        {unit.status.charAt(0).toUpperCase() + unit.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building className="h-3 w-3" /> {unit.unit_type}
                      </span>
                      {unit.area && (
                        <span className="flex items-center gap-1">
                          <Maximize className="h-3 w-3" /> {formatArea(unit.area, unit.area_unit || 'm²')}
                        </span>
                      )}
                      {unit.rooms && (
                        <span className="flex items-center gap-1">
                          <BedDouble className="h-3 w-3" /> {unit.rooms}
                        </span>
                      )}
                    </div>
                    {unit.price != null && (
                      <p className="text-primary font-bold text-sm mt-1.5">
                        {unit.currency || '$'}{unit.price.toLocaleString()}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Unit Detail (right) */}
            {currentUnit && (
              <div className="lg:col-span-3">
                {/* Image */}
                <div className="relative rounded-xl overflow-hidden bg-muted aspect-[16/10]">
                  {currentUnit.images && currentUnit.images.length > 0 ? (
                    <>
                      <img
                        src={currentUnit.images[currentImageIndex]}
                        alt={currentUnit.unit_name}
                        className="w-full h-full object-cover"
                      />
                      {currentUnit.images.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 hover:bg-background flex items-center justify-center shadow-md transition-colors"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 hover:bg-background flex items-center justify-center shadow-md transition-colors"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {currentUnit.images.map((_, i) => (
                              <button
                                key={i}
                                onClick={() => setCurrentImageIndex(i)}
                                className={`h-2 w-2 rounded-full transition-colors ${
                                  i === currentImageIndex ? "bg-primary" : "bg-background/60"
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                      <div className="absolute top-3 right-3">
                        <Badge variant="outline" className={`${statusColors[currentUnit.status] || ''} text-xs`}>
                          {currentUnit.status.charAt(0).toUpperCase() + currentUnit.status.slice(1)}
                        </Badge>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Building className="h-12 w-12" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Fact boxes — full width below */}
          {currentUnit && (
            <div className="grid grid-cols-4 gap-3 mt-6">
              <UnitSpecCard icon={Building} label="Type" value={currentUnit.unit_type} />
              <UnitSpecCard icon={DollarSign} label="Price" value={currentUnit.price != null ? `${currentUnit.currency || '$'}${currentUnit.price.toLocaleString()}` : '—'} />
              <UnitSpecCard icon={Maximize} label="Area" value={currentUnit.area != null ? formatArea(currentUnit.area, currentUnit.area_unit || 'm²') : '—'} />
              <UnitSpecCard icon={BedDouble} label="Rooms" value={currentUnit.rooms || '—'} />
              <UnitSpecCard icon={Bath} label="Bathrooms" value={currentUnit.bathrooms != null ? String(currentUnit.bathrooms) : '—'} />
              <UnitSpecCard icon={Car} label="Parking" value={currentUnit.car_parking != null ? String(currentUnit.car_parking) : '—'} />
              <UnitSpecCard icon={CheckCircle} label="Available" value={`${units.filter(u => u.status === 'available').length} — ${currentUnit.unit_name}`} />
              <UnitSpecCard icon={Eye} label="Status" value={currentUnit.status.charAt(0).toUpperCase() + currentUnit.status.slice(1)} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

const UnitSpecCard = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
    <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <div>
      <p className="text-[11px] text-muted-foreground leading-tight">{label}</p>
      <p className="font-semibold text-foreground text-sm">{value}</p>
    </div>
  </div>
);

export default ProjectUnits;
