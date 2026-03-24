import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { History, Pencil, Undo2, Trash2 } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  message: string;
  announcement_type: string;
  created_at: string;
}

interface AnnouncementHistoryProps {
  companyId: string | null;
}

const typeLabels: Record<string, string> = {
  general: "General",
  event_invitation: "Event Invite",
  promotion: "Promotion",
  update: "Update",
};

const AnnouncementHistory = ({ companyId }: AnnouncementHistoryProps) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editAnn, setEditAnn] = useState<Announcement | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [recallId, setRecallId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (companyId) fetchAnnouncements();
  }, [companyId]);

  const fetchAnnouncements = async () => {
    if (!companyId) return;
    setLoading(true);
    const { data } = await supabase
      .from("company_announcements")
      .select("id, title, message, announcement_type, created_at")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
    setAnnouncements(data || []);
    setLoading(false);
  };

  const handleEdit = (ann: Announcement) => {
    setEditAnn(ann);
    setEditTitle(ann.title);
    setEditMessage(ann.message);
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editAnn || !editTitle.trim() || !editMessage.trim()) {
      toast.error("Title and message are required");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("company_announcements")
      .update({ title: editTitle.trim(), message: editMessage.trim() })
      .eq("id", editAnn.id);
    if (error) {
      toast.error("Failed to update announcement");
    } else {
      // Also update user_notifications that were created for this announcement
      await supabase
        .from("user_notifications")
        .update({ title: editTitle.trim(), message: editMessage.trim() })
        .eq("title", editAnn.title)
        .eq("message", editAnn.message)
        .eq("source_company_id", companyId!);
      toast.success("Announcement updated");
      setEditOpen(false);
      fetchAnnouncements();
    }
    setSaving(false);
  };

  const handleRecall = async () => {
    if (!recallId) return;
    // Delete from user_announcements (removes from user dashboards)
    await supabase.from("user_announcements").delete().eq("announcement_id", recallId);
    // Delete related user_notifications
    const ann = announcements.find((a) => a.id === recallId);
    if (ann) {
      await supabase
        .from("user_notifications")
        .delete()
        .eq("title", ann.title)
        .eq("notification_type", "announcement")
        .eq("source_company_id", companyId!);
    }
    toast.success("Announcement recalled from all users");
    setRecallId(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    // Delete user_announcements first
    await supabase.from("user_announcements").delete().eq("announcement_id", deleteId);
    // Delete related notifications
    const ann = announcements.find((a) => a.id === deleteId);
    if (ann) {
      await supabase
        .from("user_notifications")
        .delete()
        .eq("title", ann.title)
        .eq("notification_type", "announcement")
        .eq("source_company_id", companyId!);
    }
    // Delete the announcement itself
    await supabase.from("company_announcements").delete().eq("id", deleteId);
    toast.success("Announcement deleted permanently");
    setDeleteId(null);
    fetchAnnouncements();
  };

  if (announcements.length === 0 && !loading) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <History className="h-5 w-5" />
        Announcement History
      </h2>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className="border border-border rounded-lg p-4 bg-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs">
                      {typeLabels[ann.announcement_type] || ann.announcement_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(ann.created_at).toLocaleDateString()} at{" "}
                      {new Date(ann.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <h3 className="font-medium text-foreground">{ann.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {ann.message}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(ann)}
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-orange-500 hover:text-orange-600"
                    onClick={() => setRecallId(ann.id)}
                    title="Recall from users"
                  >
                    <Undo2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(ann.id)}
                    title="Delete permanently"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" /> Edit Announcement
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea value={editMessage} onChange={(e) => setEditMessage(e.target.value)} rows={5} />
            </div>
            <p className="text-xs text-muted-foreground">
              Changes will be reflected in all users' notifications.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recall Confirm */}
      <AlertDialog open={!!recallId} onOpenChange={(o) => !o && setRecallId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Recall Announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the announcement from all users' dashboards and notifications. The announcement record will remain in your history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRecall} className="bg-orange-500 hover:bg-orange-600">
              Recall
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the announcement and remove it from all users' dashboards. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AnnouncementHistory;
