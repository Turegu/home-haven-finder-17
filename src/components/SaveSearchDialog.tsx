import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bookmark, Loader2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const MAX_SAVED_SEARCHES = 3;

interface SaveSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchParams: Record<string, unknown>;
  selectedFilters: Record<string, string[]>;
  searchType: 'buy' | 'rent' | 'projects';
  location?: { province?: string; district?: string; neighborhood?: string };
  keyword?: string;
}

const SaveSearchDialog = ({
  open,
  onOpenChange,
  searchParams,
  selectedFilters,
  searchType,
  location,
  keyword,
}: SaveSearchDialogProps) => {
  const { t } = useTranslation();
  const [searchName, setSearchName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!searchName.trim()) {
      toast.error(t('saveSearch.enterName'));
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error(t('saveSearch.signInRequired'));
      return;
    }

    setSaving(true);

    // Check max saved searches
    const { count, error: countErr } = await supabase
      .from('saved_searches')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countErr) {
      toast.error(t('saveSearch.failed'));
      setSaving(false);
      return;
    }

    if ((count ?? 0) >= MAX_SAVED_SEARCHES) {
      toast.error(t('saveSearch.maxReached', { max: MAX_SAVED_SEARCHES }));
      setSaving(false);
      return;
    }

    const { error } = await supabase.from('saved_searches').insert({
      user_id: user.id,
      title: searchName.trim(),
      search_type: searchType,
      search_params: searchParams as any,
    });
    setSaving(false);

    if (error) {
      toast.error('Failed to save search. Please try again.');
      return;
    }

    toast.success('Search saved!', { description: 'Visit Saved Searches in your dashboard to manage your alerts.' });
    setSearchName('');
    onOpenChange(false);
  };

  const locationParts = [location?.province, location?.district, location?.neighborhood].filter(Boolean);
  const hasAnyFilter = locationParts.length > 0 || keyword || Object.keys(selectedFilters).length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-primary" />
            Save Search
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Search Name</label>
            <Input
              placeholder="e.g. 3-bed apartments in Istanbul"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              Search Criteria Summary
            </label>

            {!hasAnyFilter ? (
              <p className="text-sm text-muted-foreground italic">No filters selected.</p>
            ) : (
              <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2 max-h-[200px] overflow-y-auto">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground w-20 shrink-0">Type:</span>
                  <Badge variant="secondary" className="text-xs capitalize">{searchType}</Badge>
                </div>

                {locationParts.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-20 shrink-0">Location:</span>
                    <span className="text-xs text-foreground">{locationParts.join(' > ')}</span>
                  </div>
                )}

                {keyword && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-20 shrink-0">Keyword:</span>
                    <span className="text-xs text-foreground">"{keyword}"</span>
                  </div>
                )}

                {Object.entries(selectedFilters).map(([key, values]) => (
                  <div key={key} className="flex items-start gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-20 shrink-0">{key}:</span>
                    <div className="flex flex-wrap gap-1">
                      {values.map((v) => (
                        <Badge key={v} variant="outline" className="text-xs">{v}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground">Maximum {MAX_SAVED_SEARCHES} saved searches allowed.</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Bookmark className="h-4 w-4 mr-1.5" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SaveSearchDialog;
