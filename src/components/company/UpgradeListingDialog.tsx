import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowUpCircle } from "lucide-react";

interface UpgradeListingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  listingTitle: string;
  listingType: "property" | "project" | "event";
  companyId: string;
  currentClassification: string | null;
  onUpgraded: () => void;
}

interface UpgradeOption {
  key: string;
  label: string;
  classification: string;
  credits: number;
}

const UpgradeListingDialog = ({
  open, onOpenChange, listingId, listingTitle, listingType, companyId, currentClassification, onUpgraded
}: UpgradeListingDialogProps) => {
  const [options, setOptions] = useState<UpgradeOption[]>([]);
  const [selected, setSelected] = useState("");
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      const { data: settings } = await supabase.from("admin_settings").select("setting_key, setting_value")
        .in("setting_key", ["premium_1_month_credits", "premium_3_months_credits", "featured_1_month_credits", "featured_3_months_credits"]);

      const map: Record<string, number> = {};
      (settings || []).forEach(s => { map[s.setting_key] = parseInt(s.setting_value) || 0; });

      const opts: UpgradeOption[] = [
        { key: "premium_1", label: `Premium - 1 month - ${map.premium_1_month_credits || 20} Credits`, classification: "premium", credits: map.premium_1_month_credits || 20 },
        { key: "premium_3", label: `Premium - 3 months - ${map.premium_3_months_credits || 50} Credits`, classification: "premium", credits: map.premium_3_months_credits || 50 },
        { key: "featured_1", label: `Featured - 1 month - ${map.featured_1_month_credits || 10} Credits`, classification: "featured", credits: map.featured_1_month_credits || 10 },
        { key: "featured_3", label: `Featured - 3 months - ${map.featured_3_months_credits || 25} Credits`, classification: "featured", credits: map.featured_3_months_credits || 25 },
      ];
      setOptions(opts);

      const { data: company } = await supabase.from("companies").select("credit_balance").eq("id", companyId).maybeSingle();
      setBalance(company?.credit_balance || 0);
    };
    load();
    setSelected("");
  }, [open, companyId]);

  const handleUpgrade = async () => {
    const opt = options.find(o => o.key === selected);
    if (!opt) return;
    if (balance < opt.credits) {
      toast.error("Insufficient credits. Please top up your balance.");
      return;
    }
    setLoading(true);
    try {
      const tableName = listingType === "property" ? "properties" : listingType === "project" ? "projects" : "events";

      const { error: updateErr } = await supabase
        .from(tableName)
        .update({ property_classification: opt.classification } as any)
        .eq("id", listingId);
      if (updateErr) throw updateErr;

      const { error: creditErr } = await supabase
        .from("companies")
        .update({ credit_balance: balance - opt.credits })
        .eq("id", companyId);
      if (creditErr) throw creditErr;

      toast.success(`Listing upgraded to ${opt.classification.charAt(0).toUpperCase() + opt.classification.slice(1)}!`);
      onUpgraded();
      onOpenChange(false);
    } catch {
      toast.error("Upgrade failed");
    } finally {
      setLoading(false);
    }
  };

  const selectedOpt = options.find(o => o.key === selected);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <ArrowUpCircle className="h-5 w-5" /> Upgrade Listing
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground truncate">
            <span className="font-medium text-foreground">{listingTitle}</span>
          </p>
          {currentClassification && currentClassification !== "standard" && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
              Currently: {currentClassification.charAt(0).toUpperCase() + currentClassification.slice(1)}
            </p>
          )}
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Upgrade Type</label>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger><SelectValue placeholder="Select Upgrade Type" /></SelectTrigger>
              <SelectContent>
                {options.map(o => (
                  <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-3">
            <span className="text-muted-foreground">Your Credit Balance</span>
            <span className="font-bold text-foreground">{balance} Credits</span>
          </div>
          {selectedOpt && balance < selectedOpt.credits && (
            <p className="text-xs text-destructive">Not enough credits. Contact sales to top up.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleUpgrade} disabled={!selected || loading || (selectedOpt ? balance < selectedOpt.credits : true)}>
            {loading ? "Upgrading..." : "Confirm Upgrade"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeListingDialog;
