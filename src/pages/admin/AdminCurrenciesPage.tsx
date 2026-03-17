import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { MoreVertical, Power, ArrowUpDown, Plus, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Currency {
  id: string;
  name: string;
  code: string;
  symbol: string;
  sort_order: number;
  status: string;
}

const AdminCurrenciesPage = () => {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [editDialog, setEditDialog] = useState(false);
  const [orderDialog, setOrderDialog] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [selected, setSelected] = useState<Currency | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editSymbol, setEditSymbol] = useState("");
  const [editOrder, setEditOrder] = useState("");
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newSymbol, setNewSymbol] = useState("");

  const fetchCurrencies = async () => {
    const { data, error } = await supabase
      .from("currencies")
      .select("*")
      .order("sort_order", { ascending: true });
    if (!error && data) setCurrencies(data as Currency[]);
    setLoading(false);
  };

  useEffect(() => { fetchCurrencies(); }, []);

  const toggleStatus = async (c: Currency) => {
    const newStatus = c.status === "active" ? "inactive" : "active";
    const { error } = await supabase.from("currencies").update({ status: newStatus }).eq("id", c.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: `Currency ${newStatus === "active" ? "activated" : "deactivated"}` }); fetchCurrencies(); }
  };

  const openEdit = (c: Currency) => {
    setSelected(c); setEditName(c.name); setEditCode(c.code); setEditSymbol(c.symbol); setEditDialog(true);
  };

  const saveEdit = async () => {
    if (!selected) return;
    const { error } = await supabase.from("currencies").update({ name: editName, code: editCode, symbol: editSymbol }).eq("id", selected.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Currency updated" }); setEditDialog(false); fetchCurrencies(); }
  };

  const openOrder = (c: Currency) => { setSelected(c); setEditOrder(String(c.sort_order)); setOrderDialog(true); };

  const saveOrder = async () => {
    if (!selected) return;
    const { error } = await supabase.from("currencies").update({ sort_order: Number(editOrder) }).eq("id", selected.id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Order updated" }); setOrderDialog(false); fetchCurrencies(); }
  };

  const addCurrency = async () => {
    const maxOrder = currencies.length > 0 ? Math.max(...currencies.map(c => c.sort_order)) : 0;
    const { error } = await supabase.from("currencies").insert({ name: newName, code: newCode.toUpperCase(), symbol: newSymbol, sort_order: maxOrder + 1 });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Currency added" }); setAddDialog(false); setNewName(""); setNewCode(""); setNewSymbol(""); fetchCurrencies(); }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">CURRENCIES</h1>
          <Button onClick={() => setAddDialog(true)} size="sm"><Plus className="h-4 w-4 mr-2" /> Add Currency</Button>
        </div>

        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : currencies.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No currencies found</TableCell></TableRow>
              ) : currencies.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.code}</TableCell>
                  <TableCell>{c.symbol}</TableCell>
                  <TableCell>{c.sort_order}</TableCell>
                  <TableCell>
                    <span className={`text-sm font-medium ${c.status === "active" ? "text-green-600" : "text-muted-foreground"}`}>
                      {c.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4 text-primary" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(c)}><Pencil className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleStatus(c)}><Power className="h-4 w-4 mr-2" /> {c.status === "active" ? "Deactivate" : "Activate"}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openOrder(c)}><ArrowUpDown className="h-4 w-4 mr-2" /> Edit Order</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Currency</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={editName} onChange={e => setEditName(e.target.value)} /></div>
            <div><Label>Code</Label><Input value={editCode} onChange={e => setEditCode(e.target.value)} /></div>
            <div><Label>Symbol</Label><Input value={editSymbol} onChange={e => setEditSymbol(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>Cancel</Button>
            <Button onClick={saveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Dialog */}
      <Dialog open={orderDialog} onOpenChange={setOrderDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Order</DialogTitle></DialogHeader>
          <div><Label>Sort Order</Label><Input type="number" value={editOrder} onChange={e => setEditOrder(e.target.value)} /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderDialog(false)}>Cancel</Button>
            <Button onClick={saveOrder}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Currency</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. US Dollar" /></div>
            <div><Label>Code</Label><Input value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="e.g. USD" /></div>
            <div><Label>Symbol</Label><Input value={newSymbol} onChange={e => setNewSymbol(e.target.value)} placeholder="e.g. $" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>Cancel</Button>
            <Button onClick={addCurrency} disabled={!newName || !newCode || !newSymbol}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCurrenciesPage;
