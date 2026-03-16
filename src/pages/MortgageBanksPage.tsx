import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ExternalLink, Landmark, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
}

const MortgageBanksPage = () => {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchBanks = async () => {
      const { data } = await supabase
        .from("banks")
        .select("*")
        .eq("status", "active")
        .order("name");
      setBanks((data as Bank[]) || []);
      setLoading(false);
    };
    fetchBanks();
  }, []);

  const filtered = banks.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <div className="bg-primary py-12">
        <div className="container mx-auto px-4 text-center">
          <Landmark className="h-12 w-12 text-primary-foreground mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
            Mortgage & Bank Loans
          </h1>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto">
            Compare mortgage rates and financing options from leading banks to find the best deal for your dream home.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search */}
        <div className="relative max-w-md mx-auto mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search banks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground">Loading banks...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">No banks found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((bank) => (
              <div
                key={bank.id}
                className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Card Header with Logo */}
                <div className="p-6 flex items-center gap-4 border-b border-border">
                  {bank.logo_url ? (
                    <img
                      src={bank.logo_url}
                      alt={bank.name}
                      className="h-14 w-14 rounded-full object-cover border-2 border-border shrink-0"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Landmark className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-bold text-foreground text-lg truncate">{bank.name}</h3>
                  </div>
                </div>

                {/* Card Body - Rates Info */}
                <div className="p-6 space-y-3">
                  <InfoRow label="Interest Rate" value={bank.interest_rate != null ? `${bank.interest_rate}%` : "—"} />
                  <InfoRow label="Finance Amount" value={bank.finance_amount_percentage != null ? `${bank.finance_amount_percentage}%` : "—"} />
                  <InfoRow label="Maximum Amount" value={bank.maximum_amount != null ? `$${bank.maximum_amount.toLocaleString()}` : "—"} />
                  <InfoRow label="Maximum Duration" value={bank.maximum_duration != null ? `${bank.maximum_duration} years` : "—"} />
                  <InfoRow label="Down Payment" value={bank.down_payment != null ? `${bank.down_payment}%` : "—"} />
                  <InfoRow label="Final Payment" value={bank.final_payment != null ? `${bank.final_payment}%` : "—"} />
                </div>

                {/* Card Footer */}
                {bank.bank_info_link && (
                  <div className="px-6 pb-6">
                    <a href={bank.bank_info_link} target="_blank" rel="noopener noreferrer">
                      <Button className="w-full gap-2">
                        <ExternalLink className="h-4 w-4" />
                        View Bank Details
                      </Button>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-semibold text-foreground">{value}</span>
  </div>
);

export default MortgageBanksPage;
