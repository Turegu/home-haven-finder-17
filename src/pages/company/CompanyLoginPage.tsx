import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { LogIn, Eye, EyeOff, Lock, Building2, UserCheck, Globe } from "lucide-react";
import PatternLock from "@/components/admin/PatternLock";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const LANG_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
  { code: 'fr', label: 'Français' },
];

type LoginMode = "agent" | "company";
type LoginStep = "credentials" | "pattern";
type PendingRedirect = "/agent" | "/company";

const CompanyLoginPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState<LoginMode>("company");
  const [step, setStep] = useState<LoginStep>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [patternError, setPatternError] = useState(false);
  const [pendingEntityId, setPendingEntityId] = useState("");
  const [pendingEntityType, setPendingEntityType] = useState<"agent" | "company">("company");
  const [pendingRedirect, setPendingRedirect] = useState<PendingRedirect>("/company");

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
      .select("id, status, company_id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (agentError) throw agentError;
    if (!agent) {
      await supabase.auth.signOut();
      toast.error(t("professionalLogin.noAgentAccount"));
      return;
    }
    if (agent.status !== "active") {
      await supabase.auth.signOut();
      toast.error(t("professionalLogin.agentNotActive"));
      return;
    }

    // Check if agent has active pattern (without exposing code)
    const { data: agentPatternData } = await supabase
      .from("agent_pattern_codes")
      .select("is_active")
      .eq("agent_id", agent.id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (agentPatternData) {
      setPendingEntityId(agent.id);
      setPendingEntityType("agent");
      setPendingRedirect("/agent");
      setStep("pattern");
      toast.info(t("professionalLogin.patternInfo"));
      return;
    }

    toast.success(t("professionalLogin.welcomeAgent"));
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
      toast.error(t("professionalLogin.noCompanyAccount"));
      return;
    }

    // Check if company has active pattern (without exposing code)
    const { data: patternData } = await supabase
      .from("company_pattern_codes")
      .select("is_active")
      .eq("company_id", company.id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (patternData) {
      setPendingEntityId(company.id);
      setPendingEntityType("company");
      setPendingRedirect("/company");
      setStep("pattern");
      toast.info(t("professionalLogin.companyPatternInfo"));
      return;
    }

    toast.success(t("professionalLogin.welcomeCompany"));
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
      toast.error(err.message || t("professionalLogin.loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handlePatternComplete = (pattern: number[]) => {
    const patternStr = pattern.join(",");
    if (patternStr === savedPattern) {
      setPatternError(false);
      const welcomeMsg = pendingRedirect === "/agent" ? t("professionalLogin.welcomeAgent") : t("professionalLogin.welcomeCompany");
      toast.success(welcomeMsg);
      navigate(pendingRedirect);
    } else {
      setPatternError(true);
      toast.error(t("professionalLogin.wrongPattern"));
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
      toast.success(t("professionalLogin.resetLinkSent"));
      setShowForgot(false);
    } catch (err: any) {
      toast.error(err.message || t("professionalLogin.loginFailed"));
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
          <div className="text-center mb-6">
            <Link to="/" className="text-2xl font-bold text-primary">turegu</Link>
          </div>

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
                {t("professionalLogin.agent")}
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
                {t("professionalLogin.company")}
              </button>
            </div>
          )}

          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-foreground">
              {showForgot
                ? t("professionalLogin.resetPassword")
                : step === "pattern"
                ? t("professionalLogin.patternUnlock")
                : mode === "agent"
                ? t("professionalLogin.agentLogin")
                : t("professionalLogin.companyLogin")}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {showForgot
                ? t("professionalLogin.enterEmailReset")
                : step === "pattern"
                ? t("professionalLogin.drawPattern")
                : mode === "agent"
                ? t("professionalLogin.signInAgent")
                : t("professionalLogin.signInCompany")}
            </p>
          </div>

          {showForgot ? (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="forgot-email" className="text-foreground">{t("professionalLogin.emailAddress")}</Label>
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
                {loading ? t("professionalLogin.sending") : t("professionalLogin.sendResetLink")}
              </Button>
              <button
                type="button"
                onClick={() => setShowForgot(false)}
                className="text-sm text-primary hover:underline w-full text-center block mt-3"
              >
                {t("professionalLogin.backToLogin")}
              </button>
            </form>
          ) : step === "pattern" ? (
            <div className="space-y-6">
              <PatternLock onPatternComplete={handlePatternComplete} error={patternError} />
              <p className="text-center text-xs text-muted-foreground">
                <Lock className="inline h-3 w-3 mr-1" />
                {t("professionalLogin.connectDots")}
              </p>
              <button
                type="button"
                onClick={handlePatternBack}
                className="text-sm text-primary hover:underline w-full text-center block"
              >
                {t("professionalLogin.backToLogin")}
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">{t("professionalLogin.emailAddress")}</Label>
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
                  <Label htmlFor="password" className="text-foreground">{t("professionalLogin.password")}</Label>
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
                      {t("professionalLogin.rememberMe")}
                    </Label>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-sm text-primary hover:underline"
                  >
                    {t("professionalLogin.forgotPassword")}
                  </button>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  <LogIn className="h-4 w-4 mr-2" />
                  {loading ? t("professionalLogin.signingIn") : t("professionalLogin.logIn")}
                </Button>
              </form>

              <div className="flex items-center justify-center gap-4 mt-6">
                <Link to="/" className="text-sm text-primary hover:underline">
                  {t("professionalLogin.loginAsBuyer")}
                </Link>
                <div className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  <Select value={i18n.language} onValueChange={(v) => i18n.changeLanguage(v)}>
                    <SelectTrigger className="h-7 w-[110px] text-xs border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANG_OPTIONS.map((l) => (
                        <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyLoginPage;
