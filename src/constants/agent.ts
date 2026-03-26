export const AGENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DEACTIVATED: 'deactivated',
  PENDING: 'pending',
} as const;
export type AgentStatus = typeof AGENT_STATUS[keyof typeof AGENT_STATUS];
