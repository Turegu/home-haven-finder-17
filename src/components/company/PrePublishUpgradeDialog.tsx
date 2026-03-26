import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Crown, Star, ArrowRight, Sparkles, Clock, FlaskConical } from "lucide-react";
import { useTestMode } from "@/hooks/useTestMode";

interface PrePublishUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  listingId: string | null;
  listingTitle: string;
  listingType: "property" | "project" | "event";
  onPublish: (classification?: string) => void;
}

interface UpgradeOption {
  key: string;
  label: string;
  duration: string;
  classification: string;
  credits: number;
  icon: typeof Crown;
  color: string;
  badgeColor: string;
}

const PrePublishUpgradeDialog = ({
  open, onOpenChange, companyId, listingId, listingTitle, listingType, onPublish
}: PrePublishUpgradeDialogProps) => {
  const [options, setOptions] = useState<UpgradeOption[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { isTestMode } = useTestMode();

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      const { data: settings } = await supabase.from("admin_settings").select("setting_key, setting_value")
        .in("setting_key", ["premium_1_month_credits", "premium_3_months_credits", "featured_1_month_credits", "featured_3_months_credits"]);

      const map: Record<string, number> = {};
      (settings || []).forEach(s => { map[s.setting_key] = parseInt(s.setting_value) || 0; });

      const dLabel = (m: number) => isTestMode ? `${m} minute${m !== 1 ? "s" : ""}` : `${m} month${m !== 1 ? "s" : ""}`;

      const opts: UpgradeOption[] = [
        { key: "featured_1", label: "Featured", duration: dLabel(1), classification: "featured", credits: map.featured_1_month_credits || 10, icon: Star, color: "text-teal-600", badgeColor: "bg-teal-50 border-teal-200" },
        { key: "featured_3", label: "Featured", duration: dLabel(3), classification: "featured", credits: map.featured_3_months_credits || 25, icon: Star, color: "text-teal-600", badgeColor: "bg-teal-50 border-teal-200" },
        { key: "premium_1", label: "Premium", duration: dLabel(1), classification: "premium", credits: map.premium_1_month_credits || 20, icon: Crown, color: "text-purple-600", badgeColor: "bg-purple-50 border-purple-200" },
        { key: "premium_3", label: "Premium", duration: dLabel(3), classification: "premium", credits: map.premium_3_months_credits || 50, icon: Crown, color: "text-purple-600", badgeColor: "bg-purple-50 border-purple-200" },
      ];
      setOptions(opts);

      const { data: company } = await supabase.from("companies").select("credit_balance").eq("id", companyId).maybeSingle();
      setBalance(company?.credit_balance || 0);
    };
    load();
    setSelected(null);
  }, [open, companyId, isTestMode]);

  const handleUpgradeAndPublish = async () => {
    const opt = options.find(o => o.key === selected);
    if (!opt) return;
    if (balance < opt.credits) {
      toast.error("Insufficient credits. Please top up your balance.");
      return;
    }
    setLoading(true);
    try {
      const { error: creditErr } = await supabase
        .from("companies")
        .update({ credit_balance: balance - opt.credits })
        .eq("id", companyId);
      if (creditErr) throw creditErr;

      if (listingId) {
        const tableName = listingType === "property" ? "properties" : listingType === "project" ? "projects" : "events";
        const { error: updateErr } = await supabase
          .from(tableName)
          .update({ property_classification: opt.classification })
          .eq("id", listingId);
        if (updateErr) throw updateErr;
      }

      toast.success(`Listing upgraded to ${opt.label}! Publishing...`);
      onPublish(opt.classification);
      onOpenChange(false);
    } catch {
      toast.error("Upgrade failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onPublish();
    onOpenChange(false);
  };

  const selectedOpt = selected ? options.find(o => o.key === selected) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <span className="text-foreground">Boost Your Listing</span>
              <p className="text-xs font-normal text-muted-foreground mt-0.5">Get more visibility with a Featured or Premium upgrade</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            Publishing: <span className="font-medium text-foreground">{listingTitle || "Untitled"}</span>
          </p>

          {isTestMode && (
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-orange-300 bg-orange-50 dark:bg-orange-950/20 p-2">
              <FlaskConical className="h-3.5 w-3.5 text-orange-500" />
              <span className="text-xs font-medium text-orange-700 dark:text-orange-400">
                Test Mode — durations in minutes
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {options.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selected === opt.key;
              const canAfford = balance >= opt.credits;
              return (
                <button
                  key={opt.key}
                  type="button"
                  disabled={!canAfford}
                  onClick={() => setSelected(isSelected ? null : opt.key)}
                  className={`relative text-left p-3 rounded-xl border-2 transition-all duration-200 ${
                    isSelected
                      ? `${opt.badgeColor} border-current ring-1 ring-current`
                      : canAfford
                        ? "border-border bg-card hover:border-muted-foreground/30 hover:bg-muted/30"
                        : "border-border bg-muted/20 opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className={`h-4 w-4 ${isSelected ? opt.color : "text-muted-foreground"}`} />
                    <span className={`text-sm font-semibold ${isSelected ? opt.color : "text-foreground"}`}>{opt.label}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {opt.duration}
                  </div>
                  <div className="mt-2 text-sm font-bold text-foreground">{opt.credits} Credits</div>
                  {!canAfford && (
                    <p className="text-[10px] text-destructive mt-1">Insufficient credits</p>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-3">
            <span className="text-muted-foreground">Your Credit Balance</span>
            <span className="font-bold text-foreground">{balance} Credits</span>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            onClick={handleSkip}
            disabled={loading}
          >
            Skip, I'll do it later
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
          <Button
            onClick={handleUpgradeAndPublish}
            disabled={!selected || loading || (selectedOpt ? balance < selectedOpt.credits : true)}
          >
            {loading ? "Processing..." : selectedOpt ? `Upgrade & Publish (${selectedOpt.credits} Credits)` : "Select an option"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PrePublishUpgradeDialog;
