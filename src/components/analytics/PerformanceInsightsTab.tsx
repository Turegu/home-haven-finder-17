import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Eye, MousePointerClick, Heart, Phone, MessageCircle, Mail, TrendingUp, BarChart3, Activity, Loader2 } from 'lucide-react';
import { useListingStats, getPerformanceTier, type ListingStats } from '@/hooks/useListingStats';
import { useAnalyticsPhase, type AnalyticsPhase } from '@/hooks/useAnalyticsPhase';
import ConversionFunnelChart from './ConversionFunnelChart';
import { useTranslation } from "react-i18next";

interface PerformanceInsightsTabProps {
  listingId: string;
  listingType?: 'property' | 'project';
  listingTitle: string;
}

function StatCard({ icon: Icon, label, value, subtext, iconColor }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  iconColor?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
      <div className={`rounded-full p-2 ${iconColor || 'bg-primary/10'}`}>
        <Icon className={`h-4 w-4 ${iconColor ? 'text-white' : 'text-primary'}`} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-foreground">{value}</p>
        {subtext && <p className="text-[11px] text-muted-foreground">{subtext}</p>}
      </div>
    </div>
  );
}

function Phase1Display({ stats }: { stats: ListingStats }) {
  const { t } = useTranslation();
  const tier = getPerformanceTier(stats);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card">
        <Activity className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{t("analytics.listingPerformance")}</h3>
            <Badge className={tier.color} variant="secondary">{tier.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
        </div>
      </div>

      {stats.impressions < 10 ? (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
          <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
          <div>
            <p className="font-medium text-foreground">Analyzing Market Data...</p>
            <p className="text-sm text-muted-foreground">{t("analytics.initialExposure")}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Eye} label={t("analytics.visibility")} value={stats.impressions >= 50 ? 'Excellent' : stats.impressions >= 25 ? 'Good' : 'Growing'} />
          <StatCard icon={MousePointerClick} label={t("analytics.engagement")} value={stats.views >= 10 ? 'High' : stats.views >= 5 ? 'Moderate' : 'Building'} />
          <StatCard icon={Heart} label="Saves" value={stats.saves >= 5 ? 'Popular' : stats.saves >= 1 ? 'Gaining Interest' : 'Early Stage'} />
          <StatCard icon={Phone} label="Inquiries" value={stats.inquiryClicks >= 3 ? 'Active' : stats.inquiryClicks >= 1 ? 'Started' : 'Pending'} />
        </div>
      )}
    </div>
  );
}

function Phase2Display({ stats }: { stats: ListingStats }) {
  const tier = getPerformanceTier(stats);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card">
        <TrendingUp className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">Performance Overview</h3>
            <Badge className={tier.color} variant="secondary">{tier.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={Eye}
          label="Total Impressions"
          value={stats.impressions < 10 ? 'Initial Exposure Phase' : `${stats.impressions}+`}
        />
        <StatCard
          icon={MousePointerClick}
          label="Direct Hits"
          value={stats.views < 10 ? 'Analyzing...' : `${stats.views}`}
        />
        <StatCard
          icon={Heart}
          label="Saves"
          value={stats.saves}
          subtext={stats.saves >= 5 ? '🔥 Popular listing!' : undefined}
        />
        <StatCard
          icon={Phone}
          label="Total Inquiries"
          value={stats.inquiryClicks < 3 ? 'Building...' : `${stats.inquiryClicks}`}
        />
      </div>
    </div>
  );
}

function Phase3Display({ stats, listingTitle }: { stats: ListingStats; listingTitle: string }) {
  const tier = getPerformanceTier(stats);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card">
        <BarChart3 className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">Full Analytics</h3>
            <Badge className={tier.color} variant="secondary">{tier.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{tier.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Eye} label="Total Impressions" value={stats.impressions} subtext="Search appearances" />
        <StatCard icon={MousePointerClick} label="Direct Hits" value={stats.views} subtext="Page views" />
        <StatCard icon={Heart} label="Saves" value={stats.saves} subtext={stats.saves >= 5 ? '🔥 Popular!' : 'Bookmarks'} />
        <StatCard icon={Phone} label="Total Inquiries" value={stats.inquiryClicks} subtext="Contact clicks" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={MessageCircle} label="WhatsApp" value={stats.whatsappClicks} iconColor="bg-emerald-500" />
        <StatCard icon={Phone} label="Calls" value={stats.callClicks} iconColor="bg-blue-500" />
        <StatCard icon={Mail} label="Emails" value={stats.emailClicks} iconColor="bg-purple-500" />
      </div>

      <ConversionFunnelChart stats={stats} title={listingTitle} />
    </div>
  );
}

const PerformanceInsightsTab = ({ listingId, listingType = 'property', listingTitle }: PerformanceInsightsTabProps) => {
  const { t } = useTranslation();
  const { data: stats, isLoading: statsLoading } = useListingStats(listingId, listingType);
  const { data: phase, isLoading: phaseLoading } = useAnalyticsPhase();

  if (phase === 'off') return null;

  if (statsLoading || phaseLoading || !stats) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading analytics...
      </div>
    );
  }

  switch (phase) {
    case 'phase3':
      return <Phase3Display stats={stats} listingTitle={listingTitle} />;
    case 'phase2':
      return <Phase2Display stats={stats} />;
    default:
      return <Phase1Display stats={stats} />;
  }
};

export default PerformanceInsightsTab;
