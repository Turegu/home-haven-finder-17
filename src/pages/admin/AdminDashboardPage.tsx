import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Building2, Home, FolderKanban, CalendarDays, Briefcase, Zap, Star, Crown } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Stats {
  totalCompanies: number;
  basicCompanies: number;
  liteCompanies: number;
  plusCompanies: number;
  proCompanies: number;
}

const AdminDashboardPage = () => {
  const [stats, setStats] = useState<Stats>({
    totalCompanies: 0, basicCompanies: 0, liteCompanies: 0, plusCompanies: 0, proCompanies: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const { data: companies } = await supabase.from("companies").select("membership");
      if (companies) {
        setStats({
          totalCompanies: companies.length,
          basicCompanies: companies.filter(c => c.membership === "basic").length,
          liteCompanies: companies.filter(c => c.membership === "lite").length,
          plusCompanies: companies.filter(c => c.membership === "plus").length,
          proCompanies: companies.filter(c => c.membership === "pro").length,
        });
      }
    };
    fetchStats();
  }, []);

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
          <div key={card.label} className={`rounded-xl bg-gradient-to-br ${card.gradient} p-6 text-white shadow-lg`}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-4xl font-bold">{card.count}</p>
                <p className="text-sm font-medium text-white/80 mt-1">{card.label}</p>
              </div>
              <div className={`${card.iconBg} rounded-xl p-3`}>
                <card.icon className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-white/70">
                <span>Premium Listing</span>
                <span>0%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/20">
                <div className="h-full rounded-full bg-white/60" style={{ width: "0%" }} />
              </div>
              <div className="flex items-center justify-between text-xs text-white/70">
                <span>Featured Listing</span>
                <span>0%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/20">
                <div className="h-full rounded-full bg-white/60" style={{ width: "0%" }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Membership cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {membershipCards.map((card) => (
          <div key={card.label} className={`rounded-xl bg-gradient-to-br ${card.gradient} overflow-hidden shadow-lg text-white`}>
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between">
                <p className="text-5xl font-bold">{card.count}</p>
                <div className="bg-white/15 rounded-xl p-2.5">
                  <card.icon className="h-7 w-7 text-white" />
                </div>
              </div>
              <p className="text-sm font-medium text-white/75 mt-2">Companies</p>
            </div>
            <div className="bg-black/15 text-center py-2.5 text-sm font-semibold tracking-wide">
              {card.label} Members
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
