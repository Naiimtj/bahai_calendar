const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const MAX_VISIBLE_EVENTS = 2;

const START_COLUMN_CLASSES = [
  '',
  'col-start-1',
  'col-start-2',
  'col-start-3',
  'col-start-4',
  'col-start-5',
  'col-start-6',
  'col-start-7',
];

const SPAN_COLUMN_CLASSES = [
  '',
  'col-span-1',
  'col-span-2',
  'col-span-3',
  'col-span-4',
  'col-span-5',
  'col-span-6',
  'col-span-7',
];

const GRID_COLUMN_CLASSES = [
  '',
  'grid-cols-1',
  'grid-cols-2',
  'grid-cols-3',
  'grid-cols-4',
  'grid-cols-5',
  'grid-cols-6',
  'grid-cols-7',
];

const COLOR_CLASSES = {
  '#ef4444': 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300',
  '#f97316':
    'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300',
  '#eab308':
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-300',
  '#84cc16': 'bg-lime-100 text-lime-700 dark:bg-lime-950/50 dark:text-lime-300',
  '#06b6d4': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300',
  '#3b82f6': 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
  '#6366f1':
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300',
  '#d946ef':
    'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/50 dark:text-fuchsia-300',
  '#ec4899': 'bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300',
};

function isMultiDayPersonalEvent(event) {
  const raw = event._raw;
  return (
    raw?.start &&
    raw?.end &&
    raw.end.getTime() - raw.start.getTime() > ONE_DAY_MS
  );
}

/** Builds a #rrggbbaa hex string from a #rgb/#rrggbb color and an alpha 0..1. */
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

function eventKey(event) {
  const raw = event._raw;
  return `${raw?.sourceType || ''}-${raw?.id || ''}-${raw?.start?.getTime() || ''}-${raw?.end?.getTime() || ''}-${event.name}`;
}

function isSameBadiMonth(firstCell, secondBadi) {
  return (
    firstCell?.badi?.month === secondBadi?.month &&
    firstCell?.badi?.year === secondBadi?.year
  );
}

function getBadiMonthEdges(cells, column, getCellDate, getBadiForDate) {
  const cell = cells[column];
  if (!cell?.badi) return { isFirstInGroup: false, isLastInGroup: false };

  const nextCell = cells[column + 1];
  const dayAfter = new Date(getCellDate(cell));
  dayAfter.setDate(dayAfter.getDate() + 1);
  const nextBadi = nextCell?.badi ?? getBadiForDate?.(dayAfter);

  return {
    isFirstInGroup: cell.badi.day === 1,
    isLastInGroup: !isSameBadiMonth(cell, nextBadi),
  };
}

function getWeekSegments(cells, getCellDate, eventsForDate) {
  const segments = new Map();

  cells.forEach((cell, column) => {
    if (!cell) return;
    eventsForDate(getCellDate(cell)).forEach((event) => {
      // Single-day events are rendered inside their day cell; the week row is
      // reserved for multi-day events shown as spanning bars.
      if (!isMultiDayPersonalEvent(event)) return;
      const key = eventKey(event);
      const segment = segments.get(key);
      if (segment) {
        segment.lastColumn = column;
        return;
      }
      segments.set(key, { event, firstColumn: column, lastColumn: column });
    });
  });

  return [...segments.values()].sort((a, b) => {
    const aDuration = a.event._raw.end.getTime() - a.event._raw.start.getTime();
    const bDuration = b.event._raw.end.getTime() - b.event._raw.start.getTime();
    const durationDifference = bDuration - aDuration;
    if (durationDifference !== 0) return durationDifference;
    return a.firstColumn - b.firstColumn;
  });
}

export default function WeekEventDetails({
  cells,
  getCellDate,
  eventsForDate,
  visibleStartColumn = 0,
  visibleColumnCount = 7,
  selectedBadi,
  getBadiForDate,
  showBadiMonthBorders = false,
  className = '',
}) {
  const segments = getWeekSegments(cells, getCellDate, eventsForDate);
  if (segments.length === 0 && !showBadiMonthBorders) return null;
  const visibleSegments = segments.slice(0, MAX_VISIBLE_EVENTS);
  const hiddenEventCount = segments.length - visibleSegments.length;
  const firstHiddenSegment = segments[MAX_VISIBLE_EVENTS];
  const hiddenEventsStartColumn = firstHiddenSegment
    ? firstHiddenSegment.firstColumn - visibleStartColumn
    : 0;
  const borderCells = showBadiMonthBorders
    ? Array.from({ length: visibleColumnCount }, (_, i) => {
        const column = visibleStartColumn + i;
        const cell = cells[column];
        if (!cell?.badi) return <div key={`border-${i}`} />;
        const { isFirstInGroup, isLastInGroup } = getBadiMonthEdges(
          cells,
          column,
          getCellDate,
          getBadiForDate,
        );
        const isSelectedBadiMonth =
          cell.badi.month === selectedBadi?.month &&
          cell.badi.year === selectedBadi?.year;
        const borderClass = [
          'border-b',
          isSelectedBadiMonth
            ? 'border-primary'
            : 'border-gray-300 dark:border-gray-600',
          isFirstInGroup ? 'border-l rounded-bl-lg' : '',
          isLastInGroup ? 'border-r rounded-br-lg' : '',
        ]
          .filter(Boolean)
          .join(' ');
        return <div key={`border-${i}`} className={borderClass} />;
      })
    : null;

  return (
    <div
      className={`relative grid ${GRID_COLUMN_CLASSES[visibleColumnCount]} min-h-4 gap-y-0.5 px-0.5 pb-0.5 mb-[1px] ${className}`}
    >
      {borderCells && (
        <div
          className={`pointer-events-none absolute inset-0 grid ${GRID_COLUMN_CLASSES[visibleColumnCount]}`}
        >
          {borderCells}
        </div>
      )}
      {visibleSegments.map(({ event, firstColumn, lastColumn }) => {
        const relativeStartColumn = firstColumn - visibleStartColumn;
        const columnSpan = isMultiDayPersonalEvent(event)
          ? lastColumn - firstColumn + 1
          : 1;
        const isHex = event.color?.startsWith('#');
        const colorClass = isHex
          ? ''
          : COLOR_CLASSES[event.color?.toLowerCase()] ||
            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200';
        const hexStyle = isHex
          ? {
              backgroundColor: hexWithAlpha(event.color, 0.3),
              color: event.color,
            }
          : undefined;

        return (
          <span
            key={eventKey(event)}
            style={hexStyle}
            className={`${START_COLUMN_CLASSES[relativeStartColumn + 1]} ${SPAN_COLUMN_CLASSES[columnSpan]} ${colorClass} min-w-0 truncate rounded-sm px-1 text-[10px] font-medium leading-tight`}
          >
            {event.name}
          </span>
        );
      })}
      {hiddenEventCount > 0 && (
        <span
          className={`${START_COLUMN_CLASSES[hiddenEventsStartColumn + 1]} px-1 text-[9px] font-medium leading-tight text-gray-500 dark:text-gray-400`}
        >
          +{hiddenEventCount}
        </span>
      )}
    </div>
  );
}
