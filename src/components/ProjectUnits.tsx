import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAreaUnit } from "@/hooks/useAreaUnit";
import {
  ChevronLeft, ChevronRight, Building, Maximize,
  BedDouble, Bath, Car, Eye, DollarSign, CheckCircle
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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
  advertising_tags?: string[] | null;
}

interface PaymentPlan {
  id: string;
  plan_name: string;
  steps: { id: string; percentage: number; title: string; subtitle: string | null; sort_order: number }[];
}

interface ProjectUnitsProps {
  projectId: string;
}

const GENERIC_IMAGES = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
];

const MOCK_UNITS: ProjectUnit[] = [
  {
    id: "mock-1", unit_name: "Villa 1", unit_type: "Villa", price: 285000, currency: "$",
    area: 180, area_unit: "m²", rooms: "3+1", bathrooms: 2, car_parking: 1,
    images: [GENERIC_IMAGES[0], GENERIC_IMAGES[1], GENERIC_IMAGES[5]],
    status: "available", advertising_tags: ["Hot Deal", "Sea View"],
  },
  {
    id: "mock-2", unit_name: "Apartment A2", unit_type: "Apartment", price: 145000, currency: "$",
    area: 95, area_unit: "m²", rooms: "2+1", bathrooms: 1, car_parking: 1,
    images: [GENERIC_IMAGES[2], GENERIC_IMAGES[3], GENERIC_IMAGES[0]],
    status: "available", advertising_tags: ["New Launch"],
  },
  {
    id: "mock-3", unit_name: "Penthouse B1", unit_type: "Penthouse", price: 520000, currency: "$",
    area: 310, area_unit: "m²", rooms: "4+1", bathrooms: 3, car_parking: 2,
    images: [GENERIC_IMAGES[4], GENERIC_IMAGES[1], GENERIC_IMAGES[3]],
    status: "reserved", advertising_tags: ["Exclusive", "Premium Location"],
  },
  {
    id: "mock-4", unit_name: "Studio C3", unit_type: "Studio", price: 78000, currency: "$",
    area: 45, area_unit: "m²", rooms: "Studio", bathrooms: 1, car_parking: 0,
    images: [GENERIC_IMAGES[5], GENERIC_IMAGES[2], GENERIC_IMAGES[4]],
    status: "available", advertising_tags: ["Best Seller"],
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
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [paymentPlans, setPaymentPlans] = useState<Record<string, PaymentPlan[]>>({});
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

      if (dbUnits.length > 0) {
        const unitIds = dbUnits.map(u => u.id);
        const { data: plans } = await supabase
          .from("unit_payment_plans")
          .select("*")
          .in("unit_id", unitIds)
          .eq("is_active", true)
          .order("sort_order");

        if (plans && plans.length > 0) {
          const planIds = plans.map((p: any) => p.id);
          const { data: steps } = await supabase
            .from("unit_payment_plan_steps")
            .select("*")
            .in("plan_id", planIds)
            .order("sort_order");

          const plansMap: Record<string, PaymentPlan[]> = {};
          for (const plan of plans) {
            const p = plan as any;
            if (!plansMap[p.unit_id]) plansMap[p.unit_id] = [];
            plansMap[p.unit_id].push({
              id: p.id,
              plan_name: p.plan_name,
              steps: (steps || []).filter((s: any) => s.plan_id === p.id),
            });
          }
          setPaymentPlans(plansMap);
        }
      }

      setLoading(false);
    };
    fetchUnits();
  }, [projectId]);

  const currentUnit = units.find((u) => u.id === selectedUnit) || units[0];
  const currentUnitIndex = units.findIndex((u) => u.id === selectedUnit);
  const otherUnits = units.filter((u) => u.id !== currentUnit?.id);

  const goToPrevUnit = () => {
    if (units.length <= 1) return;
    const prev = (currentUnitIndex - 1 + units.length) % units.length;
    setSelectedUnit(units[prev].id);
  };
  const goToNextUnit = () => {
    if (units.length <= 1) return;
    const next = (currentUnitIndex + 1) % units.length;
    setSelectedUnit(units[next].id);
  };

  const nextImage = () => {
    if (!currentUnit?.images?.length) return;
    setCurrentImageIndex((prev) => (prev + 1) % currentUnit.images!.length);
  };
  const prevImage = () => {
    if (!currentUnit?.images?.length) return;
    setCurrentImageIndex((prev) => (prev - 1 + currentUnit.images!.length) % currentUnit.images!.length);
  };

  useEffect(() => { setCurrentImageIndex(0); }, [selectedUnit]);

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">Available Units</h2>
        <p className="text-sm text-muted-foreground">Loading units...</p>
      </div>
    );
  }

  if (units.length === 0) return null;

  const currentPlans = currentUnit ? (paymentPlans[currentUnit.id] || []) : [];
  const images = currentUnit?.images || [];

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      {/* 1. Header with dropdown selector */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-foreground">Available Units</h2>
          <p className="text-sm text-muted-foreground">{units.length} unit{units.length !== 1 ? 's' : ''} found</p>
        </div>
        <Select value={selectedUnit || ''} onValueChange={(v) => setSelectedUnit(v)}>
          <SelectTrigger className="w-[220px] h-9 text-sm">
            <SelectValue placeholder="Select a unit" />
          </SelectTrigger>
          <SelectContent>
            {units.map((unit) => (
              <SelectItem key={unit.id} value={unit.id}>
                <span className="flex items-center gap-2">
                  {unit.unit_name}
                  <span className={`inline-block w-2 h-2 rounded-full ${unit.status === 'available' ? 'bg-emerald-500' : unit.status === 'reserved' ? 'bg-amber-500' : 'bg-red-500'}`} />
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {currentUnit && (
        <>
          {/* 2. Full-width image gallery — main + 2 thumbnails */}
          <div className="mb-6">
            {images.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 rounded-xl overflow-hidden">
                {/* Main image */}
                <div className="md:col-span-2 relative aspect-[16/10] bg-muted group">
                  <img
                    src={images[currentImageIndex]}
                    alt={currentUnit.unit_name}
                    className="w-full h-full object-cover"
                  />
                  {images.length > 1 && (
                    <>
                      <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 hover:bg-background flex items-center justify-center shadow-md transition-colors opacity-0 group-hover:opacity-100">
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 hover:bg-background flex items-center justify-center shadow-md transition-colors opacity-0 group-hover:opacity-100">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge variant="outline" className={`${statusColors[currentUnit.status] || ''} text-xs`}>
                      {currentUnit.status.charAt(0).toUpperCase() + currentUnit.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-foreground/60 text-white text-xs px-2 py-1 rounded-md">
                    {currentImageIndex + 1} / {images.length}
                  </div>
                </div>
                {/* Thumbnails column */}
                <div className="hidden md:flex flex-col gap-2">
                  {images.slice(0, 2).map((img, i) => {
                    const thumbIdx = i === 0 ? (currentImageIndex + 1) % images.length : (currentImageIndex + 2) % images.length;
                    return (
                      <button
                        key={i}
                        onClick={() => setCurrentImageIndex(thumbIdx)}
                        className={`flex-1 rounded-lg overflow-hidden border-2 transition-all ${thumbIdx === currentImageIndex ? 'border-primary' : 'border-transparent hover:border-primary/40'}`}
                      >
                        <img
                          src={images[thumbIdx]}
                          alt={`${currentUnit.unit_name} ${thumbIdx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="w-full aspect-[16/6] bg-muted rounded-xl flex items-center justify-center text-muted-foreground">
                <Building className="h-12 w-12" />
              </div>
            )}
          </div>

          {/* 3. Eight info spec cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <UnitSpecCard icon={Building} label="Type" value={currentUnit.unit_type} />
            <UnitSpecCard icon={DollarSign} label="Price" value={currentUnit.price != null ? `${currentUnit.currency || '$'}${currentUnit.price.toLocaleString()}` : '—'} />
            <UnitSpecCard icon={Maximize} label="Area" value={currentUnit.area != null ? formatArea(currentUnit.area, currentUnit.area_unit || 'm²') : '—'} />
            <UnitSpecCard icon={BedDouble} label="Rooms" value={currentUnit.rooms || '—'} />
            <UnitSpecCard icon={Bath} label="Bathrooms" value={currentUnit.bathrooms != null ? String(currentUnit.bathrooms) : '—'} />
            <UnitSpecCard icon={Car} label="Parking" value={currentUnit.car_parking != null ? String(currentUnit.car_parking) : '—'} />
            <UnitSpecCard icon={CheckCircle} label="Available" value={`${units.filter(u => u.status === 'available').length} — ${currentUnit.unit_name}`} />
            <UnitSpecCard icon={Eye} label="Status" value={currentUnit.status.charAt(0).toUpperCase() + currentUnit.status.slice(1)} />
          </div>

          {/* 4. Payment Plan */}
          {currentPlans.length > 0 && (
            <div className="mb-6">
              <h3 className="text-base font-bold text-foreground mb-4">Payment Plan</h3>
              {currentPlans.length === 1 ? (
                <PaymentPlanDisplay plan={currentPlans[0]} />
              ) : (
                <Tabs defaultValue={currentPlans[0].id}>
                  <TabsList className="mb-4">
                    {currentPlans.map((plan) => (
                      <TabsTrigger key={plan.id} value={plan.id}>{plan.plan_name}</TabsTrigger>
                    ))}
                  </TabsList>
                  {currentPlans.map((plan) => (
                    <TabsContent key={plan.id} value={plan.id}>
                      <PaymentPlanDisplay plan={plan} />
                    </TabsContent>
                  ))}
                </Tabs>
              )}
            </div>
          )}

          {/* 5. Other units horizontal scroll */}
          {otherUnits.length > 0 && (
            <div>
              <h3 className="text-base font-bold text-foreground mb-3">Other Units</h3>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                {otherUnits.map((unit) => (
                  <button
                    key={unit.id}
                    onClick={() => setSelectedUnit(unit.id)}
                    className="flex-shrink-0 w-[200px] text-left p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/50 transition-all group"
                  >
                    {/* Thumbnail */}
                    <div className="w-full aspect-[16/10] rounded-lg overflow-hidden bg-muted mb-2">
                      {unit.images && unit.images.length > 0 ? (
                        <img src={unit.images[0]} alt={unit.unit_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Building className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-foreground text-sm truncate">{unit.unit_name}</h4>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusColors[unit.status] || ''}`}>
                        {unit.status.charAt(0).toUpperCase() + unit.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{unit.unit_type}</span>
                      {unit.area && <span>• {formatArea(unit.area, unit.area_unit || 'm²')}</span>}
                      {unit.rooms && <span>• {unit.rooms}</span>}
                    </div>
                    {unit.price != null && (
                      <p className="text-primary font-bold text-sm mt-1">{unit.currency || '$'}{unit.price.toLocaleString()}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const PaymentPlanDisplay = ({ plan }: { plan: PaymentPlan }) => {
  if (plan.steps.length === 0) return null;

  return (
    <div className="flex items-stretch gap-0 overflow-x-auto pb-1">
      {plan.steps.map((step, idx) => (
        <div key={step.id} className="flex items-stretch flex-shrink-0">
          <div className="min-w-[130px] rounded-xl bg-muted/50 border border-border p-4 text-center">
            <p className="text-xl font-bold text-foreground">{step.percentage}%</p>
            <p className="text-sm font-medium text-foreground mt-1">{step.title}</p>
            {step.subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{step.subtitle}</p>
            )}
          </div>
          {idx < plan.steps.length - 1 && (
            <div className="flex items-center px-1.5">
              <ChevronRight className="h-5 w-5 text-muted-foreground/40" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const UnitSpecCard = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
    <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] text-muted-foreground leading-tight">{label}</p>
      <p className="font-semibold text-foreground text-sm truncate">{value}</p>
    </div>
  </div>
);

export default ProjectUnits;
