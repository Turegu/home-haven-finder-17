import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { LogIn, Lock, Eye, EyeOff } from "lucide-react";
import PatternLock from "@/components/admin/PatternLock";
import { useTranslation } from "react-i18next";

type LoginStep = "credentials" | "pattern";

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState<LoginStep>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [patternError, setPatternError] = useState(false);

  // Force English for admin login
  useEffect(() => {
    if (i18n.language !== 'en') i18n.changeLanguage('en');
  }, [i18n]);

  // Load remembered email
  useEffect(() => {
    const remembered = localStorage.getItem("turegu_admin_email");
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: roleData, error: roleError } = await supabase
        .rpc('has_role', { _user_id: data.user.id, _role: 'admin' });
      if (roleError) throw roleError;

      if (!roleData) {
        await supabase.auth.signOut();
        toast.error(t("admin.accessDenied"));
        return;
      }

      // Save or remove remembered email
      if (rememberMe) {
        localStorage.setItem("turegu_admin_email", email);
      } else {
        localStorage.removeItem("turegu_admin_email");
      }

      // Fetch admin pattern and active status
      const { data: patternSettings } = await supabase
        .from("admin_settings")
        .select("setting_key, setting_value")
        .in("setting_key", ["admin_pattern_code", "admin_pattern_active"]);

      const settingsMap: Record<string, string> = {};
      (patternSettings || []).forEach((s: any) => { settingsMap[s.setting_key] = s.setting_value; });

      const patternCode = settingsMap.admin_pattern_code || "";
      const patternIsActive = settingsMap.admin_pattern_active !== "false"; // default true if not set

      if (patternCode && patternIsActive) {
        setSavedPattern(patternCode);
        setStep("pattern");
        toast.info(t("admin.drawAdminPattern"));
      } else {
        toast.success(t("admin.welcomeBack"));
        navigate("/admin");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handlePatternComplete = (pattern: number[]) => {
    const patternStr = pattern.join(",");
    if (patternStr === savedPattern) {
      setPatternError(false);
      toast.success(t("admin.welcomeBack"));
      navigate("/admin");
    } else {
      setPatternError(true);
      toast.error(t("admin.wrongPattern"));
      setTimeout(() => setPatternError(false), 800);
    }
  };

  const handlePatternBack = async () => {
    await supabase.auth.signOut();
    setStep("credentials");
    setSavedPattern("");
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4" dir="ltr">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-lg border border-border p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-full bg-primary mx-auto mb-4 flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">T</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {step === "pattern" ? t("admin.patternUnlock") : t("admin.adminLogin")}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {step === "pattern"
                ? t("admin.drawPatternToContinue")
                : t("admin.signInToAdmin")}
            </p>
          </div>

          {step === "pattern" ? (
            <div className="space-y-6">
              <PatternLock
                onPatternComplete={handlePatternComplete}
                error={patternError}
              />
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
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">{t("admin.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-secondary/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">{t("auth.password")}</Label>
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

              <Button type="submit" className="w-full" disabled={loading}>
                <LogIn className="h-4 w-4 mr-2" />
                {loading ? t("admin.pleaseWait") : t("admin.signIn")}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
