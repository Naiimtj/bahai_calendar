import { useRef, useEffect, useState, useCallback } from 'react';

const FADE_MASK = 'linear-gradient(to right, black 80%, transparent 100%)';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** A personal event whose span covers more than a single day (rendered as a
 *  spanning bar in the week row, not inside a day cell). */
function isMultiDayPersonalEvent(event) {
  const raw = event._raw;
  return (
    raw?.start &&
    raw?.end &&
    raw.end.getTime() - raw.start.getTime() > ONE_DAY_MS
  );
}

function hexWithAlpha(hex, alpha) {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${full}${a}`;
}

function FadingLabel({ className, color, children }) {
  const ref = useRef(null);
  const [overflows, setOverflows] = useState(false);

  const check = useCallback(() => {
    const el = ref.current;
    if (el) setOverflows(el.scrollWidth > el.clientWidth);
  }, []);

  useEffect(() => {
    check();
    const obs = new ResizeObserver(check);
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [check, children]);

  const isHex = color?.startsWith('#');
  const spanStyle = isHex
    ? { backgroundColor: hexWithAlpha(color, 0.3), color }
    : {};
  if (overflows) {
    spanStyle.maskImage = FADE_MASK;
    spanStyle.WebkitMaskImage = FADE_MASK;
  }

  return (
    <span
      ref={ref}
      className={`${className} ${
        isHex ? '' : color
      } whitespace-nowrap overflow-hidden`}
      style={spanStyle}
    >
      {children}
    </span>
  );
}

export default function CellEventDetails({
  events,
  maxVisible = 2,
  eventScope = 'all',
  reserveSpace = false,
}) {
  const visibleEvents = events.filter((event) => {
    if (eventScope === 'bahai') return !event._raw;
    if (eventScope === 'personal') return Boolean(event._raw);
    // 'cell': Bahá'í events + single-day personal events (multi-day events are
    // shown as spanning bars in the week row instead).
    if (eventScope === 'cell') return !isMultiDayPersonalEvent(event);
    return true;
  });

  if (!visibleEvents.length && !reserveSpace) return null;

  return (
    <div
      className={`flex flex-col gap-0.5 mt-0.5 w-full px-0.5 overflow-hidden ${
        reserveSpace ? 'min-h-4' : ''
      }`}
    >
      {visibleEvents.slice(0, maxVisible).map((ev, i) => (
        <FadingLabel
          key={i}
          color={ev.color}
          className="text-[10px] leading-tight rounded-sm px-0.5 text-white"
        >
          {ev.name}
        </FadingLabel>
      ))}
      {visibleEvents.length > maxVisible && (
        <span className="text-[8px] leading-tight text-gray-400 dark:text-gray-500">
          +{visibleEvents.length - maxVisible}
        </span>
      )}
    </div>
  );
}
