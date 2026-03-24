import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { turkishIncludes } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Search, Plus, Trash2, MoreVertical, Eye, Pencil, ArrowUpCircle, Coins, Users, Home, FolderKanban, CalendarDays, BadgeCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";
import UpgradeMembershipDialog from "@/components/admin/UpgradeMembershipDialog";
import AddCreditsDialog from "@/components/admin/AddCreditsDialog";


type Company = Tables<"companies">;

const AdminCompaniesPage = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [selected, setSelected] = useState<string[]>([]);

  // Dialog state
  const [upgradeCompany, setUpgradeCompany] = useState<Company | null>(null);
  const [creditsCompany, setCreditsCompany] = useState<Company | null>(null);
  

  const fetchCompanies = async () => {
    setLoading(true);
    // Auto-downgrade expired memberships
    await supabase.rpc("downgrade_expired_memberships");

    const query = supabase.from("companies").select("*")
      .order("created_at", { ascending: sortOrder === "oldest" });

    const { data, error } = await query;
    if (error) {
      toast.error("Failed to fetch companies");
    } else {
      setCompanies(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCompanies(); }, [sortOrder]);

  const filteredCompanies = companies.filter(c =>
    turkishIncludes(c.name, search) ||
    turkishIncludes(c.email, search)
  );

  const toggleSelect = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selected.length === filteredCompanies.length) {
      setSelected([]);
    } else {
      setSelected(filteredCompanies.map(c => c.id));
    }
  };

  const handleDelete = async () => {
    if (selected.length === 0) return;
    const { error } = await supabase.from("companies").delete().in("id", selected);
    if (error) {
      toast.error("Failed to delete companies");
    } else {
      toast.success(`${selected.length} company(ies) deleted`);
      setSelected([]);
      fetchCompanies();
    }
  };

  const handleToggleVerified = async (company: Company) => {
    const newValue = !company.is_verified;
    const { error } = await supabase.from("companies").update({ is_verified: newValue }).eq("id", company.id);
    if (error) {
      toast.error("Failed to update verification status");
    } else {
      toast.success(`${company.name} ${newValue ? "verified" : "unverified"}`);
      fetchCompanies();
    }
  };

  const membershipColor = (m: string) => {
    switch (m) {
      case "pro": return "bg-emerald-100 text-emerald-800";
      case "plus": return "bg-orange-100 text-orange-800";
      case "lite": return "bg-purple-100 text-purple-800";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Companies Management</h1>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search By Company"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary/50"
          />
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="whitespace-nowrap">Sort By Date</span>
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as "newest" | "oldest")}>
            <SelectTrigger className="w-[160px] bg-secondary/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest to Oldest</SelectItem>
              <SelectItem value="oldest">Oldest to Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {selected.length > 0 && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete ({selected.length})
            </Button>
          )}
          <Button onClick={() => navigate("/admin/companies/new")}>
            <Plus className="h-4 w-4 mr-2" /> Create New Company
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground uppercase text-sm tracking-wider">Companies</h2>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-primary/5">
                <TableHead className="w-10">
                  <Checkbox
                    checked={selected.length === filteredCompanies.length && filteredCompanies.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Creation Date</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Current Membership</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Company Name</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Package End Date</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Email</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold">Contact</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-semibold text-right">Options</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredCompanies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    No companies found. Click "Create New Company" to add one.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCompanies.map((company) => (
                  <TableRow key={company.id} className="hover:bg-muted/30">
                    <TableCell>
                      <Checkbox
                        checked={selected.includes(company.id)}
                        onCheckedChange={() => toggleSelect(company.id)}
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(company.created_at), "dd/MM/yyyy hh:mm a")}
                    </TableCell>
                    <TableCell>
                      <Badge className={membershipColor(company.membership)} variant="secondary">
                        {company.membership}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-1.5">
                        {company.name}
                        {company.is_verified && <BadgeCheck className="h-4 w-4 text-blue-500 shrink-0" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {company.package_end_date
                        ? `${company.membership.toUpperCase()} - ${format(new Date(company.package_end_date), "dd/MM/yyyy")}`
                        : `${company.membership.toUpperCase()} - N/A`}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{company.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{company.phone || "—"}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/admin/companies/${company.id}`)}>
                            <Eye className="h-4 w-4 mr-2" /> View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/admin/companies/${company.id}/edit`)}>
                            <Pencil className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setUpgradeCompany(company)}>
                            <ArrowUpCircle className="h-4 w-4 mr-2" /> Change Membership
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onClick={() => setCreditsCompany(company)}>
                            <Coins className="h-4 w-4 mr-2" /> Add Points
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/admin/companies/${company.id}/agents`)}>
                            <Users className="h-4 w-4 mr-2" /> View Agents
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/admin/properties?company=${encodeURIComponent(company.name)}`)}>
                            <Home className="h-4 w-4 mr-2" /> View Properties
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/admin/projects?company=${encodeURIComponent(company.name)}`)}>
                            <FolderKanban className="h-4 w-4 mr-2" /> View Projects
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/admin/events?company=${encodeURIComponent(company.name)}`)}>
                            <CalendarDays className="h-4 w-4 mr-2" /> View Events
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Upgrade Membership Dialog */}
      {upgradeCompany && (
        <UpgradeMembershipDialog
          open={!!upgradeCompany}
          onOpenChange={(open) => !open && setUpgradeCompany(null)}
          companyId={upgradeCompany.id}
          companyName={upgradeCompany.name}
          currentMembership={upgradeCompany.membership}
          packageEndDate={upgradeCompany.package_end_date}
          onUpgraded={fetchCompanies}
        />
      )}

      {/* Add Credits Dialog */}
      {creditsCompany && (
        <AddCreditsDialog
          open={!!creditsCompany}
          onOpenChange={(open) => !open && setCreditsCompany(null)}
          companyId={creditsCompany.id}
          companyName={creditsCompany.name}
          currentBalance={creditsCompany.credit_balance}
          onUpdated={fetchCompanies}
        />
      )}

    </AdminLayout>
  );
};

export default AdminCompaniesPage;
