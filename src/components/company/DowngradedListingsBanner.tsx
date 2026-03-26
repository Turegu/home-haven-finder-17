import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle } from "lucide-react";
import { format, addDays } from "date-fns";
import { useTranslation } from "react-i18next";

interface DowngradedListingsBannerProps {
  companyId: string | null;
  tableName: "properties" | "projects" | "events" | "agents";
}

const DowngradedListingsBanner = ({ companyId, tableName }: DowngradedListingsBannerProps) => {
  const { t } = useTranslation();
  const [count, setCount] = useState(0);
  const [earliestDate, setEarliestDate] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;

    const fetch = async () => {
      const statusFilter = tableName === "agents" ? "inactive" : "deactivated";

      const [countRes, earliestRes] = await Promise.all([
        supabase
          .from(tableName)
          .select("id", { count: "exact", head: true })
          .eq("company_id", companyId)
          .eq("status", statusFilter)
          .not("downgraded_at", "is", null),
        supabase
          .from(tableName)
          .select("downgraded_at")
          .eq("company_id", companyId)
          .eq("status", statusFilter)
          .not("downgraded_at", "is", null)
          .order("downgraded_at", { ascending: true })
          .limit(1),
      ]);

      setCount(countRes.count || 0);
      const earliest = earliestRes.data?.[0]?.downgraded_at || null;
      setEarliestDate(earliest);
    };

    fetch();
  }, [companyId, tableName]);

  if (count === 0) return null;

  const entityMap: Record<DowngradedListingsBannerProps["tableName"], string> = {
    properties: t("companyDashboard.bannerEntityListings"),
    projects: t("companyDashboard.bannerEntityProjects"),
    events: t("companyDashboard.bannerEntityEvents"),
    agents: t("companyDashboard.bannerEntityAgents"),
  };

  const statusLabel = tableName === "agents"
    ? t("companyDashboard.bannerStatusFrozen")
    : t("companyDashboard.bannerStatusInactive");

  const deletionDate = earliestDate
    ? format(addDays(new Date(earliestDate), 90), "do MMM yyyy")
    : t("companyDashboard.bannerFallbackDate");

  return (
    <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 mb-4">
      <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-destructive">
          {t("companyDashboard.downgradeBannerTitle", {
            count,
            entity: entityMap[tableName],
            status: statusLabel,
          })}
        </p>
        <p className="text-sm text-destructive/80 mt-1">
          {t("companyDashboard.downgradeBannerBody", { date: deletionDate })}
        </p>
      </div>
    </div>
  );
};

export default DowngradedListingsBanner;
