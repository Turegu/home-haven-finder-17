import { useState } from "react";
import { BarChart3, AlertCircle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { usePriceTrends, useNeighbourhoodsInTown, CurrentPropertyData } from "@/hooks/useMarketTrends";
import { useTranslation } from "react-i18next";

interface PriceTrendsChartProps {
  province: string | null;
  town: string | null;
  neighbourhood: string | null;
  currency?: string;
  areaUnit?: string;
  currentProperty?: CurrentPropertyData;
}

const PriceTrendsChart = ({ province, town, neighbourhood, currency = "USD", areaUnit = "m²", currentProperty }: PriceTrendsChartProps) => {
  const { t } = useTranslation();
  const [selectedNeighbourhood, setSelectedNeighbourhood] = useState(neighbourhood);
  const { data: neighbourhoods } = useNeighbourhoodsInTown(province, town);

  const isOwnNeighbourhood = selectedNeighbourhood === neighbourhood;
  const { data: trends, isLoading } = usePriceTrends(
    selectedNeighbourhood, town, province,
    isOwnNeighbourhood ? currentProperty : undefined
  );

  const chartData = (trends ?? []).map((t) => ({
    period: t.period,
    avgPrice: Math.round(t.avgPricePerM2),
    count: t.count,
  }));

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Price Trends</h2>
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
        <Skeleton className="h-[300px] rounded-lg" />
      ) : chartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <AlertCircle className="h-8 w-8 mb-2" />
          <p className="text-sm font-medium">Not enough data to display trends</p>
          <p className="text-xs mt-1">No sale properties found in this neighbourhood</p>
        </div>
      ) : chartData.length === 1 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-sm text-muted-foreground mb-2">Current average price per {areaUnit}</p>
          <p className="text-3xl font-bold text-primary">
            {chartData[0].avgPrice.toLocaleString()} {currency}/{areaUnit}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Based on {chartData[0].count} listing{chartData[0].count !== 1 ? "s" : ""} · {chartData[0].period}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            More data points needed to show a trend chart
          </p>
        </div>
      ) : (
        <>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(174, 100%, 29%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(174, 100%, 29%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 90%)" />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 11, fill: "hsl(0, 0%, 45%)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(0, 0%, 45%)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="bg-background border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
                        <p className="font-semibold text-foreground mb-1">{label}</p>
                        <p className="text-primary font-bold">
                          {payload[0].value?.toLocaleString()} {currency}/{areaUnit}
                        </p>
                        <p className="text-muted-foreground">{(payload[0].payload as Record<string, unknown>).count as number} properties</p>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="avgPrice"
                  stroke="hsl(174, 100%, 29%)"
                  strokeWidth={2}
                  fill="url(#priceGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Average sale price per {areaUnit} over time in {selectedNeighbourhood}, {town}
          </p>
        </>
      )}
    </div>
  );
};

export default PriceTrendsChart;
