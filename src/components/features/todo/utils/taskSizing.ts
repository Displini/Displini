import { HEIGHT_BUCKETS } from "./timelineConfig";

export function heightForDurationMinutes(minutes: number): number {
  for (const bucket of HEIGHT_BUCKETS) {
    if (minutes <= bucket.maxMinutes) return bucket.heightPx;
  }
  return HEIGHT_BUCKETS[HEIGHT_BUCKETS.length - 1]?.heightPx ?? 64;
}

