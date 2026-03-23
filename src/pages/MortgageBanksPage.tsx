import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { turkishIncludes } from "@/lib/utils";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";
import {
  ExternalLink, Landmark, Search, Calculator,
  DollarSign, Percent, Calendar, Check
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  const { t } = useTranslation();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Calculator state
  const [propertyPrice, setPropertyPrice] = useState(500000);
  const [downPaymentPct, setDownPaymentPct] = useState(25);
  const [loanDuration, setLoanDuration] = useState(10);
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Mortgage & Bank Loans | Turegu";
    const fetchBanks = async () => {
      const { data } = await supabase
        .from("banks")
        .select("*")
        .eq("status", "active")
        .order("interest_rate", { ascending: true });
      setBanks((data as Bank[]) || []);
      setLoading(false);
    };
    fetchBanks();
  }, []);

  const filtered = banks.filter((b) =>
    turkishIncludes(b.name, search)
  );

  const selectedBank = banks.find((b) => b.id === selectedBankId) || null;

  const mortgageCalc = useMemo(() => {
    if (!selectedBank || !selectedBank.interest_rate) return null;

    const dp = (downPaymentPct / 100) * propertyPrice;
    const loanAmount = propertyPrice - dp;
    const monthlyRate = selectedBank.interest_rate / 100;
    const totalMonths = loanDuration * 12;

    // Amortization formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
    const pow = Math.pow(1 + monthlyRate, totalMonths);
    const monthlyPayment = loanAmount * (monthlyRate * pow) / (pow - 1);
    const totalPayment = monthlyPayment * totalMonths;
    const totalInterest = totalPayment - loanAmount;

    // Check bank constraints
    const maxAmtOk = !selectedBank.maximum_amount || loanAmount <= selectedBank.maximum_amount;
    const maxDurOk = !selectedBank.maximum_duration || loanDuration <= selectedBank.maximum_duration;
    const minDpOk = !selectedBank.down_payment || downPaymentPct >= selectedBank.down_payment;
    const financeOk = !selectedBank.finance_amount_percentage || ((100 - downPaymentPct) <= selectedBank.finance_amount_percentage);

    const warnings: string[] = [];
    if (!maxAmtOk) warnings.push(`${t('mortgage.loanExceedsMax')} (${selectedBank.maximum_amount?.toLocaleString()})`);
    if (!maxDurOk) warnings.push(`${t('mortgage.durationExceedsMax')} (${selectedBank.maximum_duration} ${t('mortgage.years')})`);
    if (!minDpOk) warnings.push(`${t('mortgage.downPaymentBelowMin')} (${selectedBank.down_payment}%)`);
    if (!financeOk) warnings.push(`${t('mortgage.financeExceedsLimit')} (${selectedBank.finance_amount_percentage}%)`);

    // Final payment (balloon)
    const finalPaymentAmt = selectedBank.final_payment
      ? (selectedBank.final_payment / 100) * loanAmount
      : 0;

    return {
      loanAmount,
      downPayment: dp,
      monthlyPayment,
      totalPayment,
      totalInterest,
      finalPaymentAmt,
      warnings,
      isValid: warnings.length === 0,
    };
  }, [selectedBank, propertyPrice, downPaymentPct, loanDuration]);

  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary via-primary to-primary/80 py-16 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 border-2 border-primary-foreground rounded-full" />
          <div className="absolute bottom-10 right-20 w-60 h-60 border-2 border-primary-foreground rounded-full" />
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary-foreground/20 backdrop-blur-sm mb-5">
            <Landmark className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-3 font-playfair">
            {t('mortgage.heroTitle')}
          </h1>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto text-lg">
            {t('mortgage.heroSubtitle')}
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-primary-foreground/70">
            <Link to="/" className="hover:text-primary-foreground transition-colors">{t('mortgage.home')}</Link>
            <span>›</span>
            <span className="text-primary-foreground font-medium">{t('mortgage.heroTitle')}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">

        {/* ====== MORTGAGE CALCULATOR ====== */}
        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden mb-12">
          <div className="bg-gradient-to-r from-primary/5 to-transparent p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calculator className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{t('mortgage.mortgageCalculator')}</h2>
                <p className="text-sm text-muted-foreground">{t('mortgage.enterDetails')}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Input Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  {t('mortgage.propertyPrice')}
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="number"
                    value={propertyPrice}
                    onChange={(e) => setPropertyPrice(Number(e.target.value) || 0)}
                    className="w-full h-11 pl-9 pr-3 rounded-lg border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  {t('mortgage.downPayment')}
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="number"
                    min={0}
                    max={90}
                    value={downPaymentPct}
                    onChange={(e) => setDownPaymentPct(Number(e.target.value) || 0)}
                    className="w-full h-11 pl-9 pr-3 rounded-lg border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  = ${fmt((downPaymentPct / 100) * propertyPrice)}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  {t('mortgage.loanDuration')}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={loanDuration}
                    onChange={(e) => setLoanDuration(Number(e.target.value) || 1)}
                    className="w-full h-11 pl-9 pr-3 rounded-lg border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  = {loanDuration * 12} {t('mortgage.monthlyInstallments')}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                  {t('mortgage.selectBank')}
                </label>
                <select
                  value={selectedBankId || ""}
                  onChange={(e) => setSelectedBankId(e.target.value || null)}
                  className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
                >
                  <option value="">{t('mortgage.chooseBank')}</option>
                  {banks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} — {b.interest_rate}% {t('mortgage.monthly')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results */}
            {selectedBank && mortgageCalc && (
              <div className="mt-2">
                {/* Warnings */}
                {mortgageCalc.warnings.length > 0 && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-5">
                    <p className="text-sm font-semibold text-destructive mb-1">⚠️ {t('mortgage.bankCriteriaWarning')}</p>
                    {mortgageCalc.warnings.map((w, i) => (
                      <p key={i} className="text-xs text-destructive/80">• {w}</p>
                    ))}
                  </div>
                )}

                {/* Result Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <ResultCard
                    label={t('mortgage.loanAmount')}
                    value={`$${fmt(mortgageCalc.loanAmount)}`}
                    sub={t('mortgage.afterDownPayment')}
                  />
                  <ResultCard
                    label={t('mortgage.monthlyInstallment')}
                    value={`$${fmt(mortgageCalc.monthlyPayment)}`}
                    sub={t('mortgage.forMonths', { months: loanDuration * 12 })}
                    highlight
                  />
                  <ResultCard
                    label={t('mortgage.totalInterest')}
                    value={`$${fmt(mortgageCalc.totalInterest)}`}
                    sub={`${t('mortgage.at')} ${selectedBank.interest_rate}%/${t('mortgage.monthly')}`}
                  />
                  <ResultCard
                    label={t('mortgage.totalPayment')}
                    value={`$${fmt(mortgageCalc.totalPayment)}`}
                    sub={t('mortgage.principalPlusInterest')}
                  />
                  {mortgageCalc.finalPaymentAmt > 0 && (
                    <ResultCard
                      label={t('mortgage.finalBalloonPayment')}
                      value={`$${fmt(mortgageCalc.finalPaymentAmt)}`}
                      sub={`${selectedBank.final_payment}% ${t('mortgage.ofLoan')}`}
                    />
                  )}
                </div>

                {/* Selected bank info */}
                <div className="mt-5 p-4 bg-muted/50 rounded-lg flex items-center gap-4">
                  {selectedBank.logo_url ? (
                    <img src={selectedBank.logo_url} alt={selectedBank.name} className="h-10 w-auto max-w-[80px] rounded-lg object-contain" />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Landmark className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{selectedBank.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{selectedBank.description}</p>
                  </div>
                  {selectedBank.bank_info_link && (
                    <a href={selectedBank.bank_info_link} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
                        <ExternalLink className="h-3.5 w-3.5" /> {t('mortgage.visitBank')}
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            )}

            {!selectedBankId && (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <Calculator className="h-8 w-8 mx-auto mb-2 opacity-30" />
                {t('mortgage.selectBankAbove')}
              </div>
            )}
          </div>
        </div>

        {/* ====== BANK COMPARISON GRID ====== */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">{t('mortgage.compareBanks')}</h2>
              <p className="text-sm text-muted-foreground mt-1">{t('mortgage.sideBySide')}</p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('mortgage.searchBanks')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16 text-muted-foreground">{t('mortgage.loadingBanks')}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">{t('mortgage.noBanksFound')}</div>
          ) : (
            <>
              {/* Comparison Table (Desktop) */}
              <div className="hidden lg:block bg-card rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-primary/5 border-b border-border">
                        <th className="text-left p-4 text-xs uppercase tracking-wider font-semibold text-muted-foreground">{t('mortgage.bank')}</th>
                        <th className="text-center p-4 text-xs uppercase tracking-wider font-semibold text-muted-foreground">{t('mortgage.interestRate')}</th>
                        <th className="text-center p-4 text-xs uppercase tracking-wider font-semibold text-muted-foreground">{t('mortgage.financePercent')}</th>
                        <th className="text-center p-4 text-xs uppercase tracking-wider font-semibold text-muted-foreground">{t('mortgage.maxAmount')}</th>
                        <th className="text-center p-4 text-xs uppercase tracking-wider font-semibold text-muted-foreground">{t('mortgage.maxDuration')}</th>
                        <th className="text-center p-4 text-xs uppercase tracking-wider font-semibold text-muted-foreground">{t('mortgage.downPayment')}</th>
                        <th className="text-center p-4 text-xs uppercase tracking-wider font-semibold text-muted-foreground">{t('mortgage.finalPayment')}</th>
                        <th className="text-center p-4 text-xs uppercase tracking-wider font-semibold text-muted-foreground">{t('mortgage.action')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((bank, idx) => (
                        <tr
                          key={bank.id}
                          className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${
                            selectedBankId === bank.id ? 'bg-primary/5 ring-1 ring-primary/20' : ''
                          }`}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {bank.logo_url ? (
                                <img src={bank.logo_url} alt={bank.name} className="h-10 w-10 rounded-full object-cover border border-border" />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Landmark className="h-5 w-5 text-primary" />
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-foreground text-sm">{bank.name}</p>
                                {idx === 0 && (
                                   <Badge className="bg-green-600 hover:bg-green-600 text-white text-[10px] mt-0.5">{t('mortgage.lowestRate')}</Badge>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className="text-lg font-bold text-primary">{bank.interest_rate ?? '—'}%</span>
                            <p className="text-[10px] text-muted-foreground">{t('mortgage.monthly')}</p>
                          </td>
                          <td className="p-4 text-center font-medium text-foreground">{bank.finance_amount_percentage ?? '—'}%</td>
                          <td className="p-4 text-center font-medium text-foreground">
                            {bank.maximum_amount ? `$${bank.maximum_amount.toLocaleString()}` : '—'}
                          </td>
                          <td className="p-4 text-center font-medium text-foreground">
                             {bank.maximum_duration ? `${bank.maximum_duration} ${t('mortgage.years')}` : '—'}
                          </td>
                          <td className="p-4 text-center font-medium text-foreground">{bank.down_payment ?? '—'}%</td>
                          <td className="p-4 text-center font-medium text-foreground">{bank.final_payment ?? '—'}%</td>
                          <td className="p-4 text-center">
                            <Button
                              variant={selectedBankId === bank.id ? 'default' : 'outline'}
                              size="sm"
                              className="gap-1.5"
                              onClick={() => {
                                setSelectedBankId(bank.id);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                            >
                              {selectedBankId === bank.id ? (
                                <><Check className="h-3.5 w-3.5" /> {t('mortgage.selected')}</>
                              ) : (
                                <><Calculator className="h-3.5 w-3.5" /> {t('mortgage.calculate')}</>
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Card Grid (Mobile / Tablet) */}
              <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-5">
                {filtered.map((bank, idx) => (
                  <div
                    key={bank.id}
                    className={`bg-card rounded-xl border overflow-hidden transition-all hover:shadow-md ${
                      selectedBankId === bank.id ? 'border-primary shadow-md ring-1 ring-primary/20' : 'border-border'
                    }`}
                  >
                    <div className="p-5 flex items-center gap-3 border-b border-border">
                      {bank.logo_url ? (
                        <img src={bank.logo_url} alt={bank.name} className="h-12 w-12 rounded-full object-cover border-2 border-border" />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Landmark className="h-6 w-6 text-primary" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-foreground truncate">{bank.name}</h3>
                        {idx === 0 && (
                          <Badge className="bg-green-600 hover:bg-green-600 text-white text-[10px] mt-0.5">Lowest Rate</Badge>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xl font-bold text-primary">{bank.interest_rate ?? '—'}%</span>
                        <p className="text-[10px] text-muted-foreground">monthly</p>
                      </div>
                    </div>

                    <div className="p-5 space-y-2.5">
                      <InfoRow label="Finance Amount" value={`${bank.finance_amount_percentage ?? '—'}%`} />
                      <InfoRow label="Maximum Amount" value={bank.maximum_amount ? `$${bank.maximum_amount.toLocaleString()}` : '—'} />
                      <InfoRow label="Maximum Duration" value={bank.maximum_duration ? `${bank.maximum_duration} years` : '—'} />
                      <InfoRow label="Down Payment" value={`${bank.down_payment ?? '—'}%`} />
                      <InfoRow label="Final Payment" value={`${bank.final_payment ?? '—'}%`} />
                    </div>

                    <div className="px-5 pb-5 flex gap-2">
                      <Button
                        className="flex-1 gap-1.5"
                        variant={selectedBankId === bank.id ? 'default' : 'outline'}
                        onClick={() => {
                          setSelectedBankId(bank.id);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        <Calculator className="h-4 w-4" />
                        {selectedBankId === bank.id ? 'Selected' : 'Calculate'}
                      </Button>
                      {bank.bank_info_link && (
                        <a href={bank.bank_info_link} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" className="shrink-0">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
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

const ResultCard = ({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) => (
  <div className={`rounded-xl p-4 text-center ${highlight ? 'bg-primary text-primary-foreground' : 'bg-muted/50'}`}>
    <p className={`text-xs font-medium mb-1 ${highlight ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
      {label}
    </p>
    <p className={`text-xl font-bold ${highlight ? 'text-primary-foreground' : 'text-foreground'}`}>
      {value}
    </p>
    <p className={`text-[10px] mt-0.5 ${highlight ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
      {sub}
    </p>
  </div>
);

export default MortgageBanksPage;
