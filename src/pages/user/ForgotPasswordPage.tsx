import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const ForgotPasswordPage = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Password reset email sent!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-muted/30">
      <div className="w-full max-w-md space-y-6 bg-card p-8 rounded-xl border border-border">
        <div className="text-center">
          <Link to="/" className="text-3xl font-bold text-primary">turegu</Link>
          <h1 className="text-xl font-bold mt-4 text-foreground">Reset Password</h1>
          <p className="text-sm text-muted-foreground mt-1">Enter your email to receive a reset link</p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">Check your email for a password reset link.</p>
            <Link to="/login"><Button variant="outline" className="w-full">Back to Login</Button></Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
            <Link to="/login" className="block text-center text-sm text-primary hover:underline">Back to Login</Link>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
