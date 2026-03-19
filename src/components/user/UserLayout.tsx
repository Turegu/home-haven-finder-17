import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Settings, UserCircle, Heart, Search, Layers, Bell,
  MessageSquare, FileText, Users2, LogOut, Menu, Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface UserLayoutProps {
  children: React.ReactNode;
}

const sidebarLinks = [
  { label: "Account Settings", path: "/account", icon: Settings, countKey: null },
  { label: "Followed Agents", path: "/account/followed-agents", icon: Users2, countKey: "followed" },
  { label: "Saved Properties", path: "/account/saved-properties", icon: Heart, countKey: "saved" },
  { label: "Saved Searches", path: "/account/saved-searches", icon: Search, countKey: "searches" },
  { label: "Compare List", path: "/account/compare", icon: Layers, countKey: "compare" },
  { label: "Notifications", path: "/account/notifications", icon: Bell, countKey: "notifications" },
  { label: "Contacted Properties", path: "/account/contacted", icon: MessageSquare, countKey: "contacted" },
  { label: "Property Requests", path: "/account/requests", icon: FileText, countKey: null },
];

const UserLayout = ({ children }: UserLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, first_name, last_name")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      setDisplayName(profile?.display_name || profile?.first_name || user.email || "User");

      // Fetch counts in parallel
      const [saved, searches, compare, followed, notifications, contacted] = await Promise.all([
        supabase.from("saved_properties").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("saved_searches").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("property_comparisons").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("agent_followers").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("user_notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false),
        supabase.from("user_inquiries").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);

      setCounts({
        saved: saved.count || 0,
        searches: searches.count || 0,
        compare: compare.count || 0,
        followed: followed.count || 0,
        notifications: notifications.count || 0,
        contacted: contacted.count || 0,
      });
    };
    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
    toast.success("Logged out successfully");
  };

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <Link to="/" className="text-xl font-bold text-primary">turegu</Link>
          </div>
          <p className="text-xs text-muted-foreground truncate mb-3">{displayName}</p>
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors group"
          >
            <Home className="h-4 w-4 group-hover:scale-110 transition-transform" />
            Back to Homepage
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sidebarLinks.map((link) => {
            const isActive = location.pathname === link.path;
            const count = link.countKey ? counts[link.countKey] || 0 : 0;
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
                <span className="flex-1">{link.label}</span>
                {link.countKey && count > 0 && (
                  <span className={`text-[10px] font-bold min-w-[20px] h-5 flex items-center justify-center rounded-full px-1.5 ${
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-primary/15 text-primary"
                  }`}>
                    {count}
                  </span>
                )}
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

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-card border-b border-border px-4 py-3 flex items-center gap-3 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="text-sm font-semibold text-foreground">My Account</span>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};

export default UserLayout;
