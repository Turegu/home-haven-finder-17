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

interface UpgradeProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  profileName: string;
  profileType: "company" | "agent";
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

const UpgradeProfileDialog = ({
  open, onOpenChange, profileId, profileName, profileType, companyId, currentClassification, onUpgraded
}: UpgradeProfileDialogProps) => {
  const [options, setOptions] = useState<UpgradeOption[]>([]);
  const [selected, setSelected] = useState("");
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      const { data: settings } = await supabase.from("admin_settings").select("setting_key, setting_value")
        .in("setting_key", [
          "profile_premium_1_month_credits", "profile_premium_3_months_credits",
          "profile_featured_1_month_credits", "profile_featured_3_months_credits"
        ]);

      const map: Record<string, number> = {};
      (settings || []).forEach(s => { map[s.setting_key] = parseInt(s.setting_value) || 0; });

      const opts: UpgradeOption[] = [
        { key: "premium_1", label: `Premium - 1 month - ${map.profile_premium_1_month_credits || 30} Credits`, classification: "premium", credits: map.profile_premium_1_month_credits || 30 },
        { key: "premium_3", label: `Premium - 3 months - ${map.profile_premium_3_months_credits || 70} Credits`, classification: "premium", credits: map.profile_premium_3_months_credits || 70 },
        { key: "featured_1", label: `Featured - 1 month - ${map.profile_featured_1_month_credits || 15} Credits`, classification: "featured", credits: map.profile_featured_1_month_credits || 15 },
        { key: "featured_3", label: `Featured - 3 months - ${map.profile_featured_3_months_credits || 35} Credits`, classification: "featured", credits: map.profile_featured_3_months_credits || 35 },
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
      toast.error("Insufficient credits. Please top up the company's balance.");
      return;
    }
    setLoading(true);
    try {
      const tableName = profileType === "company" ? "companies" : "agents";

      const { error: updateErr } = await supabase
        .from(tableName)
        .update({ profile_classification: opt.classification } as any)
        .eq("id", profileId);
      if (updateErr) throw updateErr;

      const { error: creditErr } = await supabase
        .from("companies")
        .update({ credit_balance: balance - opt.credits })
        .eq("id", companyId);
      if (creditErr) throw creditErr;

      await supabase.from("credit_transactions").insert({
        company_id: companyId,
        amount: -opt.credits,
        transaction_type: "spend",
        description: `Profile upgrade to ${opt.classification} (${opt.key.includes("3") ? "3 months" : "1 month"}) - ${profileType}`,
        listing_type: profileType,
        listing_id: profileId,
      });

      toast.success(`${profileType === "company" ? "Company" : "Agent"} profile upgraded to ${opt.classification.charAt(0).toUpperCase() + opt.classification.slice(1)}!`);
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
            <ArrowUpCircle className="h-5 w-5" /> Upgrade {profileType === "company" ? "Company" : "Agent"} Profile
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground truncate">
            <span className="font-medium text-foreground">{profileName}</span>
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
            <span className="text-muted-foreground">Company Credit Balance</span>
            <span className="font-bold text-foreground">{balance} Credits</span>
          </div>
          {selectedOpt && balance < selectedOpt.credits && (
            <p className="text-xs text-destructive">Not enough credits. Top up the company's balance first.</p>
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

export default UpgradeProfileDialog;
