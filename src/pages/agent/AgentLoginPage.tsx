import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { LogIn, Eye, EyeOff, Lock, Building2, UserCheck } from "lucide-react";
import PatternLock from "@/components/admin/PatternLock";

type LoginMode = "agent" | "company";
type LoginStep = "credentials" | "pattern";
type PendingRedirect = "/agent" | "/company";

const AgentLoginPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<LoginMode>("agent");
  const [step, setStep] = useState<LoginStep>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [patternError, setPatternError] = useState(false);
  const [savedPattern, setSavedPattern] = useState("");
  const [pendingRedirect, setPendingRedirect] = useState<PendingRedirect>("/agent");

  const storageKey = mode === "agent" ? "turegu_agent_email" : "turegu_company_email";

  useEffect(() => {
    const remembered = localStorage.getItem(storageKey);
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    } else {
      if (!rememberMe) setEmail("");
    }
  }, [mode]);

  const handleAgentLogin = async (userId: string) => {
    const { data: agent, error: agentError } = await supabase
      .from("agents")
      .select("id, status, company_id, downgraded_at")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (agentError) throw agentError;
    if (!agent) {
      await supabase.auth.signOut();
      toast.error("No agent account found for this email.");
      return;
    }
    if (agent.status === "inactive" && agent.downgraded_at) {
      await supabase.auth.signOut();
      const deletionDate = new Date(new Date(agent.downgraded_at).getTime() + 90 * 24 * 60 * 60 * 1000);
      const formattedDate = deletionDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      toast.error(
        `Your agent account has been temporarily frozen because your company's plan was downgraded. Please contact your company to upgrade their plan and restore your account. If not restored by ${formattedDate}, your account will be permanently deleted.`,
        { duration: 15000 }
      );
      return;
    }
    if (agent.status !== "active") {
      await supabase.auth.signOut();
      toast.error("Your agent account is not active yet. Contact your company admin.");
      return;
    }

    // Check agent-specific pattern
    const { data: agentPatternData } = await supabase
      .from("agent_pattern_codes")
      .select("pattern_code, is_active")
      .eq("agent_id", agent.id)
      .limit(1)
      .maybeSingle();

    if (agentPatternData && agentPatternData.pattern_code && agentPatternData.is_active) {
      setSavedPattern(agentPatternData.pattern_code);
      setPendingRedirect("/agent");
      setStep("pattern");
      toast.info("Please draw your pattern to continue.");
      return;
    }

    toast.success("Welcome to your Agent Dashboard!");
    navigate("/agent");
  };

  const handleCompanyLogin = async (userId: string) => {
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id")
      .eq("owner_user_id", userId)
      .limit(1)
      .maybeSingle();

    if (companyError) throw companyError;
    if (!company) {
      await supabase.auth.signOut();
      toast.error("No company account found for this email.");
      return;
    }

    // Check company-specific pattern
    const { data: patternData } = await supabase
      .from("company_pattern_codes")
      .select("pattern_code, is_active")
      .eq("company_id", company.id)
      .limit(1)
      .maybeSingle();

    if (patternData && patternData.pattern_code && patternData.is_active) {
      setSavedPattern(patternData.pattern_code);
      setPendingRedirect("/company");
      setStep("pattern");
      toast.info("Please draw your company pattern to continue.");
      return;
    }

    // New companies have no pattern — skip pattern lock entirely.
    // They can set one later from their profile settings.

    toast.success("Welcome to your Company Dashboard!");
    navigate("/company");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (rememberMe) {
        localStorage.setItem(storageKey, email);
      } else {
        localStorage.removeItem(storageKey);
      }

      if (mode === "agent") {
        await handleAgentLogin(data.user.id);
      } else {
        await handleCompanyLogin(data.user.id);
      }
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePatternComplete = (pattern: number[]) => {
    const patternStr = pattern.join(",");
    if (patternStr === savedPattern) {
      setPatternError(false);
      const welcomeMsg = pendingRedirect === "/agent" ? "Welcome to your Agent Dashboard!" : "Welcome to your Company Dashboard!";
      toast.success(welcomeMsg);
      navigate(pendingRedirect);
    } else {
      setPatternError(true);
      toast.error("Wrong pattern. Try again.");
      setTimeout(() => setPatternError(false), 800);
    }
  };

  const handlePatternBack = async () => {
    await supabase.auth.signOut();
    setStep("credentials");
    setSavedPattern("");
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

  const switchMode = (newMode: LoginMode) => {
    setMode(newMode);
    setStep("credentials");
    setShowForgot(false);
    setSavedPattern("");
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4" dir="ltr">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-lg border border-border p-8">
          {/* Logo */}
          <div className="text-center mb-6">
            <Link to="/" className="text-2xl font-bold text-primary">turegu</Link>
          </div>

          {/* Mode toggle tabs */}
          {step === "credentials" && !showForgot && (
            <div className="flex rounded-lg bg-muted p-1 mb-6">
              <button
                type="button"
                onClick={() => switchMode("agent")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
                  mode === "agent"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <UserCheck className="h-4 w-4" />
                Agent
              </button>
              <button
                type="button"
                onClick={() => switchMode("company")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
                  mode === "company"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Building2 className="h-4 w-4" />
                Company
              </button>
            </div>
          )}

          {/* Header text */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-foreground">
              {showForgot
                ? "Reset Password"
                : step === "pattern"
                ? "Pattern Unlock"
                : mode === "agent"
                ? "Agent Login"
                : "Company Login"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {showForgot
                ? "Enter your email to receive a reset link"
                : step === "pattern"
                ? "Draw your company pattern to continue"
                : mode === "agent"
                ? "Sign in to your agent dashboard"
                : "Sign in to your company dashboard"}
            </p>
          </div>

          {/* Forgot password form */}
          {showForgot ? (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="forgot-email" className="text-foreground">Email Address</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="email@example.com"
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
              <button
                type="button"
                onClick={handlePatternBack}
                className="text-sm text-primary hover:underline w-full text-center block"
              >
                ← Back to login
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="bg-secondary/50 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                      Remember me
                    </Label>
                  </div>
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

              <div className="flex items-center justify-center mt-6">
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

export default AgentLoginPage;
