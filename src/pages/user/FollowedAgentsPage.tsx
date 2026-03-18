import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import UserLayout from "@/components/user/UserLayout";
import { Button } from "@/components/ui/button";
import { UserMinus } from "lucide-react";
import { toast } from "sonner";

interface FollowedAgent {
  id: string;
  agent_id: string;
  created_at: string;
  agent: { id: string; name: string; avatar_url: string | null; designation: string | null; company_id: string; };
}

const FollowedAgentsPage = () => {
  const [items, setItems] = useState<FollowedAgent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("agent_followers")
      .select("id, agent_id, created_at, agents(id, name, avatar_url, designation, company_id)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }) as any;
    setItems((data || []).map((d: any) => ({ ...d, agent: d.agents })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleUnfollow = async (id: string) => {
    const { error } = await supabase.from("agent_followers").delete().eq("id", id);
    if (error) { toast.error("Failed to unfollow"); return; }
    setItems(p => p.filter(i => i.id !== id));
    toast.success("Unfollowed agent");
  };

  return (
    <UserLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Followed Agents</h1>
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : items.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <p className="text-muted-foreground">You are not following any agents yet.</p>
            <Link to="/agents"><Button variant="outline" className="mt-4">Browse Agents</Button></Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(item => (
              <div key={item.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                <img src={item.agent?.avatar_url || "/placeholder.svg"} alt="" className="h-12 w-12 rounded-full object-cover border border-border" />
                <div className="flex-1 min-w-0">
                  <Link to={`/agents/${item.agent_id}`} className="font-semibold text-foreground text-sm hover:text-primary truncate block">{item.agent?.name}</Link>
                  <p className="text-xs text-muted-foreground truncate">{item.agent?.designation || "Agent"}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleUnfollow(item.id)} title="Unfollow">
                  <UserMinus className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </UserLayout>
  );
};

export default FollowedAgentsPage;
