/**
 * Shared mini-month grid used by YearView (Gregorian) and BadiYearView (Badíʿ).
 *
 * Cell shape expected in `cells` array:
 *   { day: number, isToday: boolean, evStyle: { dot: string, text: string } | null,
 *     personalEventColors?: string[] }
 *   | null  (empty padding slot)
 */

/**
 * Returns the event color style for a given Gregorian date.
 * Priority: holy day > Riḍván period > 19-day feast.
 *
 * @param {Date} gregDate
 * @param {{ getHolyDayForDate, isRidvanPeriod, gregorianToBadi }} fns
 * @returns {{ dot: string, text: string } | null}
 */
export function getEventStyle(
  gregDate,
  { getHolyDayForDate, gregorianToBadi },
) {
  const holyDay = getHolyDayForDate ? getHolyDayForDate(gregDate) : null;
  if (holyDay)
    return {
      dot: 'bg-gold-500',
      text: 'text-gold-600 dark:text-gold-400 font-semibold',
    };
  const badi = gregorianToBadi ? gregorianToBadi(gregDate) : null;
  if (badi && badi.day === 1 && badi.month >= 1 && badi.month <= 19)
    return {
      dot: 'bg-blue-400',
      text: 'text-blue-500 dark:text-blue-400 font-semibold',
    };
  return null;
}

/**
 * Renders a 7-column mini calendar grid (weekday headers + day cells).
 *
 * @param {{ cells: Array, headers: string[], keyPrefix: string }} props
 */
export default function MiniMonthGrid({ cells, headers, keyPrefix = '' }) {
  return (
    <>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0 w-full">
        {headers.map((weekday, i) => (
          <div
            key={`${keyPrefix}hdr-${i}`}
            className="text-center lg:text-base md:text-base text-[10px] text-gray-400 dark:text-gray-600"
          >
            {weekday}
          </div>
        ))}
      </div>
      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0 w-full">
        {cells.map((cell, i) => (
          <div
            key={cell ? `${keyPrefix}d-${cell.day}` : `${keyPrefix}e-${i}`}
            className="flex flex-col items-center justify-center"
          >
            {cell && (
              <div className="flex flex-col items-center h-5.5 md:h-7">
                <span
                  className={`lg:text-lg md:text-sm text-[11px] !font-bold leading-none w-4.5 h-4.5 md:w-7 md:h-7 flex items-center justify-center rounded-full
                    ${cell.isToday ? 'bg-red-500 text-white' : cell.evStyle ? cell.evStyle.text : 'text-gray-700 dark:text-gray-300'}
                  `}
                >
                  {cell.day}
                </span>
                {(cell.evStyle || cell.personalEventColors?.length > 0) && (
                  <div className="flex gap-px mt-px">
                    {cell.evStyle && (
                      <span
                        className={`w-1 h-1 rounded-full ${cell.evStyle.dot}`}
                      />
                    )}
                    {cell.personalEventColors?.slice(0, 2).map((color, idx) => (
                      <span
                        key={`${idx}-${color}`}
                        className="w-1 h-1 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
