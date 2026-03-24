import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, X } from "lucide-react";
import { toast } from "sonner";
import Index from "@/pages/Index";

const UserLoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("user_remember_email");
    if (saved) { setEmail(saved); setRememberMe(true); }
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) navigate("/account");
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (rememberMe) localStorage.setItem("user_remember_email", email);
      else localStorage.removeItem("user_remember_email");
      toast.success("Welcome back!");
      navigate("/account");
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) toast.error("Google sign-in failed");
  };

  const handleClose = () => navigate(-1);

  return (
    <div className="relative">
      {/* Homepage behind */}
      <div className="pointer-events-none" aria-hidden="true">
        <Index />
      </div>

      {/* Overlay */}
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={handleClose}>
        <div
          className="relative bg-background rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4 animate-in fade-in-0 zoom-in-95"
          onClick={e => e.stopPropagation()}
        >
          {/* Close button */}
          <button onClick={handleClose} className="absolute top-3 end-3 text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="text-center pt-1">
            <Link to="/" className="text-2xl font-bold text-primary">turegu</Link>
            <p className="text-muted-foreground mt-1 text-xs">Turkey's Real Estate Guide</p>
          </div>

          {/* Google */}
          <Button variant="outline" className="w-full gap-2 h-10" onClick={handleGoogleLogin}>
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">{t('common.or')}</span></div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">{t('auth.email')}</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('auth.email')} required className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs">{t('auth.password')}</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder={t('auth.password')} required className="h-9 text-sm" />
                <button type="button" className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="rounded border-border" />
                <span className="text-muted-foreground">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-primary hover:underline">{t('auth.forgotPassword')}</Link>
            </div>

            <Button type="submit" className="w-full h-9 text-sm" disabled={loading}>
              {loading ? `${t('common.loading')}` : t('auth.signIn')}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            {t('auth.dontHaveAccount')} <Link to="/register" className="text-primary hover:underline font-medium">{t('auth.signUp')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserLoginPage;
