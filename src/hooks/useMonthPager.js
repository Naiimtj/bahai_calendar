import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

const AXIS_LOCK_PX = 10;
const MIN_FLICK_PX = 25;
const VELOCITY_WINDOW_MS = 100;
const DECELERATION_RATE = 0.998;
const INSTANT_SWIPE_PX = 50;
const SETTLE_MS = 300;
const SETTLE_EASING = 'cubic-bezier(0.32, 0.72, 0, 1)';

/** Finger velocity (px/ms) over the last 100 ms; 0 when the finger rested before release. */
export function getReleaseVelocity(samples, now) {
  const recent = samples.filter(
    (sample) => now - sample.t <= VELOCITY_WINDOW_MS,
  );
  if (recent.length < 2) return 0;
  const first = recent[0];
  const last = recent[recent.length - 1];
  return last.t > first.t ? (last.x - first.x) / (last.t - first.t) : 0;
}

/** 1 = next month, -1 = previous, 0 = stay; projects the flick like iOS scroll deceleration. */
export function getPageDirection(offset, velocity, width) {
  const projected =
    offset + (velocity * DECELERATION_RATE) / (1 - DECELERATION_RATE);
  if (projected <= -width / 2) return 1;
  if (projected >= width / 2) return -1;
  return 0;
}

function readTranslateX(element) {
  return new DOMMatrixReadOnly(getComputedStyle(element).transform).m41;
}

export function useMonthPager({ onPrev, onNext }) {
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const [paging, setPaging] = useState(false);
  const callbacksRef = useRef({ onPrev, onNext });

  useLayoutEffect(() => {
    callbacksRef.current = { onPrev, onNext };
  });

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    let gesture = null;
    let offset = 0;
    let animation = null;
    let suppressClick = false;

    // Imperative transform: 1:1 finger tracking can't wait for React renders.
    const setOffset = (x) => {
      offset = x;
      track.style.transform = x ? `translate3d(${x}px, 0, 0)` : '';
    };

    const settle = (from) => {
      setOffset(0);
      if (!from) {
        setPaging(false);
        return;
      }
      animation = track.animate(
        [
          { transform: `translate3d(${from}px, 0, 0)` },
          { transform: 'translate3d(0, 0, 0)' },
        ],
        { duration: SETTLE_MS, easing: SETTLE_EASING },
      );
      animation.onfinish = () => {
        animation = null;
        setPaging(false);
      };
    };

    const cancelGesture = () => {
      if (!gesture) return;
      gesture = null;
      if (!animation) settle(offset);
    };

    const handleTouchStart = (event) => {
      suppressClick = false;
      if (event.touches.length > 1) {
        cancelGesture();
        return;
      }
      const interrupted = animation !== null;
      if (interrupted) {
        // Grab the month mid-flight from its on-screen position.
        const liveOffset = readTranslateX(track);
        animation.cancel();
        animation = null;
        setOffset(liveOffset);
      }
      const touch = event.touches[0];
      gesture = {
        startX: touch.clientX,
        startY: touch.clientY,
        baseOffset: offset,
        axis: null,
        interrupted,
        reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        samples: [{ x: touch.clientX, t: event.timeStamp }],
      };
    };

    const handleTouchMove = (event) => {
      if (!gesture) return;
      const touch = event.touches[0];
      const dx = touch.clientX - gesture.startX;
      const dy = touch.clientY - gesture.startY;
      if (!gesture.axis) {
        if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) return;
        gesture.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (gesture.axis === 'y') {
          if (offset !== 0) settle(offset);
          return;
        }
        if (!gesture.reduced) setPaging(true);
      }
      if (gesture.axis !== 'x') return;
      if (event.cancelable) event.preventDefault();
      gesture.samples.push({ x: touch.clientX, t: event.timeStamp });
      while (event.timeStamp - gesture.samples[0].t > VELOCITY_WINDOW_MS)
        gesture.samples.shift();
      if (gesture.reduced) return;
      const width = track.offsetWidth;
      setOffset(Math.max(-width, Math.min(width, gesture.baseOffset + dx)));
    };

    const handleTouchEnd = (event) => {
      if (!gesture) return;
      const finished = gesture;
      gesture = null;
      if (finished.axis !== 'x') {
        // A tap that stops a settling month must not also select a day.
        if (finished.interrupted) suppressClick = true;
        if (!animation) settle(offset);
        return;
      }
      suppressClick = true;
      const touch = event.changedTouches[0];
      if (finished.reduced) {
        const dx = touch.clientX - finished.startX;
        if (Math.abs(dx) > INSTANT_SWIPE_PX) {
          if (dx < 0) callbacksRef.current.onNext();
          else callbacksRef.current.onPrev();
        }
        return;
      }
      finished.samples.push({ x: touch.clientX, t: event.timeStamp });
      const width = track.offsetWidth;
      // Jittery taps that barely cross the axis lock must not throw the month.
      const velocity =
        Math.abs(touch.clientX - finished.startX) < MIN_FLICK_PX
          ? 0
          : getReleaseVelocity(finished.samples, event.timeStamp);
      const direction = getPageDirection(offset, velocity, width);
      let from = offset;
      if (direction !== 0) {
        // Commit on release so the header and taps already belong to the new month.
        flushSync(() => {
          setPaging(true);
          if (direction > 0) callbacksRef.current.onNext();
          else callbacksRef.current.onPrev();
        });
        from = offset + direction * width;
      }
      settle(from);
    };

    const handleClickCapture = (event) => {
      if (!suppressClick) return;
      suppressClick = false;
      event.preventDefault();
      event.stopPropagation();
    };

    viewport.addEventListener('touchstart', handleTouchStart, {
      passive: true,
    });
    viewport.addEventListener('touchmove', handleTouchMove, { passive: false });
    viewport.addEventListener('touchend', handleTouchEnd);
    viewport.addEventListener('touchcancel', cancelGesture);
    viewport.addEventListener('click', handleClickCapture, true);
    return () => {
      viewport.removeEventListener('touchstart', handleTouchStart);
      viewport.removeEventListener('touchmove', handleTouchMove);
      viewport.removeEventListener('touchend', handleTouchEnd);
      viewport.removeEventListener('touchcancel', cancelGesture);
      viewport.removeEventListener('click', handleClickCapture, true);
      animation?.cancel();
    };
  }, []);

  return { viewportRef, trackRef, paging };
}
