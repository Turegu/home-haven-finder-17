import { useState, useEffect } from "react";
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

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: agent } = await supabase.from("agents").select("company_id").eq("user_id", user.id).limit(1).maybeSingle();
      if (agent) {
        setCompanyId(agent.company_id);
        fetchFollowers(agent.company_id);
        const { data: evts } = await supabase.from("events").select("id, title").eq("company_id", agent.company_id).eq("status", "active").limit(50);
        setEvents(evts || []);
      }
    };
    init();
  }, []);

  const fetchFollowers = async (cId: string) => {
    setLoading(true);
    const { data } = await supabase.from("company_followers").select("id, user_id, created_at").eq("company_id", cId).order("created_at", { ascending: false });
    if (!data || data.length === 0) { setFollowers([]); setLoading(false); return; }
    const userIds = data.map((f) => f.user_id);
    const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, phone, show_phone").in("user_id", userIds);
    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
    const { data: emailData } = await supabase.rpc("get_user_emails_for_company", { p_user_ids: userIds });
    const emailMap = new Map((emailData || []).map((e: { user_id: string; email: string }) => [e.user_id, e.email]));
    setFollowers(data.map((f) => ({ ...f, profile: profileMap.get(f.user_id) || undefined, email: emailMap.get(f.user_id) || undefined })));
    setLoading(false);
  };

  const handleSendAnnouncement = async () => {
    if (!companyId || !announcementTitle.trim() || !announcementMessage.trim()) { toast.error("Fill title and message"); return; }
    setSending(true);
    try {
      const { data: ann, error } = await supabase.from("company_announcements").insert({ company_id: companyId, title: announcementTitle, message: announcementMessage, announcement_type: announcementType, event_id: announcementType === "event_invitation" && selectedEventId ? selectedEventId : null }).select("id").single();
      if (error) throw error;
      if (followers.length > 0 && ann) {
        await supabase.from("user_announcements").insert(followers.map((f) => ({ announcement_id: ann.id, user_id: f.user_id })));
      }
      toast.success(`Sent to ${followers.length} followers!`);
      setAnnouncementOpen(false); setAnnouncementTitle(""); setAnnouncementMessage("");
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
            <Input placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "newest" | "oldest")}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest to Oldest</SelectItem>
              <SelectItem value="oldest">Oldest to Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-16">sNo</TableHead>
                <TableHead>Follower Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Followed On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-12 w-12 text-muted-foreground/40" />
                    <p className="text-muted-foreground font-medium">No Followers Found</p>
                  </div>
                </TableCell></TableRow>
              ) : filtered.map((f, idx) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{idx + 1}</TableCell>
                  <TableCell>{f.profile?.display_name || "—"}</TableCell>
                  <TableCell>{f.profile?.show_phone && f.profile?.phone ? f.profile.phone : <span className="text-muted-foreground/50">Hidden</span>}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(f.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

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
