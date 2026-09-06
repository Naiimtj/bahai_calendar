import { useTranslation } from 'react-i18next';
import DensitySwitcher from './DensitySwitcher';
import CalendarViewSwitcher from './CalendarViewSwitcher';
import BaseButton from './base/BaseButton';

/**
 * Shared bottom bar with "Today" pill button — iOS style.
 *
 * Props:
 *   onToday – handler when "Hoy" / "Today" is pressed
 */
export default function CalendarBottomBar({ onToday }) {
  const { t } = useTranslation();

  const spacerClass = 'h-[calc(6rem+var(--app-system-navigation-bottom,0px))]';
  const barBottomClass =
    'bottom-[calc(1.5rem+var(--app-system-navigation-bottom,0px))]';

  return (
    <>
      {/* Spacer so content isn't hidden behind the fixed bar */}
      <div className={spacerClass} />
      <div
        className={`fixed ${barBottomClass} left-0 right-0 md:left-64 z-40 flex items-center justify-between px-4`}
      >
        <BaseButton
          label={t('calendar.today')}
          onClick={onToday}
          outlined
          className="max-lg:min-h-12 max-lg:px-5 max-lg:py-3 max-lg:text-base"
        />
        <CalendarViewSwitcher />
        <DensitySwitcher />
      </div>
    </>
  );
}
