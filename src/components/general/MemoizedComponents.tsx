/**
 * Memoized Component Wrappers for Performance Optimization
 * 
 * These wrappers use React.memo to prevent unnecessary re-renders
 * of expensive child components.
 */

import { memo } from 'react';
import CircularProgress from './CircularProgress';
import { DateCarousel } from './DateCarousel';
import { ConfettiEffect } from './ConfettiEffect';

/**
 * Memoized CircularProgress - only re-renders when props change
 */
export const MemoizedCircularProgress = memo(CircularProgress, (prevProps, nextProps) => {
  return (
    prevProps.completed === nextProps.completed &&
    prevProps.total === nextProps.total &&
    prevProps.size === nextProps.size &&
    prevProps.strokeWidth === nextProps.strokeWidth
  );
});

MemoizedCircularProgress.displayName = 'MemoizedCircularProgress';

/**
 * Memoized DateCarousel - only re-renders when selected date changes
 */
export const MemoizedDateCarousel = memo(DateCarousel, (prevProps, nextProps) => {
  return (
    prevProps.selectedDate.getTime() === nextProps.selectedDate.getTime() &&
    prevProps.onDateChange === nextProps.onDateChange
  );
});

MemoizedDateCarousel.displayName = 'MemoizedDateCarousel';

/**
 * Memoized ConfettiEffect - only re-renders when trigger changes
 */
export const MemoizedConfettiEffect = memo(ConfettiEffect, (prevProps, nextProps) => {
  return (
    prevProps.trigger === nextProps.trigger &&
    prevProps.onComplete === nextProps.onComplete
  );
});

MemoizedConfettiEffect.displayName = 'MemoizedConfettiEffect';

