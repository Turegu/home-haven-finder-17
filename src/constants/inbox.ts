export const INBOX_TYPES = {
  INQUIRY: 'inquiry',
  MESSAGE: 'message',
  PROPERTY_REQUEST: 'property_request',
} as const;
export type InboxType = typeof INBOX_TYPES[keyof typeof INBOX_TYPES];
