import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Building2, Home, FolderKanban, CalendarDays,
  Crown, ImageIcon, Landmark, BookOpen, HelpCircle, Languages,
  BarChart3, Settings, LogOut, ChevronDown, Menu, X, FileText, Coins, ListChecks, Mail, SlidersHorizontal, MapPin
} from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { label: "Companies Management", icon: Building2, path: "/admin/companies" },
  { label: "Properties Management", icon: Home, path: "/admin/properties" },
  { label: "Projects Management", icon: FolderKanban, path: "/admin/projects" },
  { label: "Events Management", icon: CalendarDays, path: "/admin/events" },
  { label: "Membership Management", icon: Crown, path: "/admin/memberships" },
  { label: "Banners Management", icon: ImageIcon, path: "/admin/banners" },
  { label: "Banks Management", icon: Landmark, path: "/admin/banks" },
  { label: "Blog Management", icon: BookOpen, path: "/admin/blog" },
  { label: "FAQs Management", icon: HelpCircle, path: "/admin/faqs" },
  { label: "Language Management", icon: Languages, path: "/admin/languages" },
  { label: "Currency Management", icon: Coins, path: "/admin/currencies" },
  { label: "Reports", icon: BarChart3, path: "/admin/reports" },
  { label: "CMS", icon: FileText, path: "/admin/cms" },
  { label: "CRUDs", icon: ListChecks, path: "/admin/cruds" },
  { label: "Filters", icon: SlidersHorizontal, path: "/admin/filters" },
  { label: "Email Templates", icon: Mail, path: "/admin/email-templates" },
  { label: "Settings", icon: Settings, path: "/admin/settings", hasSubmenu: true },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/admin/login");
        return;
      }
      setUserEmail(user.email || "");
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) navigate("/admin/login");
      else setUserEmail(session.user.email || "");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Mobile toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-card shadow-md"
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-60 bg-card border-r border-border flex flex-col transition-transform duration-200",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-border justify-between">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">T</span>
            </div>
            <span className="font-bold text-lg text-foreground">Admin Panel</span>
          </Link>
          <Link to="/" className="text-xs text-muted-foreground hover:text-primary transition-colors" title="Go to Homepage">
            <Home className="h-4 w-4" />
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {sidebarItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== "/admin" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
                {item.hasSubmenu && <ChevronDown className="h-3 w-3 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 lg:ml-60">
        {/* Top bar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-end px-6">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">{userEmail}</span>
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-semibold text-sm">
                {userEmail?.charAt(0)?.toUpperCase() || "A"}
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
