import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Building2, Home, FolderKanban, CalendarDays, Users } from "lucide-react";
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
    { label: "Properties", count: 0, icon: Home, color: "bg-amber-50 border-amber-200", iconColor: "text-amber-600" },
    { label: "Projects", count: 0, icon: FolderKanban, color: "bg-yellow-50 border-yellow-200", iconColor: "text-yellow-600" },
    { label: "Events", count: 0, icon: CalendarDays, color: "bg-emerald-50 border-emerald-200", iconColor: "text-emerald-600" },
  ];

  const membershipCards = [
    { label: "Basic members", count: stats.basicCompanies, color: "bg-lime-50 border-lime-200", barColor: "bg-lime-500" },
    { label: "Lite members", count: stats.liteCompanies, color: "bg-purple-50 border-purple-200", barColor: "bg-purple-500" },
    { label: "Plus members", count: stats.plusCompanies, color: "bg-orange-50 border-orange-200", barColor: "bg-orange-500" },
    { label: "Pro members", count: stats.proCompanies, color: "bg-emerald-50 border-emerald-200", barColor: "bg-emerald-500" },
  ];

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">Dashboard</h1>

      {/* Top summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {summaryCards.map((card) => (
          <div key={card.label} className={`rounded-xl border p-6 ${card.color}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-3xl font-bold text-foreground">{card.count}</p>
                <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
              </div>
              <card.icon className={`h-10 w-10 ${card.iconColor}`} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Premium Listing</span>
                <span>0%</span>
              </div>
              <Progress value={0} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Featured Listing</span>
                <span>0%</span>
              </div>
              <Progress value={0} className="h-2" />
            </div>
          </div>
        ))}
      </div>

      {/* Membership cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {membershipCards.map((card) => (
          <div key={card.label} className={`rounded-xl border overflow-hidden ${card.color}`}>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-4xl font-bold text-foreground">{card.count}</p>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mt-1">Companies</p>
            </div>
            <div className={`${card.barColor} text-white text-center py-2 text-sm font-medium`}>
              {card.label}
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
