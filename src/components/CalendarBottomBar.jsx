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

  return (
    <>
      {/* Spacer so content isn't hidden behind the fixed bar on mobile */}
      <div className="h-20 md:hidden" />
      <div className="fixed bottom-6 left-0 right-0 z-40 flex items-center justify-between px-8 md:static md:bottom-auto md:z-auto md:px-4 md:py-2 md:border-t md:border-gray-200 md:dark:border-gray-800 md:bg-white md:dark:bg-gray-950">
        <BaseButton label={t('calendar.today')} onClick={onToday} outlined />
        <CalendarViewSwitcher />
        <DensitySwitcher />
      </div>
    </>
  );
}
