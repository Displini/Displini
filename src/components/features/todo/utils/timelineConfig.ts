export const TIMELINE_PADDING_MINUTES = 30; // padding before/after tasks
export const MIN_RANGE_MINUTES = 60;        // minimum range to render
export const MIN_GAP_PERCENT = 8;           // gap between groups to avoid visual overlap
export const FREE_GAP_MINUTES = 60;         // minimum gap to show free-time block

export const HEIGHT_BUCKETS = [
  { maxMinutes: 60, heightPx: 64 },
  { maxMinutes: 120, heightPx: 96 },
  { maxMinutes: 180, heightPx: 128 },
  { maxMinutes: Infinity, heightPx: 160 },
];

