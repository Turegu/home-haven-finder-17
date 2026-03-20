import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Building2, FolderKanban, Calendar,
  UserCircle, Bell, Mail, LogOut, Menu, Users2, Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

interface AgentLayoutProps {
  children: React.ReactNode;
}

const mainLinks = [
  { label: "Dashboard", path: "/agent", icon: LayoutDashboard },
  { label: "Properties", path: "/agent/properties", icon: Building2 },
  { label: "Projects", path: "/agent/projects", icon: FolderKanban },
  { label: "Events", path: "/agent/events", icon: Calendar },
  { label: "Followers", path: "/agent/followers", icon: Users2 },
  { label: "Notifications", path: "/agent/notifications", icon: Bell },
  { label: "Inbox", path: "/agent/inbox", icon: Mail },
];

const settingsLink = { label: "Profile Settings", path: "/agent/profile", icon: UserCircle };

const AgentLayout = ({ children }: AgentLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: agentData } = useQuery({
    queryKey: ['agent-layout-auth'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/agent/login");
        return null;
      }
      const { data: agent } = await supabase
        .from("agents")
        .select("name, avatar_url")
        .eq("user_id", session.user.id)
        .limit(1)
        .maybeSingle();
      if (!agent) {
        await supabase.auth.signOut();
        toast.error("No agent account found");
        navigate("/agent/login");
        return null;
      }
      return agent;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const agentName = agentData?.name || "";
  const agentAvatar = agentData?.avatar_url || null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/agent/login");
    toast.success("Logged out successfully");
  };

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
          <div className="flex items-center justify-between mb-3">
            <Link to="/agent" className="text-xl font-bold text-primary">turegu</Link>
            <Link to="/" className="text-muted-foreground hover:text-primary transition-colors" title="Go to Homepage">
              <Home className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {agentAvatar ? (
              <img src={agentAvatar} alt={agentName} className="h-9 w-9 rounded-lg object-cover border border-border" />
            ) : (
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                {agentName?.charAt(0) || "A"}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{agentName}</p>
              <p className="text-xs text-muted-foreground">Agent</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
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
