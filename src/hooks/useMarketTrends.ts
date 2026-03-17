import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CurrentPropertyData {
  price: number;
  area: number;
  purpose: "buy" | "rent";
}

interface MarketStats {
  avgSalePricePerM2: number | null;
  avgRentPricePerM2: number | null;
  minSalePricePerM2: number | null;
  maxSalePricePerM2: number | null;
  minRentPricePerM2: number | null;
  maxRentPricePerM2: number | null;
  saleCount: number;
  rentCount: number;
  rentalPaybackYears: number | null;
  isCurrentPropertyOnly: boolean;
}

interface PriceTrendPoint {
  period: string;
  avgPricePerM2: number;
  count: number;
}

function calcStats(props: { price: number; area: number }[]) {
  if (props.length === 0) return { avg: null, min: null, max: null };
  const totalPrice = props.reduce((s, p) => s + p.price, 0);
  const totalArea = props.reduce((s, p) => s + p.area, 0);
  const avg = totalArea > 0 ? totalPrice / totalArea : null;
  const perM2s = props.map((p) => p.price / p.area);
  return { avg, min: Math.min(...perM2s), max: Math.max(...perM2s) };
}

async function fetchMarketStats(
  neighbourhood: string,
  town: string,
  province: string,
  currentProperty?: CurrentPropertyData
): Promise<MarketStats> {
  const { data: saleProps } = await supabase
    .from("properties")
    .select("price, area")
    .eq("status", "active")
    .eq("property_purpose", "buy")
    .eq("neighbourhood", neighbourhood)
    .eq("town", town)
    .eq("province", province)
    .not("price", "is", null)
    .not("area", "is", null)
    .gt("price", 0)
    .gt("area", 0);

  const { data: rentProps } = await supabase
    .from("properties")
    .select("price, area")
    .eq("status", "active")
    .eq("property_purpose", "rent")
    .eq("neighbourhood", neighbourhood)
    .eq("town", town)
    .eq("province", province)
    .not("price", "is", null)
    .not("area", "is", null)
    .gt("price", 0)
    .gt("area", 0);

  let sale = (saleProps ?? []).map((p) => ({ price: Number(p.price), area: Number(p.area) }));
  let rent = (rentProps ?? []).map((p) => ({ price: Number(p.price), area: Number(p.area) }));

  // If no sale properties found and current property is a sale, use it as the sole data point
  let isCurrentPropertyOnly = false;
  if (sale.length === 0 && currentProperty && currentProperty.purpose === "buy" && currentProperty.price > 0 && currentProperty.area > 0) {
    sale = [{ price: currentProperty.price, area: currentProperty.area }];
    isCurrentPropertyOnly = true;
  }

  const saleStats = calcStats(sale);
  const rentStats = calcStats(rent);

  let rentalPaybackYears: number | null = null;
  if (saleStats.avg && rentStats.avg && rentStats.avg > 0) {
    rentalPaybackYears = saleStats.avg / (rentStats.avg * 12);
  }

  return {
    avgSalePricePerM2: saleStats.avg,
    avgRentPricePerM2: rentStats.avg,
    minSalePricePerM2: saleStats.min,
    maxSalePricePerM2: saleStats.max,
    minRentPricePerM2: rentStats.min,
    maxRentPricePerM2: rentStats.max,
    saleCount: sale.length,
    rentCount: rent.length,
    rentalPaybackYears,
    isCurrentPropertyOnly,
  };
}

export function useMarketStats(
  neighbourhood: string | null,
  town: string | null,
  province: string | null,
  currentProperty?: CurrentPropertyData
) {
  return useQuery({
    queryKey: ["market-stats", province, town, neighbourhood],
    queryFn: () => fetchMarketStats(neighbourhood!, town!, province!, currentProperty),
    enabled: !!neighbourhood && !!town && !!province,
    staleTime: 5 * 60 * 1000,
  });
}

async function fetchPriceTrends(
  neighbourhood: string,
  town: string,
  province: string,
  currentProperty?: CurrentPropertyData
): Promise<PriceTrendPoint[]> {
  const { data } = await supabase
    .from("properties")
    .select("price, area, created_at")
    .eq("status", "active")
    .eq("property_purpose", "buy")
    .eq("neighbourhood", neighbourhood)
    .eq("town", town)
    .eq("province", province)
    .not("price", "is", null)
    .not("area", "is", null)
    .gt("price", 0)
    .gt("area", 0)
    .order("created_at", { ascending: true });

  const items = data ?? [];

  // If no data but current property is a sale, show single point
  if (items.length === 0 && currentProperty && currentProperty.purpose === "buy" && currentProperty.price > 0 && currentProperty.area > 0) {
    const now = new Date();
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return [{ period: key, avgPricePerM2: currentProperty.price / currentProperty.area, count: 1 }];
  }

  // Group by month
  const grouped: Record<string, { totalPrice: number; totalArea: number; count: number }> = {};
  for (const p of items) {
    const d = new Date(p.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!grouped[key]) grouped[key] = { totalPrice: 0, totalArea: 0, count: 0 };
    grouped[key].totalPrice += Number(p.price);
    grouped[key].totalArea += Number(p.area);
    grouped[key].count++;
  }

  return Object.entries(grouped)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, { totalPrice, totalArea, count }]) => ({
      period,
      avgPricePerM2: totalArea > 0 ? totalPrice / totalArea : 0,
      count,
    }));
}

export function usePriceTrends(
  neighbourhood: string | null,
  town: string | null,
  province: string | null,
  currentProperty?: CurrentPropertyData
) {
  return useQuery({
    queryKey: ["price-trends", province, town, neighbourhood],
    queryFn: () => fetchPriceTrends(neighbourhood!, town!, province!, currentProperty),
    enabled: !!neighbourhood && !!town && !!province,
    staleTime: 5 * 60 * 1000,
  });
}

export function useNeighbourhoodsInTown(province: string | null, town: string | null) {
  return useQuery({
    queryKey: ["neighbourhoods-in-town", province, town],
    queryFn: async () => {
      if (!province || !town) return [];
      const { data, error } = await supabase.rpc("get_neighborhoods", {
        p_province: province,
        p_district: town,
      });
      if (error) throw error;
      return (data ?? []) as { name: string; ar: string }[];
    },
    enabled: !!province && !!town,
    staleTime: 10 * 60 * 1000,
  });
}
