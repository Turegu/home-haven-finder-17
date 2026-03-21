import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Coins } from "lucide-react";

interface AddCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companyName: string;
  currentBalance: number;
  onUpdated: () => void;
}

const AddCreditsDialog = ({
  open, onOpenChange, companyId, companyName, currentBalance, onUpdated
}: AddCreditsDialogProps) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    const credits = parseInt(amount);
    if (!credits || credits <= 0) {
      toast.error("Please enter a valid number of credits");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from("companies")
        .update({ credit_balance: currentBalance + credits })
        .eq("id", companyId);
      if (error) throw error;

      toast.success(`${credits} credits added to ${companyName}`);
      setAmount("");
      onUpdated();
      onOpenChange(false);
    } catch {
      toast.error("Failed to add credits");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Coins className="h-5 w-5" /> Add Credits
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Company</p>
            <p className="font-semibold text-foreground">{companyName}</p>
          </div>

          <div className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-3">
            <span className="text-muted-foreground">Current Balance</span>
            <span className="font-bold text-foreground">{currentBalance} Credits</span>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Credits to Add</label>
            <Input
              type="number"
              min={1}
              placeholder="Enter number of credits"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {amount && parseInt(amount) > 0 && (
            <div className="flex items-center justify-between text-sm bg-primary/5 rounded-lg p-3">
              <span className="text-muted-foreground">New Balance</span>
              <span className="font-bold text-primary">{currentBalance + parseInt(amount)} Credits</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAdd} disabled={!amount || parseInt(amount) <= 0 || loading}>
            {loading ? "Adding..." : "Add Credits"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddCreditsDialog;
