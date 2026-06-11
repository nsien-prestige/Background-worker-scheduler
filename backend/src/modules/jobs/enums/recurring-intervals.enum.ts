export const RECURRING_INTERVALS = [
  'every_1_minute',
  'every_5_minutes',
  'every_1_hour',
] as const;

export type RecurringInterval = typeof RECURRING_INTERVALS[number];