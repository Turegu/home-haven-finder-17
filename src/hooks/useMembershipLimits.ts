import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MembershipLimits {
  max_properties: number;
  max_projects: number;
  max_events: number;
  max_agents: number;
}

interface MembershipUsage {
  properties: number;
  projects: number;
  events: number;
  agents: number;
}

interface UseMembershipLimitsReturn {
  limits: MembershipLimits | null;
  usage: MembershipUsage;
  membership: string;
  loading: boolean;
  canCreate: (type: "properties" | "projects" | "events" | "agents") => boolean;
  remainingSlots: (type: "properties" | "projects" | "events" | "agents") => number;
  refresh: () => Promise<void>;
}

const DEFAULT_LIMITS: Record<string, MembershipLimits> = {
  basic: { max_properties: 1, max_projects: 1, max_events: 1, max_agents: 1 },
  lite: { max_properties: 2, max_projects: 2, max_events: 2, max_agents: 2 },
  plus: { max_properties: 3, max_projects: 3, max_events: 3, max_agents: 3 },
  pro: { max_properties: 60, max_projects: 60, max_events: 60, max_agents: 1000 },
};

export function useMembershipLimits(companyId: string | null): UseMembershipLimitsReturn {
  const [limits, setLimits] = useState<MembershipLimits | null>(null);
  const [usage, setUsage] = useState<MembershipUsage>({ properties: 0, projects: 0, events: 0, agents: 0 });
  const [membership, setMembership] = useState("basic");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!companyId) return;
    setLoading(true);

    // Get company membership
    const { data: company } = await supabase
      .from("companies")
      .select("membership")
      .eq("id", companyId)
      .maybeSingle();

    const mem = company?.membership || "basic";
    setMembership(mem);

    // Get limits from membership_packages
    const { data: pkg } = await supabase
      .from("membership_packages")
      .select("max_properties, max_projects, max_events, max_agents")
      .eq("package_type", mem)
      .maybeSingle();

    setLimits(pkg || DEFAULT_LIMITS[mem] || DEFAULT_LIMITS.basic);

    // Count active + draft listings (not inactive)
    const [propRes, projRes, evtRes, agentRes] = await Promise.all([
      supabase.from("properties").select("id", { count: "exact", head: true }).eq("company_id", companyId).in("status", ["active", "draft"]),
      supabase.from("projects").select("id", { count: "exact", head: true }).eq("company_id", companyId).in("status", ["active", "draft"]),
      supabase.from("events").select("id", { count: "exact", head: true }).eq("company_id", companyId).in("status", ["active", "draft"]),
      supabase.from("agents").select("id", { count: "exact", head: true }).eq("company_id", companyId).in("status", ["active", "pending"]),
    ]);

    setUsage({
      properties: propRes.count || 0,
      projects: projRes.count || 0,
      events: evtRes.count || 0,
      agents: agentRes.count || 0,
    });

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const effectiveLimits = limits || DEFAULT_LIMITS[membership] || DEFAULT_LIMITS.basic;

  const canCreate = (type: "properties" | "projects" | "events" | "agents") => {
    const maxKey = `max_${type}` as keyof MembershipLimits;
    return usage[type] < effectiveLimits[maxKey];
  };

  const remainingSlots = (type: "properties" | "projects" | "events" | "agents") => {
    const maxKey = `max_${type}` as keyof MembershipLimits;
    return Math.max(0, effectiveLimits[maxKey] - usage[type]);
  };

  return { limits, usage, membership, loading, canCreate, remainingSlots, refresh: fetchData };
}
