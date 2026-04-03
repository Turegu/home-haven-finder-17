import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Home, FolderKanban, CalendarDays, Briefcase, Zap, Star, Crown } from "lucide-react";

const AdminDashboardPage = () => {
  const { data: stats = { totalCompanies: 0, basicCompanies: 0, liteCompanies: 0, plusCompanies: 0, proCompanies: 0 } } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const { data: companies } = await supabase.from("companies").select("membership");
      if (!companies) return { totalCompanies: 0, basicCompanies: 0, liteCompanies: 0, plusCompanies: 0, proCompanies: 0 };
      return {
        totalCompanies: companies.length,
        basicCompanies: companies.filter(c => c.membership === "basic").length,
        liteCompanies: companies.filter(c => c.membership === "lite").length,
        plusCompanies: companies.filter(c => c.membership === "plus").length,
        proCompanies: companies.filter(c => c.membership === "pro").length,
      };
    },
    staleTime: 30_000,
  });

  const summaryCards = [
    { label: "Properties", count: 0, icon: Home, bg: "bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800", iconColor: "text-sky-600 dark:text-sky-400", barBg: "bg-sky-200 dark:bg-sky-800", barFill: "bg-sky-500" },
    { label: "Projects", count: 0, icon: FolderKanban, bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800", iconColor: "text-amber-600 dark:text-amber-400", barBg: "bg-amber-200 dark:bg-amber-800", barFill: "bg-amber-500" },
    { label: "Events", count: 0, icon: CalendarDays, bg: "bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800", iconColor: "text-teal-600 dark:text-teal-400", barBg: "bg-teal-200 dark:bg-teal-800", barFill: "bg-teal-500" },
  ];

  const membershipCards = [
    { label: "Basic", count: stats.basicCompanies, icon: Briefcase, bg: "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700", iconColor: "text-slate-500", barBg: "bg-slate-500" },
    { label: "Lite", count: stats.liteCompanies, icon: Zap, bg: "bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800", iconColor: "text-violet-500", barBg: "bg-violet-500" },
    { label: "Plus", count: stats.plusCompanies, icon: Star, bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800", iconColor: "text-amber-500", barBg: "bg-amber-500" },
    { label: "Pro", count: stats.proCompanies, icon: Crown, bg: "bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800", iconColor: "text-teal-500", barBg: "bg-teal-500" },
  ];

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">Dashboard</h1>

      {/* Top summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {summaryCards.map((card) => (
          <div key={card.label} className={`rounded-xl border p-6 ${card.bg}`}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-4xl font-bold text-foreground">{card.count}</p>
                <p className="text-sm font-medium text-muted-foreground mt-1">{card.label}</p>
              </div>
              <card.icon className={`h-9 w-9 ${card.iconColor}`} />
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Premium Listing</span><span>0%</span>
              </div>
              <div className={`h-1.5 rounded-full ${card.barBg}`}>
                <div className={`h-full rounded-full ${card.barFill}`} style={{ width: "0%" }} />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Featured Listing</span><span>0%</span>
              </div>
              <div className={`h-1.5 rounded-full ${card.barBg}`}>
                <div className={`h-full rounded-full ${card.barFill}`} style={{ width: "0%" }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Membership cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {membershipCards.map((card) => (
          <div key={card.label} className={`rounded-xl border overflow-hidden ${card.bg}`}>
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between">
                <p className="text-5xl font-bold text-foreground">{card.count}</p>
                <card.icon className={`h-8 w-8 ${card.iconColor}`} />
              </div>
              <p className="text-sm font-medium text-muted-foreground mt-2">Companies</p>
            </div>
            <div className={`${card.barBg} text-white text-center py-2.5 text-sm font-semibold`}>
              {card.label} Members
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
