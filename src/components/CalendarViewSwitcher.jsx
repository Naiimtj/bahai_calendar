import { useSettings } from '../context/SettingsContext';
import { useBadiYear } from '../context/BadiYearContext';
import { BaseIcon } from './base';

const VIEW_OPTIONS = [
  { key: 'gregorian', icon: 'calendarGregorian' },
  { key: 'mixed', icon: 'calendarMixed' },
  { key: 'badi', icon: 'calendarBadi' },
];

export default function CalendarViewSwitcher() {
  const { settings, updateSetting } = useSettings();
  const { error } = useBadiYear();
  const current = settings.calendarView;

  if (error) return null;

  return (
    <div className="flex items-center gap-1 hover:bg-btn-primary/10 px-4 md:py-0.5 max-lg:min-h-12 max-lg:gap-1.5 max-lg:px-3 shadow-md md:hover:bg-btn-primary/10 bg-gray-100/30 dark:bg-gray-100/5 rounded-full text-sm font-semibold active:bg-gray-100 text-gray-900 active:dark:bg-gray-800 dark:text-gray-100 backdrop-blur-sm md:hover:text-btn-primary-dark md:hover:dark:text-btn-primary">
      {VIEW_OPTIONS.map(({ key, icon }) => (
        <BaseIcon
          key={key}
          icon={icon}
          size="large"
          color="currentColor"
          onClick={() => updateSetting('calendarView', key)}
          className={`transition-colors max-lg:h-7 max-lg:w-7 ${
            current === key
              ? 'text-btn-primary-active dark:text-btn-primary '
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
          wrapperClassName={`p-2 max-lg:p-2.5 rounded-full transition-colors `}
          title={key}
        />
      ))}
    </div>
  );
}
