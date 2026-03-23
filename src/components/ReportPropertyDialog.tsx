import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const REPORT_REASONS = [
  "Property location is wrong",
  "Inaccurate property images",
  "Unauthorized use of images",
  "Property is not available",
  "Incorrect price or details",
  "Suspicious or fraudulent listing",
  "Other",
];

interface ReportPropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  propertyTitle: string;
}

const ReportPropertyDialog = ({ open, onOpenChange, propertyId, propertyTitle }: ReportPropertyDialogProps) => {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsSignedIn(!!session?.user);
      setUserId(session?.user?.id ?? null);
      if (session?.user?.email) setEmail(session.user.email);
    });
  }, [open]);

  const handleSubmit = async () => {
    if (!reason) { toast.error("Please select a reason."); return; }
    if (!isSignedIn) {
      if (!email.trim()) { toast.error("Email is required."); return; }
      if (!phone.trim()) { toast.error("Phone number is required."); return; }
    }

    setSubmitting(true);
    const { error } = await supabase.from("property_reports" as any).insert({
      property_id: propertyId,
      user_id: userId,
      reason,
      details: details.trim() || null,
      reporter_email: email.trim() || null,
      reporter_phone: phone.trim() || null,
    } as any);

    setSubmitting(false);

    if (error) {
      toast.error("Failed to submit report. Please try again.");
      return;
    }

    toast.success("Thank you for your report. We will review this listing.");
    setReason("");
    setDetails("");
    if (!isSignedIn) { setEmail(""); setPhone(""); }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-lg">Report this property</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Reason */}
          <div className="space-y-1.5">
            <Label>Select a problem</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a problem" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Details */}
          <div className="space-y-1.5">
            <Label>Additional details <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide more details about the issue..."
              rows={3}
              maxLength={1000}
            />
          </div>

          {/* Contact fields for guests */}
          {!isSignedIn && (
            <>
              <div className="space-y-1.5">
                <Label>Email <span className="text-destructive">*</span></Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Mobile number <span className="text-destructive">*</span></Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+90 555 123 4567"
                />
              </div>
            </>
          )}

          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            SEND REPORT
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportPropertyDialog;
