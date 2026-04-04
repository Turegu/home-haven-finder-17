import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AnnouncementHistory from "@/components/AnnouncementHistory";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { turkishIncludes } from "@/lib/utils";
import AgentLayout from "@/components/agent/AgentLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Megaphone, Send, Users } from "lucide-react";

interface Follower {
  id: string;
  user_id: string;
  created_at: string;
  profile?: { display_name: string | null; phone: string | null; show_phone: boolean; user_id: string };
  email?: string;
}

const AgentFollowersPage = () => {
  const { t } = useTranslation();
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [announcementType, setAnnouncementType] = useState("general");
  const [sending, setSending] = useState(false);
  const [events, setEvents] = useState<{ id: string; title: string }[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");

  const { isLoading: queryLoading, isError: queryError } = useQuery({
    queryKey: ['agent', 'followers-init'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data: agent } = await supabase.from("agents").select("company_id").eq("user_id", user.id).limit(1).maybeSingle();
      if (!agent) return null;
      setCompanyId(agent.company_id);

      // Fetch followers
      const { data } = await supabase.from("company_followers").select("id, user_id, created_at").eq("company_id", agent.company_id).order("created_at", { ascending: false });
      if (!data || data.length === 0) { setFollowers([]); setLoading(false); return null; }
      const userIds = data.map((f) => f.user_id);
      const [profilesRes, emailRes, evtsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, display_name, phone, show_phone").in("user_id", userIds),
        supabase.rpc("get_user_emails_for_company", { p_user_ids: userIds }),
        supabase.from("events").select("id, title").eq("company_id", agent.company_id).eq("status", "active").limit(50),
      ]);
      const profileMap = new Map((profilesRes.data || []).map((p) => [p.user_id, p]));
      const emailMap = new Map((emailRes.data || []).map((e: { user_id: string; email: string }) => [e.user_id, e.email]));
      setFollowers(data.map((f) => ({ ...f, profile: profileMap.get(f.user_id) || undefined, email: emailMap.get(f.user_id) || undefined })));
      setEvents(evtsRes.data || []);
      setLoading(false);
      return null;
    },
    staleTime: 60_000,
  });

  const handleSendAnnouncement = async () => {
    if (!companyId || !announcementTitle.trim() || !announcementMessage.trim()) { toast.error("Fill title and message"); return; }
    setSending(true);
    try {
      const { data: ann, error } = await supabase.from("company_announcements").insert({ company_id: companyId, title: announcementTitle, message: announcementMessage, announcement_type: announcementType, event_id: announcementType === "event_invitation" && selectedEventId ? selectedEventId : null }).select("id").single();
      if (error) throw error;
      if (followers.length > 0 && ann) {
        await supabase.from("user_announcements").insert(followers.map((f) => ({ announcement_id: ann.id, user_id: f.user_id })));
        // Create user_notifications
        const notifications = followers.map((f) => ({
          user_id: f.user_id,
          title: announcementTitle,
          message: announcementMessage,
          notification_type: "announcement",
          source_company_id: companyId,
        }));
        await supabase.from("user_notifications").insert(notifications);
        // Send email notifications
        supabase.functions.invoke("send-announcement-emails", {
          body: { announcement_id: ann.id },
        }).catch((err) => console.error("Email send error:", err));
      }
      toast.success(`Sent to ${followers.length} followers!`);
      setAnnouncementOpen(false); setAnnouncementTitle(""); setAnnouncementMessage(""); setAnnouncementType("general"); setSelectedEventId("");
    } catch (err: any) { toast.error(err.message); } finally { setSending(false); }
  };

  const sorted = [...followers].sort((a, b) => sortOrder === "newest" ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime() : new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  const filtered = sorted.filter((f) => turkishIncludes(f.profile?.display_name || "", search));

  return (
    <AgentLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("agentDashboard.followers")}</h1>
            <p className="text-sm text-muted-foreground">{followers.length} {t("agentDashboard.totalFollowers")}</p>
          </div>
          <Button onClick={() => setAnnouncementOpen(true)} disabled={followers.length === 0}>
            <Megaphone className="h-4 w-4 mr-2" /> Send Announcement
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t("agentDashboard.searchByName")} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "newest" | "oldest")}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t("agentDashboard.newestToOldest")}</SelectItem>
              <SelectItem value="oldest">{t("agentDashboard.oldestToNewest")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-16">sNo</TableHead>
                <TableHead>{t("agentDashboard.followerName")}</TableHead>
                <TableHead>{t("admin.email")}</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>{t("agentDashboard.followedOn")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-12 w-12 text-muted-foreground/40" />
                    <p className="text-muted-foreground font-medium">{t("agentDashboard.noFollowersFound")}</p>
                  </div>
                </TableCell></TableRow>
              ) : filtered.map((f, idx) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{idx + 1}</TableCell>
                  <TableCell>{f.profile?.display_name || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{f.email || "—"}</TableCell>
                  <TableCell>{f.profile?.show_phone && f.profile?.phone ? f.profile.phone : <span className="text-muted-foreground/50">Hidden</span>}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(f.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Announcement History */}
        <AnnouncementHistory companyId={companyId} />

        <Dialog open={announcementOpen} onOpenChange={setAnnouncementOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5" /> Send Announcement</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={announcementType} onValueChange={setAnnouncementType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="event_invitation">Event Invitation</SelectItem>
                    <SelectItem value="promotion">Promotion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {announcementType === "event_invitation" && (
                <div className="space-y-2">
                  <Label>Event</Label>
                  <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                    <SelectTrigger><SelectValue placeholder="Choose event..." /></SelectTrigger>
                    <SelectContent>{events.map((e) => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2"><Label>Title</Label><Input value={announcementTitle} onChange={(e) => setAnnouncementTitle(e.target.value)} /></div>
              <div className="space-y-2"><Label>Message</Label><Textarea value={announcementMessage} onChange={(e) => setAnnouncementMessage(e.target.value)} rows={4} /></div>
              <p className="text-xs text-muted-foreground">Sending to <strong>{followers.length}</strong> followers.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAnnouncementOpen(false)}>Cancel</Button>
              <Button onClick={handleSendAnnouncement} disabled={sending}><Send className="h-4 w-4 mr-2" /> {sending ? "Sending..." : "Send"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AgentLayout>
  );
};

export default AgentFollowersPage;
