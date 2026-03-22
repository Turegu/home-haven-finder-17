import { Badge } from '@/components/ui/badge';
import { getPerformanceTier, type ListingStats } from '@/hooks/useListingStats';
import { useAnalyticsPhase } from '@/hooks/useAnalyticsPhase';

interface ListingPerformanceBadgeProps {
  stats: ListingStats | undefined;
}

const ListingPerformanceBadge = ({ stats }: ListingPerformanceBadgeProps) => {
  const { data: phase } = useAnalyticsPhase();

  if (!stats) return null;

  const tier = getPerformanceTier(stats);

  // In phase1, only show the tier label
  // In phase2+, show more detail
  return (
    <Badge className={`${tier.color} text-[10px] font-medium gap-1`} variant="secondary">
      {tier.label}
    </Badge>
  );
};

export default ListingPerformanceBadge;
