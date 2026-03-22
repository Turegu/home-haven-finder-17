import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { ListingStats } from '@/hooks/useListingStats';

interface ConversionFunnelChartProps {
  stats: ListingStats;
  title: string;
}

const ConversionFunnelChart = ({ stats, title }: ConversionFunnelChartProps) => {
  const data = useMemo(() => [
    { name: 'Impressions', value: stats.impressions, color: 'hsl(var(--primary))' },
    { name: 'Page Views', value: stats.views, color: 'hsl(210, 70%, 55%)' },
    { name: 'Saves', value: stats.saves, color: 'hsl(45, 80%, 50%)' },
    { name: 'Inquiries', value: stats.inquiryClicks, color: 'hsl(150, 60%, 45%)' },
  ], [stats]);

  const conversionRates = useMemo(() => {
    const viewRate = stats.impressions > 0 ? ((stats.views / stats.impressions) * 100).toFixed(1) : '0';
    const inquiryRate = stats.views > 0 ? ((stats.inquiryClicks / stats.views) * 100).toFixed(1) : '0';
    return { viewRate, inquiryRate };
  }, [stats]);

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-foreground text-sm">Conversion Funnel</h4>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>View Rate: <strong className="text-foreground">{conversionRates.viewRate}%</strong></span>
          <span>Inquiry Rate: <strong className="text-foreground">{conversionRates.inquiryRate}%</strong></span>
        </div>
      </div>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 80 }}>
            <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={80} />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [value.toLocaleString(), 'Count']}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
        <span>Impressions</span>
        <span>→</span>
        <span>Page Views</span>
        <span>→</span>
        <span>Saves</span>
        <span>→</span>
        <span>Inquiries</span>
      </div>
    </div>
  );
};

export default ConversionFunnelChart;
