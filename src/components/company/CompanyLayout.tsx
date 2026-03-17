import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Building2, FolderKanban, Calendar, Users,
  UserCircle, Bell, Mail, LogOut, Menu, X, Users2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CompanyLayoutProps {
  children: React.ReactNode;
}

const sidebarLinks = [
  { label: "Dashboard", path: "/company", icon: LayoutDashboard },
  { label: "Properties Management", path: "/company/properties", icon: Building2 },
  { label: "Projects Management", path: "/company/projects", icon: FolderKanban },
  { label: "Events Management", path: "/company/events", icon: Calendar },
  { label: "Agents Management", path: "/company/agents", icon: Users },
  { label: "Profile Settings", path: "/company/profile", icon: UserCircle },
  { label: "Followers", path: "/company/followers", icon: Users2 },
  { label: "Inbox", path: "/company/inbox", icon: Mail },
  { label: "Notifications", path: "/company/notifications", icon: Bell },
];

const CompanyLayout = ({ children }: CompanyLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/company/login");
        return;
      }
      const { data: company } = await supabase
        .from("companies")
        .select("name")
        .eq("owner_user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (!company) {
        await supabase.auth.signOut();
        toast.error("No company associated with this account");
        navigate("/company/login");
        return;
      }
      setCompanyName(company.name);
    };
    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/company/login");
    toast.success("Logged out successfully");
  };

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-5 border-b border-border">
          <Link to="/" className="text-xl font-bold text-primary">turegu</Link>
          {companyName && (
            <p className="text-xs text-muted-foreground mt-1 truncate">{companyName}</p>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sidebarLinks.map((link) => {
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
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 w-full transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-card border-b border-border px-4 py-3 flex items-center gap-3 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="text-sm font-semibold text-foreground">Company Portal</span>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};

export default CompanyLayout;
