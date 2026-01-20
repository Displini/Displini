import React from 'react';
import { TimelineBounds } from '../utils/timelineCalculations';

interface TimelineBarProps {
  bounds: TimelineBounds;
  timelineHeight: number;
  startPx?: number;
  endPx?: number;
}

export function TimelineBar({ timelineHeight, startPx = 0, endPx }: TimelineBarProps) {
  const top = Math.max(0, (startPx ?? 0) - 8);
  const bottom = (endPx ?? timelineHeight) + 8;
  const height = Math.max(8, bottom - top);

  return (
    <div
      className="absolute w-2 left-0"
      style={{
        top: `${top}px`,
        height: `${height}px`,
        backgroundColor: 'hsl(var(--muted))',
        borderRadius: '999px',
        zIndex: 0,
      }}
    />
  );
}

