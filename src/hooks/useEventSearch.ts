import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { turkishNormalize } from '@/lib/utils';

export interface EventSearchParams {
  province?: string;
  district?: string;
  neighborhood?: string;
  keyword?: string;
  eventType?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  page?: number;
  pageSize?: number;
}

export interface EventResult {
  id: string;
  listing_id: string;
  title: string;
  event_type: string;
  event_date: string | null;
  location: string | null;
  province: string | null;
  town: string | null;
  neighbourhood: string | null;
  pin_location: string | null;
  price: number | null;
  currency: string | null;
  entry_type: string;
  images: string[] | null;
  description: string | null;
  organizer: string | null;
  logo_url: string | null;
  display_on_homepage: boolean;
  status: string;
  created_at: string;
  companies: { name: string; logo_url: string | null } | null;
  agents: { name: string; avatar_url: string | null } | null;
}

async function fetchEvents(params: EventSearchParams) {
  const {
    province, district, neighborhood, keyword, eventType,
    dateFrom, dateTo, sortBy = 'newest', page = 1, pageSize = 21,
  } = params;

  let query = supabase
    .from('events')
    .select(`
      *,
      companies:company_id (name, logo_url),
      agents:agent_id (name, avatar_url)
    `, { count: 'exact' })
    .eq('status', 'active');

  if (province) query = query.eq('province', province);
  if (district) query = query.eq('town', district);
  if (neighborhood) query = query.eq('neighbourhood', neighborhood);
  if (keyword) query = query.ilike('title', `%${keyword}%`);
  if (eventType && eventType !== 'All') query = query.eq('event_type', eventType);
  if (dateFrom) query = query.gte('event_date', dateFrom);
  if (dateTo) query = query.lte('event_date', dateTo);

  // Sort — featured (display_on_homepage) always first, then user sort
  query = query.order('display_on_homepage', { ascending: false });
  if (sortBy === 'date_asc') query = query.order('event_date', { ascending: true });
  else if (sortBy === 'date_desc') query = query.order('event_date', { ascending: false });
  else query = query.order('created_at', { ascending: false });

  // Pagination
  const from = (page - 1) * pageSize;
  query = query.range(from, from + pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return { events: (data ?? []) as unknown as EventResult[], total: count ?? 0 };
}

export function useEventSearch(params: EventSearchParams) {
  return useQuery({
    queryKey: ['events-search', params],
    queryFn: () => fetchEvents(params),
    staleTime: 30_000,
  });
}
