import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import UserLayout from "@/components/user/UserLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Megaphone, ChevronLeft, ChevronRight, X, Calendar, Building2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface Announcement {
  id: string;
  title: string;
  message: string;
  announcement_type: string;
  created_at: string;
  company_id: string;
  company?: { name: string; logo_url: string | null } | null;
}

const PAGE_SIZE = 10;

const AnnouncementsPage = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Announcement | null>(null);

  const { data: authUser } = useQuery({
    queryKey: ['announcements-auth'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user || null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['user-announcements', authUser?.id],
    queryFn: async () => {
      // Get companies and agents the user follows
      const uid = authUser!.id;
      const [companyFollows, agentFollows] = await Promise.all([
        supabase.from("company_followers").select("company_id").eq("user_id", uid),
        supabase.from("agent_followers").select("agent_id, agents(company_id)").eq("user_id", uid),
      ]);

      const companyIds = new Set<string>();
      (companyFollows.data || []).forEach((f: any) => companyIds.add(f.company_id));
      (agentFollows.data || []).forEach((f: any) => {
        if (f.agents?.company_id) companyIds.add(f.agents.company_id);
      });

      if (companyIds.size === 0) return [];

      const { data } = await supabase
        .from("company_announcements")
        .select("id, title, message, announcement_type, created_at, company_id, companies(name, logo_url)")
        .in("company_id", Array.from(companyIds))
        .order("created_at", { ascending: false })
        .limit(100) as any;

      return (data || []).map((d: any) => ({ ...d, company: d.companies })) as Announcement[];
    },
    enabled: !!authUser?.id,
    staleTime: 2 * 60 * 1000,
  });

  const totalPages = Math.ceil(announcements.length / PAGE_SIZE);
  const paginated = announcements.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <UserLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">{t('userPages.announcements', 'Announcements')}</h1>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card rounded-xl border border-border p-5">
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <Megaphone className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground">{t('userPages.noAnnouncements', 'No announcements yet. Follow companies or agents to receive their updates.')}</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paginated.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelected(a)}
                  className="w-full text-start bg-card rounded-xl border border-border p-5 hover:border-primary/30 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Company avatar */}
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      {a.company?.logo_url ? (
                        <img src={a.company.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      ) : (
                        <Building2 className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full capitalize">
                          {a.announcement_type}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(a.created_at), "MMM dd, yyyy")}
                        </span>
                      </div>
                      <h3 className="font-semibold text-foreground text-sm mb-1 truncate">{a.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">{a.message}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1.5">
                        {a.company?.name || 'Unknown Company'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}

        {/* Email-style viewer dialog */}
        <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
          <DialogContent className="max-w-lg p-0 overflow-hidden">
            {selected && (
              <>
                {/* Email header */}
                <div className="bg-muted/30 border-b border-border px-6 pt-6 pb-4">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-bold text-foreground leading-tight">
                      {selected.title}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/80">From:</span>
                      <div className="flex items-center gap-1.5">
                        {selected.company?.logo_url ? (
                          <img src={selected.company.logo_url} alt="" className="h-4 w-4 rounded object-cover" />
                        ) : (
                          <Building2 className="h-3.5 w-3.5" />
                        )}
                        <span>{selected.company?.name || 'Unknown Company'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/80">Date:</span>
                      <span>{format(new Date(selected.created_at), "EEEE, MMMM dd, yyyy 'at' HH:mm")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/80">Type:</span>
                      <span className="capitalize bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] font-medium">
                        {selected.announcement_type}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Email body */}
                <div className="px-6 py-5">
                  <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap leading-relaxed text-sm">
                    {selected.message}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground">
                    This announcement was sent to followers of {selected.company?.name}
                  </p>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </UserLayout>
  );
};

export default AnnouncementsPage;
