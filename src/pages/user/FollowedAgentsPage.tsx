import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import UserLayout from "@/components/user/UserLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserMinus, Users2, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

interface FollowedAgent {
  id: string;
  agent_id: string;
  created_at: string;
  agent: { id: string; name: string; avatar_url: string | null; designation: string | null; company_id: string; };
}

const PAGE_SIZE = 12;

const FollowedAgentsPage = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<FollowedAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("agent_followers")
        .select("id, agent_id, created_at, agents(id, name, avatar_url, designation, company_id)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }) as any;
      setItems((data || []).map((d: any) => ({ ...d, agent: d.agents })));
    } catch (err) {
      console.error("Failed to load followed agents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleUnfollow = async (id: string) => {
    const { error } = await supabase.from("agent_followers").delete().eq("id", id);
    if (error) { toast.error("Failed to unfollow"); return; }
    setItems(p => p.filter(i => i.id !== id));
    toast.success("Unfollowed agent");
  };

  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const paginatedItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <UserLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Followed Agents</h1>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                <Skeleton className="h-12 w-14 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <Users2 className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground">You are not following any agents yet.</p>
            <Link to="/agents"><Button variant="outline" className="mt-4">Browse Agents</Button></Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedItems.map(item => (
                <div key={item.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                  <img src={item.agent?.avatar_url || "/placeholder.svg"} alt="" className="h-12 w-14 rounded-lg object-cover border border-border" />
                  <div className="flex-1 min-w-0">
                    <Link to={`/agents/${item.agent_id}`} className="font-semibold text-foreground text-sm hover:text-primary truncate block">{item.agent?.name}</Link>
                    <p className="text-xs text-muted-foreground truncate">{item.agent?.designation || "Agent"}</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" title="Unfollow">
                        <UserMinus className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Unfollow {item.agent?.name}?</AlertDialogTitle>
                        <AlertDialogDescription>You will no longer receive updates from this agent.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleUnfollow(item.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Unfollow</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </UserLayout>
  );
};

export default FollowedAgentsPage;
