import React from 'react';
import { TimelineBounds } from '../utils/timelineCalculations';

interface TimelineBarProps {
  bounds: TimelineBounds;
  timelineHeight: number;
  lastTaskEndTime?: number; // Last task end time in minutes to cap the timeline
}

export function TimelineBar({ bounds, timelineHeight, lastTaskEndTime }: TimelineBarProps) {
  // Timeline bar always shows full height (represents the full day range)
  // The fill and current time indicator will handle capping at last task end time
  return (
    <div
      className="absolute w-2 left-0"
      style={{
        top: '0',
        height: `${timelineHeight}px`,
        backgroundColor: 'hsl(var(--muted))',
        borderRadius: '0',
        zIndex: 0,
      }}
    />
  );
}

