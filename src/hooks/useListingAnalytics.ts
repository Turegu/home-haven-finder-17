import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

type ListingType = 'property' | 'project' | 'event';

// Track a page view (direct hit)
export function useTrackPageView(listingId: string | undefined, listingType: ListingType) {
  const tracked = useRef(false);
  useEffect(() => {
    if (!listingId || tracked.current) return;
    tracked.current = true;
    
    const track = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('listing_views').insert({
        listing_id: listingId,
        listing_type: listingType,
        viewer_id: user?.id || null,
      } as any);
    };
    track();
  }, [listingId, listingType]);
}

// Track impressions (batch — when listings appear in search results)
export async function trackImpressions(listingIds: string[], listingType: ListingType) {
  if (!listingIds.length) return;
  const rows = listingIds.map(id => ({
    listing_id: id,
    listing_type: listingType,
  }));
  await supabase.from('listing_impressions').insert(rows as any);
}

// Track inquiry click (WhatsApp, Call, Email)
export async function trackInquiryClick(listingId: string, listingType: ListingType, clickType: 'whatsapp' | 'call' | 'email') {
  await supabase.from('listing_inquiry_clicks').insert({
    listing_id: listingId,
    listing_type: listingType,
    click_type: clickType,
  } as any);
}
