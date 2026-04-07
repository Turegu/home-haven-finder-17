import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import UserLayout from "@/components/user/UserLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserMinus, Users2, ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface FollowedCompany {
  id: string;
  company_id: string;
  created_at: string;
  company: { id: string; name: string; logo_url: string | null; };
}

const PAGE_SIZE = 12;

const FollowedAgentsPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [agentPage, setAgentPage] = useState(1);
  const [companyPage, setCompanyPage] = useState(1);

  const { data: agents = [], isLoading: loadingAgents } = useQuery({
    queryKey: ['user-followed-agents'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return [];
      const { data } = await supabase
        .from("agent_followers")
        .select("id, agent_id, created_at, agents(id, name, avatar_url, designation, company_id)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return (data || []).map((d) => ({ ...d, agent: d.agents })).filter((d) => d.agent) as FollowedAgent[];
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const { data: companies = [], isLoading: loadingCompanies } = useQuery({
    queryKey: ['user-followed-companies'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return [];
      const { data } = await supabase
        .from("company_followers")
        .select("id, company_id, created_at, companies(id, name, logo_url)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      return (data || []).map((d) => ({ ...d, company: d.companies })).filter((d) => d.company) as FollowedCompany[];
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const handleUnfollowAgent = async (id: string) => {
    const { error } = await supabase.from("agent_followers").delete().eq("id", id);
    if (error) { toast.error(t('userPages.failedToUnfollow')); return; }
    queryClient.setQueryData<FollowedAgent[]>(['user-followed-agents'], old => (old ?? []).filter(i => i.id !== id));
    queryClient.invalidateQueries({ queryKey: ['user-layout-counts'] });
    toast.success(t('userPages.unfollowed'));
  };

  const handleUnfollowCompany = async (id: string) => {
    const { error } = await supabase.from("company_followers").delete().eq("id", id);
    if (error) { toast.error(t('userPages.failedToUnfollow')); return; }
    queryClient.setQueryData<FollowedCompany[]>(['user-followed-companies'], old => (old ?? []).filter(i => i.id !== id));
    toast.success(t('userPages.unfollowed'));
  };

  const agentTotalPages = Math.ceil(agents.length / PAGE_SIZE);
  const paginatedAgents = agents.slice((agentPage - 1) * PAGE_SIZE, agentPage * PAGE_SIZE);
  const companyTotalPages = Math.ceil(companies.length / PAGE_SIZE);
  const paginatedCompanies = companies.slice((companyPage - 1) * PAGE_SIZE, companyPage * PAGE_SIZE);

  const renderSkeleton = () => (
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
  );

  const renderPagination = (currentPage: number, totalPages: number, setPage: (fn: (p: number) => number) => void) => (
    totalPages > 1 ? (
      <div className="flex items-center justify-center gap-2 pt-4">
        <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage(p => p - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground">{t('userPages.page')} {currentPage} {t('common.of')} {totalPages}</span>
        <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage(p => p + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    ) : null
  );

  return (
    <UserLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">{t('userPages.followedAgents')}</h1>

        <Tabs defaultValue="agents">
          <TabsList>
            <TabsTrigger value="agents" className="gap-1.5">
              <Users2 className="h-4 w-4" />
              {t('common.agents')} ({agents.length})
            </TabsTrigger>
            <TabsTrigger value="companies" className="gap-1.5">
              <Building2 className="h-4 w-4" />
              {t('common.companies')} ({companies.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="agents" className="mt-4">
            {loadingAgents ? renderSkeleton() : agents.length === 0 ? (
              <div className="bg-card rounded-xl border border-border p-8 text-center">
                <Users2 className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground">{t('userPages.noFollowedAgents')}</p>
                <Link to="/agents"><Button variant="outline" className="mt-4">{t('userPages.browseAgents')}</Button></Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedAgents.map(item => (
                    <div key={item.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                      <img src={item.agent?.avatar_url || "/placeholder.svg"} alt={item.agent?.name || "Agent"} className="h-12 w-14 rounded-lg object-cover border border-border" />
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
                            <AlertDialogTitle>{t('userPages.unfollowAgent', { name: item.agent?.name })}</AlertDialogTitle>
                            <AlertDialogDescription>{t('userPages.unfollowConfirm')}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleUnfollowAgent(item.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t('userPages.unfollow')}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
                {renderPagination(agentPage, agentTotalPages, setAgentPage)}
              </>
            )}
          </TabsContent>

          <TabsContent value="companies" className="mt-4">
            {loadingCompanies ? renderSkeleton() : companies.length === 0 ? (
              <div className="bg-card rounded-xl border border-border p-8 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground">{t('userPages.noFollowedCompanies')}</p>
                <Link to="/agents?tab=companies"><Button variant="outline" className="mt-4">{t('userPages.browseCompanies')}</Button></Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedCompanies.map(item => (
                    <div key={item.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                      <img src={item.company?.logo_url || "/placeholder.svg"} alt={item.company?.name || "Company"} className="h-12 w-14 rounded-lg object-cover border border-border" />
                      <div className="flex-1 min-w-0">
                        <Link to={`/companies/${item.company_id}`} className="font-semibold text-foreground text-sm hover:text-primary truncate block">{item.company?.name}</Link>
                        <p className="text-xs text-muted-foreground">{t('common.company')}</p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" title="Unfollow">
                            <UserMinus className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('userPages.unfollowCompany', { name: item.company?.name })}</AlertDialogTitle>
                            <AlertDialogDescription>{t('userPages.unfollowConfirm')}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleUnfollowCompany(item.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t('userPages.unfollow')}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
                {renderPagination(companyPage, companyTotalPages, setCompanyPage)}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </UserLayout>
  );
};

export default FollowedAgentsPage;
