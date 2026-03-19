import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bookmark, Loader2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SaveSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchParams: Record<string, unknown>;
  selectedFilters: Record<string, string[]>;
  searchType: 'buy' | 'rent';
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
  const [searchName, setSearchName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!searchName.trim()) {
      toast.error('Please enter a name for this search.');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please sign in to save searches.');
      return;
    }

    setSaving(true);
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

    toast.success('Search saved!', { description: 'Visit Saved Searches to manage your alerts.' });
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
          {/* Search name input */}
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

          {/* Filter summary */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              Search Criteria Summary
            </label>

            {!hasAnyFilter ? (
              <p className="text-sm text-muted-foreground italic">No filters selected — this will save a broad search.</p>
            ) : (
              <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2 max-h-[200px] overflow-y-auto">
                {/* Type */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground w-20 shrink-0">Type:</span>
                  <Badge variant="secondary" className="text-xs capitalize">{searchType}</Badge>
                </div>

                {/* Location */}
                {locationParts.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-20 shrink-0">Location:</span>
                    <span className="text-xs text-foreground">{locationParts.join(' > ')}</span>
                  </div>
                )}

                {/* Keyword */}
                {keyword && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-20 shrink-0">Keyword:</span>
                    <span className="text-xs text-foreground">"{keyword}"</span>
                  </div>
                )}

                {/* Other filters */}
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
