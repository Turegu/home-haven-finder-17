import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { turkishIncludes } from "@/lib/utils";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, Search, ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface Bank {
  id: string;
  name: string;
  logo_url: string | null;
  interest_rate: number | null;
  finance_amount_percentage: number | null;
  maximum_amount: number | null;
  maximum_duration: number | null;
  down_payment: number | null;
  final_payment: number | null;
  bank_info_link: string | null;
  description: string | null;
  status: string;
  created_at: string;
}

const emptyForm = {
  name: "",
  interest_rate: "",
  finance_amount_percentage: "",
  maximum_amount: "",
  maximum_duration: "",
  down_payment: "",
  final_payment: "",
  bank_info_link: "",
  description: "",
};

const AdminBanksPage = () => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Bank | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchBanks = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("banks")
      .select("*")
      .order("created_at", { ascending: false });
    setBanks((data as Bank[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchBanks(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setLogoFile(null);
    setLogoPreview(null);
    setDialogOpen(true);
  };

  const openEdit = (bank: Bank) => {
    setEditing(bank);
    setForm({
      name: bank.name,
      interest_rate: bank.interest_rate?.toString() || "",
      finance_amount_percentage: bank.finance_amount_percentage?.toString() || "",
      maximum_amount: bank.maximum_amount?.toString() || "",
      maximum_duration: bank.maximum_duration?.toString() || "",
      down_payment: bank.down_payment?.toString() || "",
      final_payment: bank.final_payment?.toString() || "",
      bank_info_link: bank.bank_info_link || "",
      description: bank.description || "",
    });
    setLogoFile(null);
    setLogoPreview(bank.logo_url);
    setDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleClear = () => {
    setForm(emptyForm);
    setLogoFile(null);
    setLogoPreview(editing?.logo_url || null);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error("Bank name is required"); return; }
    setSaving(true);

    let logo_url = editing?.logo_url || null;

    if (logoFile) {
      const ext = logoFile.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("bank-logos")
        .upload(path, logoFile);
      if (uploadError) {
        toast.error("Failed to upload logo");
        setSaving(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("bank-logos").getPublicUrl(path);
      logo_url = urlData.publicUrl;
    }

    const payload = {
      name: form.name,
      logo_url,
      interest_rate: form.interest_rate ? Number(form.interest_rate) : null,
      finance_amount_percentage: form.finance_amount_percentage ? Number(form.finance_amount_percentage) : null,
      maximum_amount: form.maximum_amount ? Number(form.maximum_amount) : null,
      maximum_duration: form.maximum_duration ? Number(form.maximum_duration) : null,
      down_payment: form.down_payment ? Number(form.down_payment) : null,
      final_payment: form.final_payment ? Number(form.final_payment) : null,
      bank_info_link: form.bank_info_link || null,
      description: form.description || null,
    };

    if (editing) {
      const { error } = await supabase.from("banks").update(payload).eq("id", editing.id);
      if (error) toast.error("Failed to update bank");
      else toast.success("Bank updated");
    } else {
      const { error } = await supabase.from("banks").insert(payload);
      if (error) toast.error("Failed to create bank");
      else toast.success("Bank created");
    }

    setSaving(false);
    setDialogOpen(false);
    fetchBanks();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this bank?")) return;
    await supabase.from("banks").delete().eq("id", id);
    toast.success("Bank deleted");
    fetchBanks();
  };

  const filtered = banks.filter(
    (b) => turkishIncludes(b.name, search)
  );

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Banks Management</h1>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> New Bank
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by bank name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Logo</TableHead>
              <TableHead>Bank Name</TableHead>
              <TableHead>Interest Rate</TableHead>
              <TableHead>Finance %</TableHead>
              <TableHead>Max Amount</TableHead>
              <TableHead>Max Duration</TableHead>
              <TableHead>Down Payment</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No banks found</TableCell>
              </TableRow>
            ) : (
              filtered.map((bank) => (
                <TableRow key={bank.id}>
                  <TableCell>
                    {bank.logo_url ? (
                      <img src={bank.logo_url} alt="" className="h-10 w-10 rounded-full border border-border object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{bank.name}</TableCell>
                  <TableCell>{bank.interest_rate != null ? `${bank.interest_rate}%` : "—"}</TableCell>
                  <TableCell>{bank.finance_amount_percentage != null ? `${bank.finance_amount_percentage}%` : "—"}</TableCell>
                  <TableCell>{bank.maximum_amount != null ? `$${bank.maximum_amount.toLocaleString()}` : "—"}</TableCell>
                  <TableCell>{bank.maximum_duration != null ? `${bank.maximum_duration} yrs` : "—"}</TableCell>
                  <TableCell>{bank.down_payment != null ? `${bank.down_payment}%` : "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(bank)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(bank.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Bank" : "Bank Creation"}</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground mb-4">
            Add bank information for mortgage and loan advertising. This data will be displayed on the mortgage bank loans page.
          </p>

          <div className="space-y-4">
            {/* Logo Upload */}
            <div className="flex items-center gap-4">
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              <div
                onClick={() => fileRef.current?.click()}
                className="h-20 w-20 rounded-full border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden shrink-0"
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div>
                <Label className="text-primary font-semibold">Bank Logo</Label>
                <p className="text-xs text-muted-foreground">Click the circle to upload bank logo</p>
              </div>
            </div>

            {/* Bank Name */}
            <div>
              <Label className="text-primary font-semibold">Bank Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter Bank Name" className="mt-1" />
            </div>

            {/* Row: Interest Rate, Finance %, Max Amount */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-primary font-semibold">Interest Rate</Label>
                <Input type="number" step="0.01" value={form.interest_rate} onChange={(e) => setForm({ ...form, interest_rate: e.target.value })} placeholder="Enter Interest Rate" className="mt-1" />
              </div>
              <div>
                <Label className="text-primary font-semibold">Finance Amount Percentage</Label>
                <Input type="number" step="0.01" value={form.finance_amount_percentage} onChange={(e) => setForm({ ...form, finance_amount_percentage: e.target.value })} placeholder="Enter Finance Amount Percent" className="mt-1" />
              </div>
              <div>
                <Label className="text-primary font-semibold">Maximum Amount</Label>
                <Input type="number" value={form.maximum_amount} onChange={(e) => setForm({ ...form, maximum_amount: e.target.value })} placeholder="Enter Maximum Amount" className="mt-1" />
              </div>
            </div>

            {/* Row: Max Duration, Down Payment, Final Payment */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-primary font-semibold">Maximum Duration</Label>
                <Input type="number" value={form.maximum_duration} onChange={(e) => setForm({ ...form, maximum_duration: e.target.value })} placeholder="Enter Maximum Duration" className="mt-1" />
              </div>
              <div>
                <Label className="text-primary font-semibold">Down Payment</Label>
                <Input type="number" step="0.01" value={form.down_payment} onChange={(e) => setForm({ ...form, down_payment: e.target.value })} placeholder="Enter Down Payment" className="mt-1" />
              </div>
              <div>
                <Label className="text-primary font-semibold">Final Payment</Label>
                <Input type="number" step="0.01" value={form.final_payment} onChange={(e) => setForm({ ...form, final_payment: e.target.value })} placeholder="Enter Final Payment" className="mt-1" />
              </div>
            </div>

            {/* Bank Info Link */}
            <div>
              <Label className="text-primary font-semibold">Bank Information Link</Label>
              <Input value={form.bank_info_link} onChange={(e) => setForm({ ...form, bank_info_link: e.target.value })} placeholder="Enter Bank Information Link" className="mt-1" />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={handleClear}>Clear</Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminBanksPage;
