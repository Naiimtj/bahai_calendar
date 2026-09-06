const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_MAX_PER_DAY = 4;

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

/** A personal event whose span covers more than a single day. */
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

function isSameBadiMonth(cell, badi) {
  return cell?.badi?.month === badi?.month && cell?.badi?.year === badi?.year;
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

/**
 * Assigns every event of the week to a lane (row): Bahá'í events always take
 * the top reserved lane(s); multi-day events render as continuous bars aligned
 * across their span one lane below the Bahá'í lanes; remaining single-day
 * personal events fill the lanes beneath. Returns the lane grid and per-column
 * event count.
 */
function buildLaneGrid(cells, getCellEvents, columnCount) {
  const barSegments = new Map();
  const bahaiByColumn = Array.from({ length: columnCount }, () => []);
  const personalByColumn = Array.from({ length: columnCount }, () => []);

  for (let column = 0; column < columnCount; column++) {
    const cell = cells[column];
    if (!cell) continue;
    getCellEvents(cell).forEach((event) => {
      if (isMultiDayPersonalEvent(event)) {
        const key = eventKey(event);
        const existing = barSegments.get(key);
        if (existing) existing.lastColumn = column;
        else
          barSegments.set(key, {
            key,
            event,
            firstColumn: column,
            lastColumn: column,
          });
      } else if (event._raw) {
        personalByColumn[column].push(event);
      } else {
        // No `_raw` → Bahá'í event (holy day, feast, Riḍván).
        bahaiByColumn[column].push(event);
      }
    });
  }

  // Top lanes reserved for Bahá'í events across the whole week, so multi-day
  // bars stay aligned one lane below them on every day.
  const reservedLanes = bahaiByColumn.reduce(
    (max, list) => Math.max(max, list.length),
    0,
  );

  const bars = [...barSegments.values()].sort(
    (a, b) =>
      a.firstColumn - b.firstColumn ||
      b.lastColumn - b.firstColumn - (a.lastColumn - a.firstColumn),
  );

  const lanes = [];
  const laneRow = (lane) => {
    if (!lanes[lane]) lanes[lane] = new Array(columnCount).fill(null);
    return lanes[lane];
  };
  const laneIsFree = (lane, from, to) => {
    const row = lanes[lane];
    if (!row) return true;
    for (let c = from; c <= to; c++) if (row[c]) return false;
    return true;
  };
  const placeItem = (lane, from, to, item) => {
    const row = laneRow(lane);
    for (let c = from; c <= to; c++) row[c] = item;
  };

  // 1. Bahá'í events fill the reserved top lanes (one per lane, per column).
  bahaiByColumn.forEach((events, column) => {
    events.forEach((event, index) => {
      placeItem(index, column, column, {
        key: `bahai-${column}-${index}-${event.name}`,
        event,
        firstColumn: column,
        lastColumn: column,
        type: 'single',
      });
    });
  });

  // 2. Multi-day bars below the reserved lanes, aligned across their span.
  bars.forEach((segment) => {
    let lane = reservedLanes;
    while (!laneIsFree(lane, segment.firstColumn, segment.lastColumn)) lane++;
    placeItem(lane, segment.firstColumn, segment.lastColumn, {
      ...segment,
      type: 'bar',
    });
  });

  // 3. Remaining single-day personal events fill the lowest free lane below
  //    the reserved Bahá'í lanes.
  personalByColumn.forEach((events, column) => {
    events.forEach((event, index) => {
      let lane = reservedLanes;
      while (!laneIsFree(lane, column, column)) lane++;
      placeItem(lane, column, column, {
        key: `single-${column}-${index}-${event.name}`,
        event,
        firstColumn: column,
        lastColumn: column,
        type: 'single',
      });
    });
  });

  const occupied = Array.from({ length: columnCount }, (_, column) =>
    lanes.reduce((count, row) => count + (row[column] ? 1 : 0), 0),
  );

  return { lanes, occupied };
}

/** Resolves the chip color styling, matching CellEventDetails' behaviour:
 *  hex colors → translucent background + colored text; Tailwind class colors
 *  (Bahá'í events) → solid background + white text. */
function chipColor(color) {
  if (color?.startsWith('#')) {
    return {
      style: { backgroundColor: hexWithAlpha(color, 0.3), color },
      className: '',
    };
  }
  if (color) return { style: undefined, className: `${color} text-white` };
  return {
    style: undefined,
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200',
  };
}

function EventChip({ item, visibleStartColumn, visibleColumnCount }) {
  const relativeStart = item.firstColumn - visibleStartColumn;
  const clampedLast = Math.min(
    item.lastColumn,
    visibleStartColumn + visibleColumnCount - 1,
  );
  const span = clampedLast - Math.max(item.firstColumn, visibleStartColumn) + 1;
  const { style, className } = chipColor(item.event.color);
  return (
    <span
      style={style}
      className={`${START_COLUMN_CLASSES[relativeStart + 1]} ${SPAN_COLUMN_CLASSES[span]} ${className} min-w-0 truncate rounded-sm px-1 text-[10px] font-medium leading-tight`}
    >
      {item.event.name}
    </span>
  );
}

export default function WeekEventLanes({
  cells,
  getCellEvents,
  getCellDate,
  maxPerDay = DEFAULT_MAX_PER_DAY,
  visibleStartColumn = 0,
  visibleColumnCount = 7,
  selectedBadi,
  getBadiForDate,
  showBadiMonthBorders = false,
  onColumnClick,
  laneDayClassName = '',
  className = '',
}) {
  const { lanes, occupied } = buildLaneGrid(cells, getCellEvents, cells.length);
  const laneCount = lanes.length;
  const hasOverflow = occupied.some((count) => count > maxPerDay);
  const eventRows = hasOverflow
    ? maxPerDay - 1
    : Math.min(laneCount, maxPerDay);

  if (laneCount === 0 && !showBadiMonthBorders) return null;

  const gridColsClass = GRID_COLUMN_CLASSES[visibleColumnCount];
  const inRange = (column) =>
    column >= visibleStartColumn &&
    column < visibleStartColumn + visibleColumnCount;

  const handleLaneClick = (event) => {
    if (!onColumnClick || visibleColumnCount <= 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return;
    const relativeX = Math.min(
      Math.max(event.clientX - rect.left, 0),
      rect.width - 1,
    );
    const columnOffset = Math.floor(
      (relativeX / rect.width) * visibleColumnCount,
    );
    const column = visibleStartColumn + columnOffset;
    const cell = cells[column];
    if (!cell) return;
    onColumnClick(cell, column);
  };

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

  const laneBackgroundCells = laneDayClassName
    ? Array.from({ length: visibleColumnCount }, (_, i) => {
        const column = visibleStartColumn + i;
        if (!cells[column]) return <div key={`bg-${i}`} />;
        return <div key={`bg-${i}`} className={laneDayClassName} />;
      })
    : null;

  return (
    <div
      onClick={handleLaneClick}
      className={`relative flex flex-col gap-y-0.5 px-0.5 pb-0.5 ${className}`}
    >
      {laneBackgroundCells && (
        <div
          className={`pointer-events-none absolute inset-0 grid ${gridColsClass}`}
        >
          {laneBackgroundCells}
        </div>
      )}

      {borderCells && (
        <div
          className={`pointer-events-none absolute inset-0 grid ${gridColsClass}`}
        >
          {borderCells}
        </div>
      )}

      {Array.from({ length: eventRows }, (_, row) => {
        const laneRow = lanes[row] || [];
        const seen = new Set();
        const chips = [];
        for (const item of laneRow) {
          if (!item || seen.has(item)) continue;
          seen.add(item);
          if (!inRange(item.firstColumn) && !inRange(item.lastColumn)) continue;
          chips.push(
            <EventChip
              key={item.key}
              item={item}
              visibleStartColumn={visibleStartColumn}
              visibleColumnCount={visibleColumnCount}
            />,
          );
        }
        return (
          <div key={`row-${row}`} className={`grid ${gridColsClass} gap-x-0.5`}>
            {chips}
          </div>
        );
      })}

      {hasOverflow && (
        <div className={`grid ${gridColsClass} gap-x-0.5`}>
          {Array.from({ length: visibleColumnCount }, (_, i) => {
            const column = visibleStartColumn + i;
            let renderedInColumn = 0;
            for (let row = 0; row < eventRows; row++) {
              if (lanes[row]?.[column]) renderedInColumn++;
            }
            const hidden = occupied[column] - renderedInColumn;
            if (hidden <= 0) return <div key={`more-${i}`} />;
            return (
              <span
                key={`more-${i}`}
                className={`${START_COLUMN_CLASSES[i + 1]} px-1 text-[9px] font-medium leading-tight text-gray-500 dark:text-gray-400`}
              >
                +{hidden}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
