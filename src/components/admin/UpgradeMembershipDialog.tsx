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
import { addMonths, format } from "date-fns";

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
  }, [open]);

  const getPrice = () => {
    const pkg = packages.find(p => p.package_type === selectedPackage);
    if (!pkg || !selectedDuration) return null;
    switch (selectedDuration) {
      case "1": return pkg.monthly_price;
      case "3": return pkg.quarterly_price;
      case "6": return pkg.semiannual_price;
      case "12": return pkg.annual_price;
      default: return null;
    }
  };

  const handleUpgrade = async () => {
    if (!selectedPackage || !selectedDuration) return;
    setLoading(true);
    try {
      const months = DURATIONS.find(d => d.key === selectedDuration)!.months;
      const newEndDate = addMonths(new Date(), months).toISOString();

      const { error } = await supabase
        .from("companies")
        .update({
          membership: selectedPackage as any,
          package_end_date: newEndDate,
        })
        .eq("id", companyId);

      if (error) throw error;

      toast.success(`${companyName} upgraded to ${selectedPackage} for ${months} month(s)`);
      onUpgraded();
      onOpenChange(false);
    } catch {
      toast.error("Failed to upgrade membership");
    } finally {
      setLoading(false);
    }
  };

  const price = getPrice();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <ArrowUpCircle className="h-5 w-5" /> Upgrade Membership
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
            <label className="text-sm font-medium text-primary mb-1 block">Upgrade To</label>
            <Select value={selectedPackage} onValueChange={setSelectedPackage}>
              <SelectTrigger><SelectValue placeholder="Select Package" /></SelectTrigger>
              <SelectContent>
                {packages.map(p => (
                  <SelectItem key={p.package_type} value={p.package_type}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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

          {price !== null && (
            <div className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-3">
              <span className="text-muted-foreground">Package Price</span>
              <span className="font-bold text-foreground">${price}</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleUpgrade} disabled={!selectedPackage || !selectedDuration || loading}>
            {loading ? "Upgrading..." : "Upgrade Package"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeMembershipDialog;
