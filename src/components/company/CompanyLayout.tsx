import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Building2, FolderKanban, Calendar, Users,
  UserCircle, Bell, Mail, LogOut, Menu, Users2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import DashboardSidebarHeader from "@/components/DashboardSidebarHeader";

interface CompanyLayoutProps {
  children: React.ReactNode;
}

const CompanyLayout = ({ children }: CompanyLayoutProps) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const mainLinks = [
    { label: t("companyDashboard.dashboard"), path: "/company", icon: LayoutDashboard },
    { label: t("companyDashboard.propertiesManagement"), path: "/company/properties", icon: Building2 },
    { label: t("companyDashboard.projectsManagement"), path: "/company/projects", icon: FolderKanban },
    { label: t("companyDashboard.eventsManagement"), path: "/company/events", icon: Calendar },
    { label: t("companyDashboard.agentsManagement"), path: "/company/agents", icon: Users },
    { label: t("companyDashboard.followers"), path: "/company/followers", icon: Users2 },
    { label: t("companyDashboard.inbox"), path: "/company/inbox", icon: Mail },
    { label: t("companyDashboard.notifications"), path: "/company/notifications", icon: Bell },
  ];

  const settingsLink = { label: t("companyDashboard.profileSettings"), path: "/company/profile", icon: UserCircle };

  const { data: companyData } = useQuery({
    queryKey: ['company-layout-auth'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/company/login");
        return null;
      }
      const { data: company } = await supabase
        .from("companies")
        .select("name, logo_url")
        .eq("owner_user_id", session.user.id)
        .limit(1)
        .maybeSingle();
      if (!company) {
        await supabase.auth.signOut();
        toast.error(t("companyDashboard.noCompanyFound"));
        navigate("/company/login");
        return null;
      }
      return company;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const companyName = companyData?.name || "";
  const companyLogo = companyData?.logo_url || null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/company/login");
    toast.success(t("companyDashboard.logout"));
  };

  // Language toggle removed - now handled by DashboardSidebarHeader

  const renderLink = (link: typeof settingsLink) => {
    const isActive = location.pathname === link.path;
    return (
      <Link
        key={link.path}
        to={link.path}
        onClick={() => setSidebarOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        <link.icon className="h-4 w-4 shrink-0" />
        {link.label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-4 border-b border-border">
          <div className="mb-3">
            <DashboardSidebarHeader brandPath="/company" />
          </div>
          <div className="flex items-center gap-3">
            {companyLogo ? (
              <img src={companyLogo} alt={companyName} className="h-9 w-auto max-w-[60px] rounded-lg object-contain" />
            ) : (
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                {companyName?.charAt(0) || "C"}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{companyName}</p>
              <p className="text-xs text-muted-foreground">{t("companyDashboard.company")}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 min-h-0 p-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/30">
          {mainLinks.map(renderLink)}
          <Separator className="my-2" />
          {renderLink(settingsLink)}
        </nav>

        <div className="p-3 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 w-full transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {t("companyDashboard.logout")}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-card border-b border-border px-4 py-3 flex items-center gap-3 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="text-sm font-semibold text-foreground">{t("companyDashboard.portal")}</span>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};

export default CompanyLayout;