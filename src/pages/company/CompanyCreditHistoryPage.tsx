import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import CompanyLayout from "@/components/company/CompanyLayout";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  ArrowDownRight, ArrowUpRight, ArrowLeft, CreditCard, Phone
} from "lucide-react";
import { format, startOfMonth, startOfYear } from "date-fns";
import { useSalesContact } from "@/hooks/useSalesContact";

interface CreditTransaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  listing_type: string | null;
  created_at: string;
}

const CompanyCreditHistoryPage = () => {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [totalTopups, setTotalTopups] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [thisMonthSpent, setThisMonthSpent] = useState(0);
  const [thisYearSpent, setThisYearSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const { openSalesWhatsApp } = useSalesContact();

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data: company } = await supabase
          .from("companies")
          .select("id, credit_balance")
          .eq("owner_user_id", user.id)
          .limit(1)
          .maybeSingle();
        if (!company) { setLoading(false); return; }

        setBalance(company.credit_balance || 0);

        const { data: txData } = await supabase
          .from("credit_transactions")
          .select("id, amount, transaction_type, description, listing_type, created_at")
          .eq("company_id", company.id)
          .order("created_at", { ascending: false })
          .limit(500);

        const txs = (txData || []) as CreditTransaction[];
        setTransactions(txs);

        const now = new Date();
        const mStart = startOfMonth(now).toISOString();
        const yStart = startOfYear(now).toISOString();
        let topups = 0, spent = 0, mSpent = 0, ySpent = 0;
        for (const tx of txs) {
          if (tx.amount > 0) { topups += tx.amount; }
          else {
            const s = Math.abs(tx.amount);
            spent += s;
            if (tx.created_at >= mStart) mSpent += s;
            if (tx.created_at >= yStart) ySpent += s;
          }
        }
        setTotalTopups(topups);
        setTotalSpent(spent);
        setThisMonthSpent(mSpent);
        setThisYearSpent(ySpent);
      } catch (err) {
        console.error("Failed to load credit history:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const creditBarPercent = totalTopups > 0 ? Math.round((balance / totalTopups) * 100) : 0;

  if (loading) {
    return (
      <CompanyLayout>
        <div className="flex items-center justify-center py-20 text-muted-foreground">Loading credit history...</div>
      </CompanyLayout>
    );
  }

  return (
    <CompanyLayout>
      <div className="mb-6">
        <Link to="/company" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Credit History</h1>
        <p className="text-sm text-muted-foreground mt-1">View your credit balance, top-ups, and spending details.</p>
      </div>

      {/* Balance + Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        {/* Balance card */}
        <div className="md:col-span-1 bg-card rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Balance</h3>
            <CreditCard className="h-4 w-4 text-muted-foreground/50" />
          </div>
          <p className="text-3xl font-bold text-foreground">{balance}</p>
          {totalTopups > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                <span>Remaining</span>
                <span>{balance} / {totalTopups}</span>
              </div>
              <Progress value={creditBarPercent} className="h-1.5" />
            </div>
          )}
          <Button variant="link" size="sm" className="mt-2 p-0 h-auto text-xs text-primary" onClick={() => openSalesWhatsApp("Hi, I'd like to top up my credits.")}>
            <Phone className="h-3 w-3 mr-1" /> Contact Sales
          </Button>
        </div>

        {/* Summary cards */}
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 flex flex-col justify-center">
          <p className="text-[11px] font-medium text-muted-foreground mb-1">Total Topped Up</p>
          <p className="text-2xl font-bold text-emerald-700">{totalTopups}</p>
        </div>
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-4 flex flex-col justify-center">
          <p className="text-[11px] font-medium text-muted-foreground mb-1">Total Spent</p>
          <p className="text-2xl font-bold text-rose-700">{totalSpent}</p>
        </div>
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex flex-col justify-center">
          <p className="text-[11px] font-medium text-muted-foreground mb-1">This Month</p>
          <p className="text-2xl font-bold text-amber-700">{thisMonthSpent}</p>
        </div>
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 flex flex-col justify-center">
          <p className="text-[11px] font-medium text-muted-foreground mb-1">This Year</p>
          <p className="text-2xl font-bold text-blue-700">{thisYearSpent}</p>
        </div>
      </div>

      {/* Transactions list */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">All Transactions</h2>
        {transactions.length > 0 ? (
          <div className="space-y-1.5">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted/40 text-sm">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${tx.amount > 0 ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>
                  {tx.amount > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {tx.description || (tx.amount > 0 ? "Credit Top-up" : "Credit Spent")}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {format(new Date(tx.created_at), "MMM dd, yyyy · h:mm a")}
                    {tx.listing_type && ` · ${tx.listing_type}`}
                  </p>
                </div>
                <span className={`text-sm font-semibold shrink-0 ${tx.amount > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {tx.amount > 0 ? "+" : ""}{tx.amount}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <CreditCard className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No credit transactions yet</p>
          </div>
        )}
      </div>
    </CompanyLayout>
  );
};

export default CompanyCreditHistoryPage;