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
    <div className="flex items-center gap-1 rounded-full bg-gray-200 dark:bg-gray-800 p-1">
      {VIEW_OPTIONS.map(({ key, icon }) => (
        <BaseIcon
          key={key}
          icon={icon}
          size="md"
          color="currentColor"
          onClick={() => updateSetting('calendarView', key)}
          className={`transition-colors ${
            current === key
              ? 'text-gray-900 dark:text-white'
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
          wrapperClassName={`p-2 rounded-full transition-colors ${
            current === key
              ? 'bg-white dark:bg-gray-700 shadow-sm'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title={key}
        />
      ))}
    </div>
  );
}
