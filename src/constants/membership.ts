export const MEMBERSHIP_PLANS = {
  BASIC: 'basic',
  LITE: 'lite',
  PLUS: 'plus',
  PRO: 'pro',
} as const;
export type MembershipPlan = typeof MEMBERSHIP_PLANS[keyof typeof MEMBERSHIP_PLANS];
