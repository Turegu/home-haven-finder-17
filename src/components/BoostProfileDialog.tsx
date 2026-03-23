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
import { Rocket } from "lucide-react";

interface BoostProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  profileName: string;
  profileType: "company" | "agent";
  /** The entity whose balance is used (company_id for company boost, or agent's company_id when company boosts agent, or agent uses own balance) */
  balanceSource: "company" | "agent";
  balanceSourceId: string;
  currentClassification: string;
  boostEndDate: string | null;
  onBoosted: () => void;
}

interface BoostOption {
  key: string;
  label: string;
  months: number;
  credits: number;
}

const BoostProfileDialog = ({
  open, onOpenChange, profileId, profileName, profileType,
  balanceSource, balanceSourceId, currentClassification, boostEndDate, onBoosted
}: BoostProfileDialogProps) => {
  const [options, setOptions] = useState<BoostOption[]>([]);
  const [selected, setSelected] = useState("");
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const isBoosted = currentClassification === "boosted" && boostEndDate && new Date(boostEndDate) > new Date();

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      const prefix = profileType === "company" ? "boost_company" : "boost_agent";
      const { data: settings } = await supabase.from("admin_settings").select("setting_key, setting_value")
        .in("setting_key", [
          `${prefix}_3_months_credits`, `${prefix}_6_months_credits`, `${prefix}_12_months_credits`
        ]);

      const map: Record<string, number> = {};
      (settings || []).forEach(s => { map[s.setting_key] = parseInt(s.setting_value) || 0; });

      const opts: BoostOption[] = [
        { key: "3m", label: `3 Months — ${map[`${prefix}_3_months_credits`] || 20} Credits`, months: 3, credits: map[`${prefix}_3_months_credits`] || 20 },
        { key: "6m", label: `6 Months — ${map[`${prefix}_6_months_credits`] || 35} Credits`, months: 6, credits: map[`${prefix}_6_months_credits`] || 35 },
        { key: "12m", label: `12 Months — ${map[`${prefix}_12_months_credits`] || 60} Credits`, months: 12, credits: map[`${prefix}_12_months_credits`] || 60 },
      ];
      setOptions(opts);

      // Fetch balance
      if (balanceSource === "company") {
        const { data } = await supabase.from("companies").select("credit_balance").eq("id", balanceSourceId).maybeSingle();
        setBalance(data?.credit_balance || 0);
      } else {
        const { data } = await supabase.from("agents").select("credit_balance").eq("id", balanceSourceId).maybeSingle();
        setBalance(data?.credit_balance || 0);
      }
    };
    load();
    setSelected("");
  }, [open, balanceSourceId, balanceSource, profileType]);

  const handleBoost = async () => {
    const opt = options.find(o => o.key === selected);
    if (!opt) return;
    if (balance < opt.credits) {
      toast.error("Insufficient credits.");
      return;
    }
    setLoading(true);
    try {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + opt.months);

      const tableName = profileType === "company" ? "companies" : "agents";
      const { error: updateErr } = await supabase
        .from(tableName)
        .update({ profile_classification: "boosted", boost_end_date: endDate.toISOString() } as any)
        .eq("id", profileId);
      if (updateErr) throw updateErr;

      // Deduct balance
      if (balanceSource === "company") {
        const { error } = await supabase.from("companies").update({ credit_balance: balance - opt.credits }).eq("id", balanceSourceId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("agents").update({ credit_balance: balance - opt.credits }).eq("id", balanceSourceId);
        if (error) throw error;
      }

      // Log transaction
      await supabase.from("credit_transactions").insert({
        company_id: profileType === "company" ? profileId : balanceSourceId,
        agent_id: profileType === "agent" ? profileId : null,
        amount: -opt.credits,
        transaction_type: "spend",
        description: `Profile boost (${opt.months} months) — ${profileType}`,
        listing_type: profileType,
        listing_id: profileId,
      });

      toast.success(`${profileName} profile boosted for ${opt.months} months!`);
      onBoosted();
      onOpenChange(false);
    } catch {
      toast.error("Boost failed. Please try again.");
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
            <Rocket className="h-5 w-5" /> Boost {profileType === "company" ? "Company" : "Agent"} Profile
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{profileName}</span>
          </p>

          {isBoosted && (
            <div className="text-xs text-amber-700 bg-accent rounded px-3 py-2 border border-border">
              Currently boosted until {new Date(boostEndDate!).toLocaleDateString()}. Boosting again will extend from today.
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Duration</label>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger><SelectValue placeholder="Select boost duration" /></SelectTrigger>
              <SelectContent>
                {options.map(o => (
                  <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-3">
            <span className="text-muted-foreground">
              {balanceSource === "company" ? "Company" : "Agent"} Credit Balance
            </span>
            <span className="font-bold text-foreground">{balance} Credits</span>
          </div>

          {selectedOpt && balance < selectedOpt.credits && (
            <p className="text-xs text-destructive">Not enough credits.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleBoost} disabled={!selected || loading || (selectedOpt ? balance < selectedOpt.credits : true)}>
            <Rocket className="h-4 w-4 mr-1" />
            {loading ? "Boosting..." : "Confirm Boost"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BoostProfileDialog;
