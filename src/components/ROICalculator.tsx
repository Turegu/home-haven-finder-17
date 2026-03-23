import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Calculator, TrendingUp } from "lucide-react";
import { useMarketStats } from "@/hooks/useMarketTrends";

interface ROICalculatorProps {
  propertyPrice: number;
  propertyArea: number;
  province: string | null;
  town: string | null;
  neighbourhood: string | null;
  currency?: string;
  areaUnit?: string;
}

const ROICalculator = ({
  propertyPrice,
  propertyArea,
  province,
  town,
  neighbourhood,
  currency = "USD",
  areaUnit = "m²",
}: ROICalculatorProps) => {
  const { t } = useTranslation();
  const { data: stats } = useMarketStats(neighbourhood, town, province);

  // Estimate monthly rent: use neighbourhood avg rent/m² * area, fallback to 5% of property value / 12
  const estimatedMonthlyRent = stats?.avgRentPricePerM2 && stats.avgRentPricePerM2 > 0
    ? stats.avgRentPricePerM2 * propertyArea
    : (propertyPrice * 0.05) / 12;

  const [customMonthlyRent, setCustomMonthlyRent] = useState<number | null>(null);
  const [annualAppreciation, setAnnualAppreciation] = useState(3);
  const [annualExpenseRate, setAnnualExpenseRate] = useState(1);

  const monthlyRent = customMonthlyRent ?? estimatedMonthlyRent ?? 0;

  const analysis = useMemo(() => {
    if (!monthlyRent || !propertyPrice || propertyPrice <= 0) return null;

    const annualRent = monthlyRent * 12;
    const annualExpenses = propertyPrice * (annualExpenseRate / 100);
    const netAnnualIncome = annualRent - annualExpenses;
    const grossYield = (annualRent / propertyPrice) * 100;
    const netYield = (netAnnualIncome / propertyPrice) * 100;
    const paybackYears = netAnnualIncome > 0 ? propertyPrice / netAnnualIncome : null;

    // 5-year projection
    const projection = [];
    let cumulativeIncome = 0;
    let currentValue = propertyPrice;
    for (let y = 1; y <= 10; y++) {
      currentValue *= 1 + annualAppreciation / 100;
      cumulativeIncome += netAnnualIncome;
      const totalReturn = (currentValue - propertyPrice + cumulativeIncome) / propertyPrice * 100;
      projection.push({ year: y, value: currentValue, cumIncome: cumulativeIncome, totalReturn });
    }

    return { annualRent, annualExpenses, netAnnualIncome, grossYield, netYield, paybackYears, projection };
  }, [monthlyRent, propertyPrice, annualAppreciation, annualExpenseRate]);

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">{t('roi.title')}</h2>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Property Value</label>
          <div className="bg-muted rounded-md px-3 py-2 text-sm font-medium text-foreground">
            {currency} {propertyPrice.toLocaleString()}
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">
            Est. Monthly Rent {estimatedMonthlyRent ? "(from avg)" : ""}
          </label>
          <div className="flex items-center border border-border rounded-md overflow-hidden">
            <span className="px-2 text-xs text-muted-foreground bg-muted">{currency}</span>
            <input
              type="number"
              value={customMonthlyRent ?? Math.round(estimatedMonthlyRent ?? 0)}
              onChange={(e) => setCustomMonthlyRent(Number(e.target.value) || null)}
              className="w-full px-2 py-2 text-sm bg-background focus:outline-none"
              placeholder="Monthly rent"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Annual Appreciation</label>
          <div className="flex items-center border border-border rounded-md overflow-hidden">
            <span className="px-2 text-xs text-muted-foreground bg-muted">%</span>
            <input
              type="number"
              step="0.5"
              value={annualAppreciation}
              onChange={(e) => setAnnualAppreciation(Number(e.target.value))}
              className="w-full px-2 py-2 text-sm bg-background focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Annual Expenses</label>
          <div className="flex items-center border border-border rounded-md overflow-hidden">
            <span className="px-2 text-xs text-muted-foreground bg-muted">%</span>
            <input
              type="number"
              step="0.5"
              value={annualExpenseRate}
              onChange={(e) => setAnnualExpenseRate(Number(e.target.value))}
              className="w-full px-2 py-2 text-sm bg-background focus:outline-none"
            />
          </div>
        </div>
      </div>

      {analysis ? (
        <>
          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg mb-6">
            <MetricBox label="Gross Yield" value={`${analysis.grossYield.toFixed(1)}%`} />
            <MetricBox label="Net Yield" value={`${analysis.netYield.toFixed(1)}%`} highlight />
            <MetricBox
              label="Payback Period"
              value={analysis.paybackYears ? `${analysis.paybackYears.toFixed(1)} yrs` : "N/A"}
            />
            <MetricBox
              label="Net Annual Income"
              value={`${currency} ${analysis.netAnnualIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            />
          </div>

          {/* 10-year projection table */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-primary" />
              10-Year Investment Projection
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-2 pr-4">Year</th>
                    <th className="text-right py-2 pr-4">Property Value</th>
                    <th className="text-right py-2 pr-4">Cum. Rental Income</th>
                    <th className="text-right py-2">Total Return</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.projection
                    .filter((p) => [1, 3, 5, 7, 10].includes(p.year))
                    .map((p) => (
                      <tr key={p.year} className="border-b border-border/50">
                        <td className="py-2 pr-4 font-medium text-foreground">Year {p.year}</td>
                        <td className="text-right py-2 pr-4 text-foreground">
                          {currency} {p.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                        <td className="text-right py-2 pr-4 text-foreground">
                          {currency} {p.cumIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                        <td className="text-right py-2 font-semibold text-primary">
                          {p.totalReturn.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Enter monthly rent to calculate ROI
        </div>
      )}
    </div>
  );
};

const MetricBox = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className="text-center">
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <p className={`text-lg font-bold ${highlight ? "text-primary" : "text-foreground"}`}>{value}</p>
  </div>
);

export default ROICalculator;
