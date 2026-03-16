import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ChevronLeft, ChevronRight, Building, DollarSign, Maximize,
  BedDouble, Bath, Car
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

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

const ProjectUnits = ({ projectId }: ProjectUnitsProps) => {
  const [units, setUnits] = useState<ProjectUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [currentUnitIndex, setCurrentUnitIndex] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchUnits = async () => {
      const { data } = await supabase
        .from("project_units")
        .select("*")
        .eq("project_id", projectId)
        .order("unit_name");
      setUnits((data as ProjectUnit[]) || []);
      setLoading(false);
    };
    fetchUnits();
  }, [projectId]);

  const filtered = filter === "all"
    ? units
    : units.filter((u) => u.status === filter);

  const currentUnit = filtered[currentUnitIndex];

  const nextUnit = () => {
    setCurrentUnitIndex((prev) => (prev + 1) % filtered.length);
    setCurrentImageIndex(0);
  };
  const prevUnit = () => {
    setCurrentUnitIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    setCurrentImageIndex(0);
  };

  const nextImage = () => {
    if (!currentUnit?.images?.length) return;
    setCurrentImageIndex((prev) => (prev + 1) % currentUnit.images!.length);
  };
  const prevImage = () => {
    if (!currentUnit?.images?.length) return;
    setCurrentImageIndex((prev) => (prev - 1 + currentUnit.images!.length) % currentUnit.images!.length);
  };

  // Reset index when filter changes
  useEffect(() => {
    setCurrentUnitIndex(0);
    setCurrentImageIndex(0);
  }, [filter]);

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Units</h2>
        <p className="text-sm text-muted-foreground">Loading units...</p>
      </div>
    );
  }

  if (units.length === 0) return null;

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-foreground">Units</h2>
        <div className="flex items-center gap-2">
          {/* Navigation arrows */}
          {filtered.length > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={prevUnit}
                className="h-8 w-8 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={nextUnit}
                className="h-8 w-8 rounded-md border border-border flex items-center justify-center hover:bg-muted transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
          {/* Filter dropdown */}
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[160px] h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Units</SelectItem>
              <SelectItem value="available">Available Units</SelectItem>
              <SelectItem value="reserved">Reserved Units</SelectItem>
              <SelectItem value="sold">Sold Units</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No units match this filter.
        </p>
      ) : currentUnit ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image Slider */}
          <div className="relative rounded-lg overflow-hidden bg-muted aspect-[4/3]">
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
                      className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-primary/80 hover:bg-primary text-primary-foreground flex items-center justify-center transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-primary/80 hover:bg-primary text-primary-foreground flex items-center justify-center transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    {/* Dots */}
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
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <Building className="h-12 w-12" />
              </div>
            )}
          </div>

          {/* Unit Details */}
          <div>
            <h3 className="font-bold text-foreground text-lg mb-4">
              {currentUnit.unit_name}
              {currentUnit.rooms ? `, ${currentUnit.rooms} Room` : ""}
              {currentUnit.area ? `, ${currentUnit.area} ${currentUnit.area_unit || "m²"}` : ""}
            </h3>

            <div className="space-y-3">
              <UnitInfoRow
                icon={Building}
                label="Type of unit"
                value={currentUnit.unit_type}
              />
              <UnitInfoRow
                icon={DollarSign}
                label="Price"
                value={currentUnit.price != null ? `${currentUnit.currency || "$"}${currentUnit.price.toLocaleString()}` : "—"}
              />
              <UnitInfoRow
                icon={Maximize}
                label="Area"
                value={currentUnit.area != null ? `${currentUnit.area} ${currentUnit.area_unit || "m²"}` : "—"}
              />
              <UnitInfoRow
                icon={BedDouble}
                label="Rooms"
                value={currentUnit.rooms || "—"}
              />
              <UnitInfoRow
                icon={Bath}
                label="Bathrooms"
                value={currentUnit.bathrooms != null ? String(currentUnit.bathrooms) : "—"}
              />
              <UnitInfoRow
                icon={Car}
                label="Car Parking"
                value={currentUnit.car_parking != null ? String(currentUnit.car_parking) : "—"}
              />
            </div>

            {/* Unit counter */}
            <p className="text-xs text-muted-foreground mt-4">
              Unit {currentUnitIndex + 1} of {filtered.length}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const UnitInfoRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) => (
  <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
    <span className="flex items-center gap-2 text-sm text-muted-foreground">
      <Icon className="h-4 w-4 text-primary" />
      {label}
    </span>
    <span className="font-semibold text-foreground text-sm">{value}</span>
  </div>
);

export default ProjectUnits;
