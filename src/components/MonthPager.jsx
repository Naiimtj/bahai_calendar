import { useMonthPager } from '../hooks/useMonthPager';

/** Month grid that follows the finger; the adjacent months peek in from the sides while swiping. */
export default function MonthPager({ pageKey, renderMonth, onPrev, onNext }) {
  const { viewportRef, trackRef, paging } = useMonthPager({ onPrev, onNext });

  return (
    <div ref={viewportRef} className="touch-pan-y overflow-hidden">
      <div
        ref={trackRef}
        className={paging ? 'relative will-change-transform' : 'relative'}
      >
        {paging && (
          <div
            aria-hidden="true"
            inert
            className="absolute top-0 right-full w-full"
          >
            {renderMonth(-1)}
          </div>
        )}
        <div key={pageKey} className="motion-reduce:animate-fade-in">
          {renderMonth(0)}
        </div>
        {paging && (
          <div
            aria-hidden="true"
            inert
            className="absolute top-0 left-full w-full"
          >
            {renderMonth(1)}
          </div>
        )}
      </div>
    </div>
  );
}
