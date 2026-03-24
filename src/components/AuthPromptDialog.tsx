import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import {
  Search, Eye, Heart, TrendingUp, UserPlus, Bot, BarChart3, Image as ImageIcon
} from "lucide-react";

interface AuthPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AuthPromptDialog = ({ open, onOpenChange }: AuthPromptDialogProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const features = [
    { icon: Search, labelKey: "authPrompt.features.searchAll" },
    { icon: Eye, labelKey: "authPrompt.features.viewFull" },
    { icon: Heart, labelKey: "authPrompt.features.saveCompare" },
    { icon: TrendingUp, labelKey: "authPrompt.features.marketTrends" },
    { icon: UserPlus, labelKey: "authPrompt.features.followAgents" },
    { icon: Bot, labelKey: "authPrompt.features.aiSearch" },
    { icon: BarChart3, labelKey: "authPrompt.features.aiAnalysis" },
    { icon: ImageIcon, labelKey: "authPrompt.features.galleryTools" },
  ];

  const handleGoogleSignIn = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) toast.error(t("authPrompt.googleFailed"));
  };

  const goLogin = () => {
    onOpenChange(false);
    navigate("/login");
  };

  const goRegister = () => {
    onOpenChange(false);
    navigate("/register");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="bg-primary px-6 py-5 text-primary-foreground">
          <h2 className="text-xl font-bold">{t("authPrompt.title")}</h2>
          <p className="text-sm opacity-90 mt-1">{t("authPrompt.subtitle")}</p>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Feature grid */}
          <div className="grid grid-cols-2 gap-3">
            {features.map((f, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <f.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs text-foreground leading-tight pt-1.5">
                  {t(f.labelKey)}
                </span>
              </div>
            ))}
          </div>

          {/* Google sign-in */}
          <Button variant="outline" className="w-full gap-2" onClick={handleGoogleSignIn}>
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {t("authPrompt.continueGoogle")}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">{t("common.or")}</span>
            </div>
          </div>

          {/* Login / Register buttons */}
          <div className="flex gap-3">
            <Button className="flex-1" onClick={goLogin}>
              {t("auth.signIn")}
            </Button>
            <Button variant="outline" className="flex-1" onClick={goRegister}>
              {t("auth.createAccount")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthPromptDialog;
