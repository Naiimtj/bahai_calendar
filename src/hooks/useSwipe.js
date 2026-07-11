import { useRef, useCallback } from 'react';

/**
 * Returns touch handlers for horizontal swipe detection.
 * onSwipeLeft  → e.g. next month
 * onSwipeRight → e.g. prev month
 */
export function useSwipe(onSwipeLeft, onSwipeRight, threshold = 50) {
  const startX = useRef(0);
  const startY = useRef(0);

  const onTouchStart = useCallback((e) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback(
    (e) => {
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = e.changedTouches[0].clientY - startY.current;
      // Only trigger if horizontal swipe is dominant
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
        if (dx < 0) onSwipeLeft?.();
        else onSwipeRight?.();
      }
    },
    [onSwipeLeft, onSwipeRight, threshold],
  );

  return { onTouchStart, onTouchEnd };
}
