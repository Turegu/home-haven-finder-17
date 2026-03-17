import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogIn, Lock, ArrowLeft } from "lucide-react";
import PatternLock from "@/components/admin/PatternLock";

type LoginStep = "pattern" | "credentials";

const CompanyLoginPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<LoginStep>("pattern");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [patternError, setPatternError] = useState(false);
  const [savedPattern, setSavedPattern] = useState<string>("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  useEffect(() => {
    // Fetch the company portal pattern from admin_settings
    const fetchPattern = async () => {
      const { data } = await supabase
        .from("admin_settings")
        .select("setting_value")
        .eq("setting_key", "company_pattern_code")
        .limit(1);
      if (data?.[0]) {
        setSavedPattern((data[0] as any).setting_value);
      } else {
        // Fallback: use admin pattern
        const { data: adminData } = await supabase
          .from("admin_settings")
          .select("setting_value")
          .eq("setting_key", "admin_pattern_code")
          .limit(1);
        if (adminData?.[0]) {
          setSavedPattern((adminData[0] as any).setting_value);
        }
      }
    };
    fetchPattern();
  }, []);

  const handlePatternComplete = (pattern: number[]) => {
    const patternStr = pattern.join(",");
    if (patternStr === savedPattern) {
      setPatternError(false);
      setStep("credentials");
      toast.success("Pattern accepted");
    } else {
      setPatternError(true);
      toast.error("Wrong pattern. Try again.");
      setTimeout(() => setPatternError(false), 800);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Check if user owns a company
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("id")
        .eq("owner_user_id", data.user.id)
        .limit(1)
        .maybeSingle();

      if (companyError) throw companyError;

      if (!company) {
        await supabase.auth.signOut();
        toast.error("No company account found for this email.");
        return;
      }

      toast.success("Welcome to your Company Dashboard!");
      navigate("/company");
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/company/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset link sent to your email!");
      setShowForgot(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-lg border border-border p-8">
          <div className="text-center mb-8">
            <Link to="/" className="text-2xl font-bold text-primary">turegu</Link>
            <h1 className="text-xl font-bold text-foreground mt-4">
              {showForgot ? "Reset Password" : step === "pattern" ? "Agents Portal" : "Company Login"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {showForgot
                ? "Enter your email to receive a reset link"
                : step === "pattern"
                ? "Draw the pattern to continue"
                : "Sign in to your company dashboard"}
            </p>
          </div>

          {showForgot ? (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="forgot-email" className="text-foreground">Email Address</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="company@example.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  className="bg-secondary/50"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
              <button
                type="button"
                onClick={() => setShowForgot(false)}
                className="text-sm text-primary hover:underline w-full text-center block mt-3"
              >
                ← Back to login
              </button>
            </form>
          ) : step === "pattern" ? (
            <div className="space-y-6">
              <PatternLock onPatternComplete={handlePatternComplete} error={patternError} />
              <p className="text-center text-xs text-muted-foreground">
                <Lock className="inline h-3 w-3 mr-1" />
                Connect at least 3 dots to unlock
              </p>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="company@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="bg-secondary/50"
                  />
                </div>

                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  <LogIn className="h-4 w-4 mr-2" />
                  {loading ? "Signing in..." : "Log in"}
                </Button>
              </form>

              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={() => setStep("pattern")}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back to pattern
                </button>
                <Link to="/" className="text-sm text-primary hover:underline">
                  Login as Buyer
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyLoginPage;
