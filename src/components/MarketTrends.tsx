import { useState, useMemo } from "react";
import { TrendingUp, Home, CalendarClock, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useMarketStats, useNeighbourhoodsInTown } from "@/hooks/useMarketTrends";

interface MarketTrendsProps {
  province: string | null;
  town: string | null;
  neighbourhood: string | null;
  currency?: string;
  areaUnit?: string;
}

const MIN_DATA_THRESHOLD = 2;

const MarketTrends = ({ province, town, neighbourhood, currency = "USD", areaUnit = "m²" }: MarketTrendsProps) => {
  const [selectedNeighbourhood, setSelectedNeighbourhood] = useState(neighbourhood);
  const { data: neighbourhoods } = useNeighbourhoodsInTown(province, town);
  const { data: stats, isLoading } = useMarketStats(selectedNeighbourhood, town, province);

  const hasEnoughSaleData = stats && stats.saleCount >= MIN_DATA_THRESHOLD;
  const hasEnoughRentData = stats && stats.rentCount >= MIN_DATA_THRESHOLD;

  const formatPrice = (val: number | null) => {
    if (val === null) return "—";
    return `${val.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${currency}/${areaUnit}`;
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Average Housing Prices</h2>
        </div>
        {neighbourhoods && neighbourhoods.length > 0 && (
          <Select value={selectedNeighbourhood ?? ""} onValueChange={setSelectedNeighbourhood}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select neighbourhood" />
            </SelectTrigger>
            <SelectContent>
              {neighbourhoods.map((n) => (
                <SelectItem key={n.name} value={n.name}>{n.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Average Sale Price */}
          <StatCard
            icon={<Home className="h-8 w-8 text-primary" />}
            title="Average Sale Price"
            value={hasEnoughSaleData ? formatPrice(stats.avgSalePricePerM2) : null}
            min={hasEnoughSaleData ? formatPrice(stats.minSalePricePerM2) : null}
            max={hasEnoughSaleData ? formatPrice(stats.maxSalePricePerM2) : null}
            count={stats?.saleCount ?? 0}
          />

          {/* Average Rent Price */}
          <StatCard
            icon={<Home className="h-8 w-8 text-primary" />}
            title="Average Monthly Rental"
            value={hasEnoughRentData ? formatPrice(stats.avgRentPricePerM2) : null}
            min={hasEnoughRentData ? formatPrice(stats.minRentPricePerM2) : null}
            max={hasEnoughRentData ? formatPrice(stats.maxRentPricePerM2) : null}
            count={stats?.rentCount ?? 0}
          />

          {/* Rental Payback Period */}
          <StatCard
            icon={<CalendarClock className="h-8 w-8 text-primary" />}
            title="Rental Payback Period"
            value={
              hasEnoughSaleData && hasEnoughRentData && stats.rentalPaybackYears
                ? `${stats.rentalPaybackYears.toFixed(1)} Years`
                : null
            }
            count={hasEnoughSaleData && hasEnoughRentData ? Math.min(stats.saleCount, stats.rentCount) : 0}
          />
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-4">
        {selectedNeighbourhood && town ? `Based on residential properties listed in ${selectedNeighbourhood}, ${town}` : "Select a neighbourhood to view market data"}
      </p>
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | null;
  min?: string | null;
  max?: string | null;
  count: number;
}

const StatCard = ({ icon, title, value, min, max, count }: StatCardProps) => (
  <div className="bg-muted/50 rounded-lg p-5 text-center space-y-2">
    <div className="flex justify-center">{icon}</div>
    <h3 className="font-semibold text-sm text-foreground">{title}</h3>
    {value ? (
      <>
        <p className="text-xl font-bold text-primary">{value}</p>
        {min && max && (
          <div className="flex justify-between text-xs text-muted-foreground px-2">
            <span>Min: {min}</span>
            <span>Max: {max}</span>
          </div>
        )}
        <p className="text-xs text-muted-foreground">Based on {count} properties</p>
      </>
    ) : (
      <div className="flex flex-col items-center gap-1 py-2">
        <AlertCircle className="h-5 w-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Not enough data</p>
        <p className="text-xs text-muted-foreground">{count < MIN_DATA_THRESHOLD ? `Only ${count} listing${count !== 1 ? "s" : ""} found` : "No listings found"}</p>
      </div>
    )}
  </div>
);

export default MarketTrends;
