import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Bank | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: banks = [], isLoading: loading } = useQuery({
    queryKey: ["admin", "banks"],
    queryFn: async () => {
      const { data } = await supabase
        .from("banks")
        .select("*")
        .order("created_at", { ascending: false });
      return (data as Bank[]) || [];
    },
    staleTime: 30_000,
  });

  const refetch = () => queryClient.invalidateQueries({ queryKey: ["admin", "banks"] });

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
    if (!form.name) { toast.error(t("admin.bankNameRequired")); return; }
    setSaving(true);

    let logo_url = editing?.logo_url || null;

    if (logoFile) {
      const ext = logoFile.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("bank-logos")
        .upload(path, logoFile);
      if (uploadError) {
        toast.error(t("admin.failedToUploadLogo"));
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
      if (error) toast.error(t("admin.failedToUpdateBank"));
      else toast.success(t("admin.bankUpdated"));
    } else {
      const { error } = await supabase.from("banks").insert(payload);
      if (error) toast.error(t("admin.failedToCreateBank"));
      else toast.success(t("admin.bankCreated"));
    }

    setSaving(false);
    setDialogOpen(false);
    fetchBanks();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("admin.deleteThisBank"))) return;
    await supabase.from("banks").delete().eq("id", id);
    toast.success(t("admin.bankDeleted"));
    fetchBanks();
  };

  const filtered = banks.filter(
    (b) => turkishIncludes(b.name, search)
  );

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t("admin.banksManagement")}</h1>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> {t("admin.newBank")}
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("admin.searchByBankName")}
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
              <TableHead>{t("admin.logo")}</TableHead>
              <TableHead>{t("admin.bankName")}</TableHead>
              <TableHead>{t("admin.interestRate")}</TableHead>
              <TableHead>{t("admin.financePercent")}</TableHead>
              <TableHead>{t("admin.maxAmount")}</TableHead>
              <TableHead>{t("admin.maxDuration")}</TableHead>
              <TableHead>{t("admin.downPayment")}</TableHead>
              <TableHead className="text-right">{t("admin.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">{t("admin.loading")}</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">{t("admin.noBanksFound")}</TableCell>
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
            <DialogTitle>{editing ? t("admin.editBank") : t("admin.bankCreation")}</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground mb-4">
            Add bank information for mortgage           </p>

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
                <Label className="text-primary font-semibold">{t("admin.bankLogo")}</Label>
                <p className="text-xs text-muted-foreground">{t("admin.clickToUploadLogo")}</p>
              </div>
            </div>

            {/* Bank Name */}
            <div>
              <Label className="text-primary font-semibold">{t("admin.bankName")}</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("admin.enterBankName")} className="mt-1" />
            </div>

            {/* Row: Interest Rate, Finance %, Max Amount */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-primary font-semibold">{t("admin.interestRate")}</Label>
                <Input type="number" step="0.01" value={form.interest_rate} onChange={(e) => setForm({ ...form, interest_rate: e.target.value })} placeholder={t("admin.enterInterestRate")} className="mt-1" />
              </div>
              <div>
                <Label className="text-primary font-semibold">{t("admin.financeAmountPercentage")}</Label>
                <Input type="number" step="0.01" value={form.finance_amount_percentage} onChange={(e) => setForm({ ...form, finance_amount_percentage: e.target.value })} placeholder={t("admin.enterFinancePercent")} className="mt-1" />
              </div>
              <div>
                <Label className="text-primary font-semibold">{t("admin.maximumAmount")}</Label>
                <Input type="number" value={form.maximum_amount} onChange={(e) => setForm({ ...form, maximum_amount: e.target.value })} placeholder={t("admin.enterMaxAmount")} className="mt-1" />
              </div>
            </div>

            {/* Row: Max Duration, Down Payment, Final Payment */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-primary font-semibold">{t("admin.maximumDuration")}</Label>
                <Input type="number" value={form.maximum_duration} onChange={(e) => setForm({ ...form, maximum_duration: e.target.value })} placeholder={t("admin.enterMaxDuration")} className="mt-1" />
              </div>
              <div>
                <Label className="text-primary font-semibold">{t("admin.downPayment")}</Label>
                <Input type="number" step="0.01" value={form.down_payment} onChange={(e) => setForm({ ...form, down_payment: e.target.value })} placeholder={t("admin.enterDownPayment")} className="mt-1" />
              </div>
              <div>
                <Label className="text-primary font-semibold">{t("admin.finalPayment")}</Label>
                <Input type="number" step="0.01" value={form.final_payment} onChange={(e) => setForm({ ...form, final_payment: e.target.value })} placeholder={t("admin.enterFinalPayment")} className="mt-1" />
              </div>
            </div>

            {/* Bank Info Link */}
            <div>
              <Label className="text-primary font-semibold">{t("admin.bankInfoLink")}</Label>
              <Input value={form.bank_info_link} onChange={(e) => setForm({ ...form, bank_info_link: e.target.value })} placeholder={t("admin.enterBankInfoLink")} className="mt-1" />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={handleClear}>{t("admin.clear")}</Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving}>
                {saving ? t("admin.saving") : editing ? t("admin.update") : t("admin.create")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminBanksPage;
