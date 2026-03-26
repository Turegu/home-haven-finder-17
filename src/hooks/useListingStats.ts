import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ListingStats {
  impressions: number;
  views: number;
  saves: number;
  inquiryClicks: number;
  whatsappClicks: number;
  callClicks: number;
  emailClicks: number;
}

interface ClickRecord {
  click_type: string;
}

interface ListingIdRecord {
  listing_id: string;
}

interface PropertyIdRecord {
  property_id: string;
}

export function useListingStats(listingId: string | undefined, listingType: 'property' | 'project' = 'property') {
  return useQuery({
    queryKey: ['listing-stats', listingId, listingType],
    queryFn: async (): Promise<ListingStats> => {
      if (!listingId) return { impressions: 0, views: 0, saves: 0, inquiryClicks: 0, whatsappClicks: 0, callClicks: 0, emailClicks: 0 };

      const [impressionsRes, viewsRes, clicksRes, savesRes] = await Promise.all([
        supabase.from('listing_impressions').select('id', { count: 'exact', head: true }).eq('listing_id', listingId).eq('listing_type', listingType),
        supabase.from('listing_views').select('id', { count: 'exact', head: true }).eq('listing_id', listingId).eq('listing_type', listingType),
        supabase.from('listing_inquiry_clicks').select('click_type').eq('listing_id', listingId).eq('listing_type', listingType),
        listingType === 'property'
          ? supabase.from('saved_properties').select('id', { count: 'exact', head: true }).eq('property_id', listingId)
          : Promise.resolve({ count: 0, data: null, error: null }),
      ]);

      const clicks = (clicksRes.data || []) as ClickRecord[];
      const whatsappClicks = clicks.filter((c) => c.click_type === 'whatsapp').length;
      const callClicks = clicks.filter((c) => c.click_type === 'call').length;
      const emailClicks = clicks.filter((c) => c.click_type === 'email').length;

      return {
        impressions: impressionsRes.count || 0,
        views: viewsRes.count || 0,
        saves: savesRes.count || 0,
        inquiryClicks: clicks.length,
        whatsappClicks,
        callClicks,
        emailClicks,
      };
    },
    enabled: !!listingId,
    staleTime: 60_000,
  });
}

// Batch stats for multiple listings (for dashboard tables)
export function useMultipleListingStats(listingIds: string[], listingType: 'property' | 'project' = 'property') {
  return useQuery({
    queryKey: ['multi-listing-stats', listingIds.sort().join(','), listingType],
    queryFn: async (): Promise<Record<string, ListingStats>> => {
      if (!listingIds.length) return {};

      const [impressionsRes, viewsRes, clicksRes, savesRes] = await Promise.all([
        supabase.from('listing_impressions').select('listing_id').in('listing_id', listingIds).eq('listing_type', listingType),
        supabase.from('listing_views').select('listing_id').in('listing_id', listingIds).eq('listing_type', listingType),
        supabase.from('listing_inquiry_clicks').select('listing_id, click_type').in('listing_id', listingIds).eq('listing_type', listingType),
        listingType === 'property'
          ? supabase.from('saved_properties').select('property_id').in('property_id', listingIds)
          : Promise.resolve({ data: [] as PropertyIdRecord[] }),
      ]);

      const result: Record<string, ListingStats> = {};
      listingIds.forEach(id => {
        const imps = ((impressionsRes.data || []) as ListingIdRecord[]).filter((r) => r.listing_id === id).length;
        const views = ((viewsRes.data || []) as ListingIdRecord[]).filter((r) => r.listing_id === id).length;
        const clicks = ((clicksRes.data || []) as (ListingIdRecord & ClickRecord)[]).filter((r) => r.listing_id === id);
        const saves = ((savesRes.data || []) as PropertyIdRecord[]).filter((r) => r.property_id === id).length;

        result[id] = {
          impressions: imps,
          views,
          saves,
          inquiryClicks: clicks.length,
          whatsappClicks: clicks.filter((c) => c.click_type === 'whatsapp').length,
          callClicks: clicks.filter((c) => c.click_type === 'call').length,
          emailClicks: clicks.filter((c) => c.click_type === 'email').length,
        };
      });
      return result;
    },
    enabled: listingIds.length > 0,
    staleTime: 60_000,
  });
}

// Get tier label based on stats
export function getPerformanceTier(stats: ListingStats): { label: string; color: string; description: string } {
  const { impressions, views, saves, inquiryClicks } = stats;

  if (impressions >= 50 && views >= 10 && inquiryClicks >= 3) {
    return { label: 'High Demand', color: 'bg-red-100 text-red-800', description: 'Strong buyer interest with multiple inquiries' };
  }
  if (impressions >= 25 && views >= 5 && (inquiryClicks >= 1 || saves >= 2)) {
    return { label: 'Building Momentum', color: 'bg-orange-100 text-orange-800', description: 'Gaining traction with consistent engagement' };
  }
  if (impressions >= 10 && (views >= 3 || saves >= 1)) {
    return { label: 'Growing Interest', color: 'bg-yellow-100 text-yellow-800', description: 'Attracting attention from potential buyers' };
  }
  if (impressions >= 1) {
    return { label: 'Initial Exposure', color: 'bg-blue-100 text-blue-800', description: 'Listing is being discovered by users' };
  }
  return { label: 'Listing Active', color: 'bg-emerald-100 text-emerald-800', description: 'Your listing is live and visible' };
}
