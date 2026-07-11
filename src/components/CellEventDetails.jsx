import { useRef, useEffect, useState, useCallback } from 'react';

const FADE_MASK = 'linear-gradient(to right, black 80%, transparent 100%)';

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
}) {
  if (!events || events.length === 0) return null;

  return (
    <div className="flex flex-col gap-0.5 mt-0.5 w-full px-0.5 overflow-hidden">
      {events.slice(0, maxVisible).map((ev, i) => (
        <FadingLabel
          key={i}
          color={ev.color}
          className="text-[10px] leading-tight rounded-sm px-0.5 text-white"
        >
          {ev.name}
        </FadingLabel>
      ))}
      {events.length > maxVisible && (
        <span
          className="text-[8px] leading-tight text-gray-400 dark:text-gray-500"
        >
          +{events.length - maxVisible}
        </span>
      )}
    </div>
  );
}
