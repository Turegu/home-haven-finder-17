import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

interface AssignAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  listingTitle: string;
  listingType: "property" | "project" | "event";
  companyId: string;
  currentAgentId: string | null;
  onAssigned: () => void;
}

interface AgentOption {
  id: string;
  name: string;
  email: string;
}

const AssignAgentDialog = ({
  open, onOpenChange, listingId, listingTitle, listingType, companyId, currentAgentId, onAssigned
}: AssignAgentDialogProps) => {
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      const { data } = await supabase
        .from("agents")
        .select("id, name, email")
        .eq("company_id", companyId)
        .eq("status", "active")
        .order("name");
      setAgents(data || []);
      setSelectedAgent(currentAgentId || "none");
    };
    load();
  }, [open, companyId, currentAgentId]);

  const handleAssign = async () => {
    setLoading(true);
    try {
      const agentId = selectedAgent === "none" ? null : selectedAgent;
      const tableName = listingType === "property" ? "properties" : listingType === "project" ? "projects" : "events";

      const { error } = await supabase
        .from(tableName)
        .update({ agent_id: agentId } as any)
        .eq("id", listingId);
      if (error) throw error;

      toast.success(agentId ? "Agent assigned to listing" : "Agent removed from listing");
      onAssigned();
      onOpenChange(false);
    } catch {
      toast.error("Failed to assign agent");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <UserPlus className="h-5 w-5" /> Assign To Agent
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground truncate">
            <span className="font-medium text-foreground">{listingTitle}</span>
          </p>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Select Agent</label>
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger><SelectValue placeholder="Choose an agent" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Agent Assigned</SelectItem>
                {agents.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} ({a.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {agents.length === 0 && (
            <p className="text-xs text-muted-foreground">No active agents found. Create agents first.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAssign} disabled={loading}>
            {loading ? "Saving..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignAgentDialog;
