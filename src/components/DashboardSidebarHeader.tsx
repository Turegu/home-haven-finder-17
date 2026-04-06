import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Globe, Home, ChevronDown } from "lucide-react";
import { useLanguages } from "@/hooks/useAppData";

interface DashboardSidebarHeaderProps {
  brandPath: string;
}

const DashboardSidebarHeader = ({ brandPath }: DashboardSidebarHeaderProps) => {
  const { t, i18n } = useTranslation();
  const { data: dbLanguages = [] } = useLanguages();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const switchLanguage = async (code: string) => {
    await i18n.changeLanguage(code);
    document.documentElement.dir = code === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = code;
    localStorage.setItem("selectedLangCode", code);
    setLangOpen(false);
  };

  const currentLangName = dbLanguages.find((l) => l.code === i18n.language)?.name
    || (i18n.language === "ar" ? "العربية" : i18n.language === "fr" ? "Français" : "English");

  return (
    <div className="flex items-center justify-between">
      <Link to={brandPath} className="text-xl font-bold text-primary tracking-tight">
        turegu
      </Link>
      <div className="flex items-center gap-1.5">
        {/* Language dropdown */}
        <div ref={langRef} className="relative">
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <Globe className="h-3.5 w-3.5" />
            <span className="max-w-[60px] truncate">{currentLangName}</span>
            <ChevronDown className={`h-3 w-3 transition-transform ${langOpen ? "rotate-180" : ""}`} />
          </button>
          {langOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-border rounded-lg shadow-lg z-50 py-1 animate-in fade-in-0 zoom-in-95">
              {dbLanguages.length > 0 ? (
                dbLanguages.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => switchLanguage(lang.code)}
                    className={`w-full text-start px-3 py-1.5 text-sm hover:bg-muted transition-colors ${
                      i18n.language === lang.code ? "text-primary font-medium bg-primary/5" : "text-foreground"
                    }`}
                  >
                    {lang.name}
                  </button>
                ))
              ) : (
                <>
                  <button
                    onClick={() => switchLanguage("en")}
                    className={`w-full text-start px-3 py-1.5 text-sm hover:bg-muted transition-colors ${
                      i18n.language === "en" ? "text-primary font-medium bg-primary/5" : "text-foreground"
                    }`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => switchLanguage("ar")}
                    className={`w-full text-start px-3 py-1.5 text-sm hover:bg-muted transition-colors ${
                      i18n.language === "ar" ? "text-primary font-medium bg-primary/5" : "text-foreground"
                    }`}
                  >
                    العربية
                  </button>
                  <button
                    onClick={() => switchLanguage("fr")}
                    className={`w-full text-start px-3 py-1.5 text-sm hover:bg-muted transition-colors ${
                      i18n.language === "fr" ? "text-primary font-medium bg-primary/5" : "text-foreground"
                    }`}
                  >
                    Français
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Back to homepage */}
        <Link
          to="/"
          className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
          title={t("dashboard.backToHomepage")}
        >
          <Home className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default DashboardSidebarHeader;
