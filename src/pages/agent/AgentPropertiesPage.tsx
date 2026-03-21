import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AgentLayout from "@/components/agent/AgentLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Search, MoreVertical, Pencil, Eye, RefreshCw, Ban, ArrowUpCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import UpgradeListingDialog from "@/components/company/UpgradeListingDialog";

interface AgentProperty {
  id: string;
  listing_id: string;
  title: string;
  property_type: string;
  property_purpose: string;
  status: string;
  price: number | null;
  currency: string | null;
  created_at: string;
  property_classification: string | null;
}

const AgentPropertiesPage = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<AgentProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [upgradeDialog, setUpgradeDialog] = useState<{ open: boolean; property: AgentProperty | null }>({ open: false, property: null });

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: agent } = await supabase.from("agents").select("id, company_id").eq("user_id", user.id).limit(1).maybeSingle();
    if (!agent) return;
    setCompanyId(agent.company_id);

    const { data, error } = await supabase
      .from("properties")
      .select("id, listing_id, title, property_type, property_purpose, status, price, currency, created_at, property_classification")
      .eq("company_id", agent.company_id)
      .order("created_at", { ascending: sortOrder === "oldest" });
    if (error) toast.error("Failed to load");
    else setProperties(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [sortOrder]);

  const handleDeactivate = async (prop: AgentProperty) => {
    const newStatus = prop.status === "active" ? "inactive" : "active";
    const { error } = await supabase.from("properties").update({ status: newStatus }).eq("id", prop.id);
    if (error) toast.error("Failed to update status");
    else {
      toast.success(`Property ${newStatus === "active" ? "activated" : "deactivated"}`);
      fetchData();
    }
  };

  const filtered = properties.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) || p.listing_id.includes(search)
  );

  return (
    <AgentLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">Properties</h1>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary/50" />
        </div>
        <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as any)}>
          <SelectTrigger className="w-[170px] bg-secondary/50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-primary/5">
              <TableHead className="text-xs uppercase tracking-wider font-semibold">ID</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Title</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Type</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Purpose</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Price</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Status</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold">Date</TableHead>
              <TableHead className="text-xs uppercase tracking-wider font-semibold text-right">Options</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">No properties found.</TableCell></TableRow>
            ) : filtered.map((p) => (
              <TableRow key={p.id} className="hover:bg-muted/30">
                <TableCell className="font-mono text-xs">{p.listing_id}</TableCell>
                <TableCell className="font-medium">{p.title}</TableCell>
                <TableCell className="capitalize text-sm">{p.property_type}</TableCell>
                <TableCell className="capitalize text-sm">{p.property_purpose}</TableCell>
                <TableCell className="text-sm">{p.price ? `${p.currency} ${p.price.toLocaleString()}` : "—"}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={p.status === "active" ? "bg-emerald-100 text-emerald-800" : p.status === "inactive" ? "bg-red-100 text-red-800" : "bg-muted text-muted-foreground"}>
                    {p.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{format(new Date(p.created_at), "dd/MM/yyyy")}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/property/${p.id}`)}>
                        <Eye className="h-4 w-4 mr-2" /> View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => fetchData()}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/company/properties/${p.id}/edit`)}>
                        <Pencil className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeactivate(p)}>
                        <Ban className="h-4 w-4 mr-2" /> {p.status === "active" ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setUpgradeDialog({ open: true, property: p })}>
                        <ArrowUpCircle className="h-4 w-4 mr-2" /> Upgrade To Premium/Featured
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {upgradeDialog.property && companyId && (
        <UpgradeListingDialog
          open={upgradeDialog.open}
          onOpenChange={(open) => setUpgradeDialog({ open, property: open ? upgradeDialog.property : null })}
          listingId={upgradeDialog.property.id}
          listingTitle={upgradeDialog.property.title}
          listingType="property"
          companyId={companyId}
          currentClassification={upgradeDialog.property.property_classification}
          onUpgraded={fetchData}
        />
      )}
    </AgentLayout>
  );
};

export default AgentPropertiesPage;
