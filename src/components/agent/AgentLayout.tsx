import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Building2, FolderKanban, Calendar,
  UserCircle, Bell, Mail, LogOut, Menu, Users2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AgentLayoutProps {
  children: React.ReactNode;
}

const sidebarLinks = [
  { label: "Dashboard", path: "/agent", icon: LayoutDashboard },
  { label: "Properties", path: "/agent/properties", icon: Building2 },
  { label: "Projects", path: "/agent/projects", icon: FolderKanban },
  { label: "Events", path: "/agent/events", icon: Calendar },
  { label: "Profile Settings", path: "/agent/profile", icon: UserCircle },
  { label: "Followers", path: "/agent/followers", icon: Users2 },
  { label: "Notifications", path: "/agent/notifications", icon: Bell },
  { label: "Inbox", path: "/agent/inbox", icon: Mail },
];

const AgentLayout = ({ children }: AgentLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [agentName, setAgentName] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/agent/login");
        return;
      }
      const { data: agent } = await supabase
        .from("agents")
        .select("name")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      if (!agent) {
        await supabase.auth.signOut();
        toast.error("No agent account found");
        navigate("/agent/login");
        return;
      }
      setAgentName(agent.name);
    };
    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/agent/login");
    toast.success("Logged out successfully");
  };

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-5 border-b border-border">
          <Link to="/" className="text-xl font-bold text-primary">turegu</Link>
          {agentName && (
            <p className="text-xs text-muted-foreground mt-1 truncate">Agent: {agentName}</p>
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

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-card border-b border-border px-4 py-3 flex items-center gap-3 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="text-sm font-semibold text-foreground">Agent Portal</span>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};

export default AgentLayout;
