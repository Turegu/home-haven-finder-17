import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MAX_COMPARE = 3;

export async function toggleSaveProperty(propertyId: string): Promise<boolean | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { toast.error('Please sign in first.'); return null; }

  const { data: existing } = await supabase
    .from('saved_properties')
    .select('id')
    .eq('user_id', user.id)
    .eq('property_id', propertyId)
    .maybeSingle();

  if (existing) {
    await supabase.from('saved_properties').delete().eq('id', existing.id);
    toast.success('Removed from saved properties');
    window.dispatchEvent(new Event('property-actions-changed'));
    return false;
  } else {
    const { error } = await supabase.from('saved_properties').insert({ user_id: user.id, property_id: propertyId });
    if (error) { toast.error('Failed to save property'); return null; }
    toast.success('Property saved!');
    window.dispatchEvent(new Event('property-actions-changed'));
    return true;
  }
}

export async function toggleCompareProperty(propertyId: string): Promise<boolean | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { toast.error('Please sign in first.'); return null; }

  const { data: existing } = await supabase
    .from('property_comparisons')
    .select('id')
    .eq('user_id', user.id)
    .eq('property_id', propertyId)
    .maybeSingle();

  if (existing) {
    await supabase.from('property_comparisons').delete().eq('id', existing.id);
    toast.success('Removed from compare list');
    return false;
  } else {
    // Check max
    const { count } = await supabase
      .from('property_comparisons')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if ((count ?? 0) >= MAX_COMPARE) {
      toast.error(`Maximum ${MAX_COMPARE} properties can be compared. Remove one first.`);
      return null;
    }

    const { error } = await supabase.from('property_comparisons').insert({ user_id: user.id, property_id: propertyId });
    if (error) { toast.error('Failed to add to compare'); return null; }
    toast.success('Added to compare list!');
    return true;
  }
}
