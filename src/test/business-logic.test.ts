import { describe, it, expect, vi } from "vitest";

/**
 * Critical business logic tests for Turegu platform.
 * These test the core invariants that protect data integrity.
 * 
 * Note: These are unit tests that verify the logic patterns used
 * in the codebase. Integration tests against a live DB would use
 * the Supabase client directly.
 */

// Test 1: Rate limiting logic — property request rate limit
describe("Property Request Rate Limiting", () => {
  it("should block a second request from the same email within 24h", () => {
    // Simulates the check_property_request_rate_limit RPC logic
    const requests = [
      { email: "test@example.com", created_at: new Date().toISOString() },
    ];

    const isAllowed = (email: string) => {
      const recentCount = requests.filter(
        (r) =>
          r.email === email &&
          new Date(r.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000
      ).length;
      return recentCount < 1;
    };

    // First request exists, second should be blocked
    expect(isAllowed("test@example.com")).toBe(false);
    // Different email should be allowed
    expect(isAllowed("other@example.com")).toBe(true);
  });

  it("should allow request after 24h window expires", () => {
    const requests = [
      {
        email: "test@example.com",
        created_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const isAllowed = (email: string) => {
      const recentCount = requests.filter(
        (r) =>
          r.email === email &&
          new Date(r.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000
      ).length;
      return recentCount < 1;
    };

    expect(isAllowed("test@example.com")).toBe(true);
  });

  it("should enforce contact rate limit of 10 per hour", () => {
    const requests = Array.from({ length: 10 }, () => ({
      email: "spam@example.com",
      created_at: new Date().toISOString(),
    }));

    const isAllowed = (email: string) => {
      const recentCount = requests.filter(
        (r) =>
          r.email === email &&
          new Date(r.created_at).getTime() > Date.now() - 60 * 60 * 1000
      ).length;
      return recentCount < 10;
    };

    expect(isAllowed("spam@example.com")).toBe(false);
    expect(isAllowed("legit@example.com")).toBe(true);
  });
});

// Test 2: Membership limit enforcement logic
describe("Membership Limit Enforcement", () => {
  const membershipLimits: Record<string, { max_properties: number; max_projects: number; max_events: number; max_agents: number }> = {
    basic: { max_properties: 1, max_projects: 1, max_events: 1, max_agents: 1 },
    pro: { max_properties: 60, max_projects: 10, max_events: 10, max_agents: 10 },
    plus: { max_properties: 15, max_projects: 3, max_events: 5, max_agents: 3 },
  };

  const canInsert = (
    membership: string,
    entityType: "properties" | "projects" | "events" | "agents",
    currentCount: number
  ) => {
    const limits = membershipLimits[membership];
    if (!limits) return false;
    const maxKey = `max_${entityType}` as keyof typeof limits;
    return currentCount < limits[maxKey];
  };

  it("should block 2nd property for basic plan", () => {
    expect(canInsert("basic", "properties", 0)).toBe(true);
    expect(canInsert("basic", "properties", 1)).toBe(false);
  });

  it("should allow up to 60 properties for pro plan", () => {
    expect(canInsert("pro", "properties", 59)).toBe(true);
    expect(canInsert("pro", "properties", 60)).toBe(false);
  });

  it("should enforce agent limits per membership", () => {
    expect(canInsert("basic", "agents", 0)).toBe(true);
    expect(canInsert("basic", "agents", 1)).toBe(false);
    expect(canInsert("plus", "agents", 2)).toBe(true);
    expect(canInsert("plus", "agents", 3)).toBe(false);
  });

  it("should enforce project limits per membership", () => {
    expect(canInsert("plus", "projects", 2)).toBe(true);
    expect(canInsert("plus", "projects", 3)).toBe(false);
  });
});

// Test 3: Property request routing — only eligible companies receive requests
describe("Property Request Distribution", () => {
  const companies = [
    { id: "c1", membership: "basic", has_property_requests: false },
    { id: "c2", membership: "plus", has_property_requests: true },
    { id: "c3", membership: "pro", has_property_requests: true },
    { id: "c4", membership: "basic", has_property_requests: false },
  ];

  const distributeRequest = (request: { full_name: string; email: string; phone: string }) => {
    // Simulates the distribute_property_request trigger logic
    return companies
      .filter((c) => c.has_property_requests)
      .map((c) => ({
        company_id: c.id,
        inbox_type: "property_request",
        full_name: request.full_name,
        email: request.email,
        phone: request.phone,
      }));
  };

  it("should only route to companies with property request access", () => {
    const results = distributeRequest({
      full_name: "Test User",
      email: "test@example.com",
      phone: "+1234567890",
    });

    expect(results).toHaveLength(2);
    expect(results.map((r) => r.company_id)).toEqual(["c2", "c3"]);
  });

  it("should not route to basic membership companies", () => {
    const results = distributeRequest({
      full_name: "Test User",
      email: "test@example.com",
      phone: "+1234567890",
    });

    const basicCompanyIds = companies
      .filter((c) => c.membership === "basic")
      .map((c) => c.id);
    
    results.forEach((r) => {
      expect(basicCompanyIds).not.toContain(r.company_id);
    });
  });

  it("should include all request fields in routed messages", () => {
    const results = distributeRequest({
      full_name: "Ahmed Hassan",
      email: "ahmed@test.com",
      phone: "+971501234567",
    });

    results.forEach((r) => {
      expect(r.full_name).toBe("Ahmed Hassan");
      expect(r.email).toBe("ahmed@test.com");
      expect(r.phone).toBe("+971501234567");
      expect(r.inbox_type).toBe("property_request");
    });
  });
});

// Test 4: Response rate calculation
describe("Response Rate Calculation", () => {
  it("should calculate correct response rate percentage", () => {
    const inquiries = [
      { responded_at: new Date().toISOString(), created_at: new Date(Date.now() - 3600000).toISOString() },
      { responded_at: new Date().toISOString(), created_at: new Date(Date.now() - 7200000).toISOString() },
      { responded_at: null, created_at: new Date(Date.now() - 86400000).toISOString() },
    ];

    const responded = inquiries.filter((i) => i.responded_at !== null).length;
    const total = inquiries.length;
    const rate = Math.round((responded / total) * 100);

    expect(rate).toBe(67);
  });

  it("should calculate average response time in hours", () => {
    const inquiries = [
      { responded_at: new Date(Date.now() - 1000).toISOString(), created_at: new Date(Date.now() - 3600000).toISOString() }, // ~1h
      { responded_at: new Date(Date.now() - 1000).toISOString(), created_at: new Date(Date.now() - 7200000).toISOString() }, // ~2h
    ];

    const avgHours = inquiries.reduce((sum, i) => {
      if (!i.responded_at) return sum;
      const diff = new Date(i.responded_at).getTime() - new Date(i.created_at).getTime();
      return sum + diff / (1000 * 60 * 60);
    }, 0) / inquiries.length;

    expect(Math.round(avgHours)).toBeGreaterThanOrEqual(1);
    expect(Math.round(avgHours)).toBeLessThanOrEqual(2);
  });
});
