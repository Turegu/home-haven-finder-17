import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
}

interface PriceTrendPoint {
  period: string;
  avgPricePerM2: number;
  count: number;
}

async function fetchMarketStats(
  neighbourhood: string,
  town: string,
  province: string
): Promise<MarketStats> {
  // Fetch sale properties in the neighbourhood
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

  // Fetch rent properties in the neighbourhood
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

  const sale = saleProps ?? [];
  const rent = rentProps ?? [];

  let avgSale: number | null = null;
  let minSale: number | null = null;
  let maxSale: number | null = null;

  if (sale.length > 0) {
    const totalSalePrice = sale.reduce((s, p) => s + Number(p.price), 0);
    const totalSaleArea = sale.reduce((s, p) => s + Number(p.area), 0);
    avgSale = totalSaleArea > 0 ? totalSalePrice / totalSaleArea : null;

    const perM2s = sale.map((p) => Number(p.price) / Number(p.area));
    minSale = Math.min(...perM2s);
    maxSale = Math.max(...perM2s);
  }

  let avgRent: number | null = null;
  let minRent: number | null = null;
  let maxRent: number | null = null;

  if (rent.length > 0) {
    const totalRentPrice = rent.reduce((s, p) => s + Number(p.price), 0);
    const totalRentArea = rent.reduce((s, p) => s + Number(p.area), 0);
    avgRent = totalRentArea > 0 ? totalRentPrice / totalRentArea : null;

    const perM2s = rent.map((p) => Number(p.price) / Number(p.area));
    minRent = Math.min(...perM2s);
    maxRent = Math.max(...perM2s);
  }

  // Rental payback = property_value / (avg_rent_per_m2 * area) → in years
  // Since we show payback for the neighbourhood, we use: avg_sale / (avg_rent * 12)
  let rentalPaybackYears: number | null = null;
  if (avgSale && avgRent && avgRent > 0) {
    rentalPaybackYears = avgSale / (avgRent * 12);
  }

  return {
    avgSalePricePerM2: avgSale,
    avgRentPricePerM2: avgRent,
    minSalePricePerM2: minSale,
    maxSalePricePerM2: maxSale,
    minRentPricePerM2: minRent,
    maxRentPricePerM2: maxRent,
    saleCount: sale.length,
    rentCount: rent.length,
    rentalPaybackYears,
  };
}

export function useMarketStats(
  neighbourhood: string | null,
  town: string | null,
  province: string | null
) {
  return useQuery({
    queryKey: ["market-stats", province, town, neighbourhood],
    queryFn: () => fetchMarketStats(neighbourhood!, town!, province!),
    enabled: !!neighbourhood && !!town && !!province,
    staleTime: 5 * 60 * 1000,
  });
}

async function fetchPriceTrends(
  neighbourhood: string,
  town: string,
  province: string
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

  if (!data || data.length === 0) return [];

  // Group by month
  const grouped: Record<string, { totalPrice: number; totalArea: number; count: number }> = {};
  for (const p of data) {
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
  province: string | null
) {
  return useQuery({
    queryKey: ["price-trends", province, town, neighbourhood],
    queryFn: () => fetchPriceTrends(neighbourhood!, town!, province!),
    enabled: !!neighbourhood && !!town && !!province,
    staleTime: 5 * 60 * 1000,
  });
}

// Fetch neighbourhoods in the same town for the selector
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
