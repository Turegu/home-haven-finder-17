import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Save, Clock, CheckCircle, Phone, Mail, Building2, Trash2 } from "lucide-react";

type MembershipPackage = {
  id: string;
  package_type: string;
  name: string;
  tagline: string | null;
  monthly_price: number;
  quarterly_price: number;
  semiannual_price: number;
  annual_price: number;
  max_agents: number;
  max_properties: number;
  max_projects: number;
  max_events: number;
  has_property_requests: boolean;
  has_company_agent_search: boolean;
  has_home_logo: boolean;
  has_company_profile: boolean;
  has_ai_search: boolean;
  sort_order: number;
};

type AdvertisingRequest = {
  id: string;
  company_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  message: string | null;
  status: string;
  created_at: string;
};

const AdminMembershipsPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: packages, isLoading: packagesLoading } = useQuery({
    queryKey: ["admin-membership-packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membership_packages")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as MembershipPackage[];
    },
  });

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ["admin-advertising-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("advertising_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AdvertisingRequest[];
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">{t("admin.membershipManagement")}</h1>

        <Tabs defaultValue="packages">
          <TabsList>
            <TabsTrigger value="packages">{t("admin.packages")}</TabsTrigger>
            <TabsTrigger value="requests">
              {t("admin.advertisingRequests")}
              {requests && requests.filter((r) => r.status === "pending").length > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  {requests.filter((r) => r.status === "pending").length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="packages" className="mt-6">
            {packagesLoading ? (
              <p className="text-muted-foreground">{t("admin.loading")}</p>
            ) : (
              <PackagesEditor packages={packages || []} />
            )}
          </TabsContent>

          <TabsContent value="requests" className="mt-6">
            {requestsLoading ? (
              <p className="text-muted-foreground">{t("admin.loading")}</p>
            ) : (
              <RequestsList requests={requests || []} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

// --- Packages Editor ---
const PackagesEditor = ({ packages }: { packages: MembershipPackage[] }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [editData, setEditData] = useState<Record<string, MembershipPackage>>(
    () => Object.fromEntries(packages.map((p) => [p.id, { ...p }]))
  );

  const updateMutation = useMutation({
    mutationFn: async (pkg: MembershipPackage) => {
      const { error } = await supabase
        .from("membership_packages")
        .update({
          name: pkg.name,
          tagline: pkg.tagline,
          monthly_price: pkg.monthly_price,
          quarterly_price: pkg.quarterly_price,
          semiannual_price: pkg.semiannual_price,
          annual_price: pkg.annual_price,
          max_agents: pkg.max_agents,
          max_properties: pkg.max_properties,
          max_projects: pkg.max_projects,
          max_events: pkg.max_events,
          has_property_requests: pkg.has_property_requests,
          has_company_agent_search: pkg.has_company_agent_search,
          has_home_logo: pkg.has_home_logo,
          has_company_profile: pkg.has_company_profile,
          has_ai_search: pkg.has_ai_search,
        })
        .eq("id", pkg.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-membership-packages"] });
      toast.success(t("admin.packageUpdated"));
    },
    onError: () => toast.error(t("admin.failedToUpdatePackage")),
  });

  const update = (id: string, field: keyof MembershipPackage, value: any) => {
    setEditData((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const columns = packages.map((p) => p.package_type.toUpperCase());

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="text-left p-3 bg-primary/10 text-foreground font-semibold w-48 rounded-tl-lg">{t("admin.feature")}</th>
            {packages.map((p, i) => (
              <th
                key={p.id}
                className={`text-center p-3 bg-primary/10 text-foreground font-semibold ${
                  i === packages.length - 1 ? "rounded-tr-lg" : ""
                }`}
              >
                {p.package_type.toUpperCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <EditableRow label={t("admin.packageName")} packages={packages} editData={editData} field="name" update={update} type="text" />
          <EditableRow label={t("admin.packageTagline")} packages={packages} editData={editData} field="tagline" update={update} type="text" />
          <CheckboxRow label={t("admin.professionalCompanyProfile")} packages={packages} editData={editData} field="has_company_profile" update={update} />
          <EditableRow label={t("admin.professionalAgentProfiles")} packages={packages} editData={editData} field="max_agents" update={update} type="number" />
          <EditableRow label={t("admin.propertyListings")} packages={packages} editData={editData} field="max_properties" update={update} type="number" />
          <EditableRow label={t("admin.projectsListings")} packages={packages} editData={editData} field="max_projects" update={update} type="number" />
          <EditableRow label={t("admin.eventsListings")} packages={packages} editData={editData} field="max_events" update={update} type="number" />
          <CheckboxRow label={t("admin.receivePropertyRequests")} packages={packages} editData={editData} field="has_property_requests" update={update} />
          <CheckboxRow label={t("admin.includedCompanyAgentSearch")} packages={packages} editData={editData} field="has_company_agent_search" update={update} />
          <CheckboxRow label={t("admin.includedInAiSearch")} packages={packages} editData={editData} field="has_ai_search" update={update} />
          <PriceRow label={t("admin.monthlySubscription")} packages={packages} editData={editData} field="monthly_price" update={update} />
          <PriceRow label={t("admin.quarterlySubscription")} packages={packages} editData={editData} field="quarterly_price" update={update} />
          <PriceRow label={t("admin.semiannualSubscription")} packages={packages} editData={editData} field="semiannual_price" update={update} />
          <PriceRow label={t("admin.annualSubscription")} packages={packages} editData={editData} field="annual_price" update={update} />
          <tr>
            <td className="p-3 bg-primary/5 font-semibold rounded-bl-lg"></td>
            <td colSpan={packages.length} className={`p-3 text-center rounded-br-lg`}>
              <Button
                size="sm"
                onClick={() => {
                  packages.forEach((p) => updateMutation.mutate(editData[p.id]));
                }}
                disabled={updateMutation.isPending}
              >
                <Save className="h-4 w-4 mr-1" /> {t("admin.updateAllPackages")}
              </Button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const EditableRow = ({
  label, packages, editData, field, update, type,
}: {
  label: string;
  packages: MembershipPackage[];
  editData: Record<string, MembershipPackage>;
  field: keyof MembershipPackage;
  update: (id: string, field: keyof MembershipPackage, value: any) => void;
  type: "text" | "number";
}) => (
  <tr className="border-b border-border">
    <td className="p-3 bg-primary/5 font-medium text-foreground">{label}</td>
    {packages.map((p) => (
      <td key={p.id} className="p-3 text-center">
        <Input
          type={type}
          value={editData[p.id]?.[field] as any ?? ""}
          onChange={(e) =>
            update(p.id, field, type === "number" ? Number(e.target.value) : e.target.value)
          }
          className="text-center"
        />
      </td>
    ))}
  </tr>
);

const CheckboxRow = ({
  label, packages, editData, field, update,
}: {
  label: string;
  packages: MembershipPackage[];
  editData: Record<string, MembershipPackage>;
  field: keyof MembershipPackage;
  update: (id: string, field: keyof MembershipPackage, value: any) => void;
}) => (
  <tr className="border-b border-border">
    <td className="p-3 bg-primary/5 font-medium text-foreground">{label}</td>
    {packages.map((p) => (
      <td key={p.id} className="p-3 text-center">
        <div className="flex justify-center">
          <Checkbox
            checked={editData[p.id]?.[field] as boolean}
            onCheckedChange={(v) => update(p.id, field, v === true)}
          />
        </div>
      </td>
    ))}
  </tr>
);

const PriceRow = ({
  label, packages, editData, field, update,
}: {
  label: string;
  packages: MembershipPackage[];
  editData: Record<string, MembershipPackage>;
  field: keyof MembershipPackage;
  update: (id: string, field: keyof MembershipPackage, value: any) => void;
}) => (
  <tr className="border-b border-border">
    <td className="p-3 bg-primary/5 font-medium text-foreground">{label}</td>
    {packages.map((p) => (
      <td key={p.id} className="p-3 text-center">
        <div className="flex items-center gap-1 justify-center">
          <span className="text-muted-foreground text-sm">$</span>
          <Input
            type="number"
            value={editData[p.id]?.[field] as any ?? 0}
            onChange={(e) => update(p.id, field, Number(e.target.value))}
            className="text-center w-24"
          />
        </div>
      </td>
    ))}
  </tr>
);

// --- Requests List ---
const RequestsList = ({ requests }: { requests: AdvertisingRequest[] }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("advertising_requests")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-advertising-requests"] });
      toast.success(t("admin.statusUpdated"));
    },
    onError: () => toast.error(t("admin.failedToUpdateStatus")),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("advertising_requests")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-advertising-requests"] });
      toast.success(t("admin.requestDeleted"));
    },
    onError: () => toast.error(t("admin.failedToDeleteRequest")),
  });

  if (requests.length === 0) {
    return <p className="text-muted-foreground text-center py-12">{t("admin.noAdvertisingRequests")}</p>;
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    contacted: "bg-blue-100 text-blue-800",
    closed: "bg-green-100 text-green-800",
  };

  return (
    <div className="space-y-4">
      {requests.map((req) => (
        <Card key={req.id}>
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground text-lg">{req.company_name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[req.status] || ""}`}>
                    {req.status}
                  </span>
                </div>
                <p className="text-sm text-foreground">{req.first_name} {req.last_name}</p>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <a href={`mailto:${req.email}`} className="flex items-center gap-1 hover:text-primary">
                    <Mail className="h-3.5 w-3.5" /> {req.email}
                  </a>
                  <a href={`tel:${req.phone}`} className="flex items-center gap-1 hover:text-primary">
                    <Phone className="h-3.5 w-3.5" /> {req.phone}
                  </a>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(req.created_at).toLocaleDateString()}
                  </span>
                </div>
                {req.message && (
                  <p className="text-sm text-muted-foreground mt-2 italic">"{req.message}"</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {req.status === "pending" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => statusMutation.mutate({ id: req.id, status: "contacted" })}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" /> {t("admin.markContacted")}
                  </Button>
                )}
                {req.status === "contacted" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => statusMutation.mutate({ id: req.id, status: "closed" })}
                  >
                    Close
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    if (confirm(t("admin.deleteRequestConfirm"))) deleteMutation.mutate(req.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminMembershipsPage;
