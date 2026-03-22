import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowUpCircle, FlaskConical } from "lucide-react";
import { addMonths, addMinutes, format } from "date-fns";

interface UpgradeMembershipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companyName: string;
  currentMembership: string;
  packageEndDate: string | null;
  onUpgraded: () => void;
}

type MembershipPackage = {
  id: string;
  package_type: string;
  name: string;
  monthly_price: number;
  quarterly_price: number;
  semiannual_price: number;
  annual_price: number;
};

const DURATIONS = [
  { key: "1", label: "1 Month", months: 1 },
  { key: "3", label: "3 Months", months: 3 },
  { key: "6", label: "6 Months", months: 6 },
  { key: "12", label: "12 Months", months: 12 },
];

const UpgradeMembershipDialog = ({
  open, onOpenChange, companyId, companyName, currentMembership, packageEndDate, onUpgraded
}: UpgradeMembershipDialogProps) => {
  const [packages, setPackages] = useState<MembershipPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");
  const [loading, setLoading] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [testMinutes, setTestMinutes] = useState(5);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      const { data } = await supabase
        .from("membership_packages")
        .select("id, package_type, name, monthly_price, quarterly_price, semiannual_price, annual_price")
        .order("sort_order");
      setPackages(data || []);
    };
    load();
    setSelectedPackage("");
    setSelectedDuration("");
    setTestMode(false);
    setTestMinutes(5);
  }, [open]);

  const getPrice = () => {
    const pkg = packages.find(p => p.package_type === selectedPackage);
    if (!pkg || (!selectedDuration && !testMode)) return null;
    if (testMode) return 0;
    switch (selectedDuration) {
      case "1": return pkg.monthly_price;
      case "3": return pkg.quarterly_price;
      case "6": return pkg.semiannual_price;
      case "12": return pkg.annual_price;
      default: return null;
    }
  };

  const isToBasic = selectedPackage === "basic";

  const handleChange = async () => {
    if (!selectedPackage) return;
    if (!isToBasic && !testMode && !selectedDuration) return;
    if (testMode && testMinutes < 1) return;

    setLoading(true);
    try {
      let newEndDate: string | null;

      if (isToBasic) {
        newEndDate = null;
      } else if (testMode) {
        newEndDate = addMinutes(new Date(), testMinutes).toISOString();
      } else {
        const months = DURATIONS.find(d => d.key === selectedDuration)!.months;
        newEndDate = addMonths(new Date(), months).toISOString();
      }

      const { error } = await supabase
        .from("companies")
        .update({
          membership: selectedPackage as any,
          package_end_date: newEndDate,
        })
        .eq("id", companyId);

      if (error) throw error;

      const durationLabel = isToBasic
        ? "(downgraded)"
        : testMode
          ? `${testMinutes} minute(s) (test)`
          : `${DURATIONS.find(d => d.key === selectedDuration)!.months} month(s)`;

      toast.success(`${companyName} changed to ${selectedPackage} ${durationLabel}`);
      onUpgraded();
      onOpenChange(false);
    } catch {
      toast.error("Failed to change membership");
    } finally {
      setLoading(false);
    }
  };

  const price = getPrice();
  const canSubmit = selectedPackage && (isToBasic || testMode ? testMinutes >= 1 : !!selectedDuration);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <ArrowUpCircle className="h-5 w-5" /> Change Membership
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Company</p>
            <p className="font-semibold text-foreground">{companyName}</p>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <p className="text-sm text-muted-foreground">Current Membership</p>
            <p className="text-lg font-bold text-foreground capitalize">{currentMembership}</p>
            {packageEndDate && (
              <p className="text-xs text-muted-foreground">
                Valid till {format(new Date(packageEndDate), "do MMM yyyy")}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-primary mb-1 block">Change To</label>
            <Select value={selectedPackage} onValueChange={setSelectedPackage}>
              <SelectTrigger><SelectValue placeholder="Select Package" /></SelectTrigger>
              <SelectContent>
                {packages.filter(p => p.package_type !== currentMembership).map(p => (
                  <SelectItem key={p.package_type} value={p.package_type}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isToBasic && (
            <>
              {/* Test Mode Toggle */}
              <div className="flex items-center justify-between rounded-lg border border-dashed border-orange-300 bg-orange-50 dark:bg-orange-950/20 p-3">
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-orange-500" />
                  <Label htmlFor="test-mode" className="text-sm font-medium text-orange-700 dark:text-orange-400">
                    Test Mode (Minutes)
                  </Label>
                </div>
                <Switch
                  id="test-mode"
                  checked={testMode}
                  onCheckedChange={setTestMode}
                />
              </div>

              {testMode ? (
                <div>
                  <label className="text-sm font-medium text-orange-600 mb-1 block">Duration in Minutes</label>
                  <Input
                    type="number"
                    min={1}
                    max={1440}
                    value={testMinutes}
                    onChange={(e) => setTestMinutes(Number(e.target.value))}
                    className="border-orange-300"
                    placeholder="Enter minutes"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Expires at: {format(addMinutes(new Date(), testMinutes), "hh:mm a, dd MMM yyyy")}
                  </p>
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium text-primary mb-1 block">Duration</label>
                  <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                    <SelectTrigger><SelectValue placeholder="Select Duration" /></SelectTrigger>
                    <SelectContent>
                      {DURATIONS.map(d => (
                        <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {price !== null && (
                <div className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-3">
                  <span className="text-muted-foreground">Package Price</span>
                  <span className="font-bold text-foreground">
                    {testMode ? "Free (Test)" : `$${price}`}
                  </span>
                </div>
              )}
            </>
          )}

          {isToBasic && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
              <p className="text-sm text-destructive font-medium">
                ⚠️ Downgrading to Basic will remove the expiry date. Active listings may be deactivated if they exceed Basic limits.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleUpgrade} disabled={!canSubmit || loading}>
            {loading ? "Upgrading..." : testMode ? "Upgrade (Test)" : "Upgrade Package"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeMembershipDialog;