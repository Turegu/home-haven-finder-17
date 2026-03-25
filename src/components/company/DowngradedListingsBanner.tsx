import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle } from "lucide-react";
import { format, addDays } from "date-fns";

interface DowngradedListingsBannerProps {
  companyId: string | null;
  tableName: "properties" | "projects" | "events" | "agents";
}

const DowngradedListingsBanner = ({ companyId, tableName }: DowngradedListingsBannerProps) => {
  const [count, setCount] = useState(0);
  const [earliestDate, setEarliestDate] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    const fetch = async () => {
      const { data, count: total } = await supabase
        .from(tableName)
        .select("downgraded_at", { count: "exact" })
        .eq("company_id", companyId)
        .eq("status", "deactivated")
        .not("downgraded_at", "is", null)
        .order("downgraded_at", { ascending: true })
        .limit(1);

      setCount(total || 0);
      if (data && data.length > 0 && data[0].downgraded_at) {
        setEarliestDate(data[0].downgraded_at);
      }
    };
    fetch();
  }, [companyId, tableName]);

  if (count === 0) return null;

  const deletionDate = earliestDate ? format(addDays(new Date(earliestDate), 90), "do MMM yyyy") : "3 months after deactivation";
  const label = tableName === "properties" ? "listings" : tableName === "agents" ? "agents" : tableName;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 mb-4">
      <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-destructive">
          {count} {label} {count === 1 ? "is" : "are"} inactive due to a plan downgrade
        </p>
        <p className="text-sm text-destructive/80 mt-1">
          Upgrade your plan within 3 months to restore them, or they will be permanently deleted on <strong>{deletionDate}</strong>.
        </p>
      </div>
    </div>
  );
};

export default DowngradedListingsBanner;
