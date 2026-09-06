import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';
import DensityDetailsIcon from './base/icons/DensityDetailsIcon';
import DensityListIcon from './base/icons/DensityListIcon';
import CheckIcon from './base/icons/CheckIcon';
import { BaseIcon } from './base';

const DENSITY_OPTIONS = [
  {
    key: 'compacta',
    labelKey: 'calendar.compact',
    Icon: DensityListIcon,
  },
  {
    key: 'detalles',
    labelKey: 'calendar.details',
    Icon: DensityDetailsIcon,
  },
];

export default function DensitySwitcher() {
  const { settings, updateSetting } = useSettings();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setOpen(false);
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [open]);

  const current = settings.calendarDensity || 'compacta';

  return (
    <div
      className="relative flex items-center gap-3 justify-center transition-colors cursor-pointer flex-row z-10 px-4 py-2.5 max-lg:min-h-12 max-lg:px-5 max-lg:py-3 border border-btn-primary md:hover:bg-btn-primary/10 bg-white/10 rounded-full text-sm font-semibold  active:bg-gray-100 text-gray-900 active:dark:bg-gray-800 dark:text-gray-100 backdrop-blur-sm md:hover:text-btn-primary-dark md:hover:dark:text-btn-primary"
      ref={menuRef}
      onClick={() => setOpen((v) => !v)}
    >
      <BaseIcon
        icon="optionViewCalendar"
        size="md"
        className="rounded-full text-gray-500 dark:fill-gray-100 cursor-pointer max-lg:h-7 max-lg:w-7"
        title={t('calendar.density')}
      />

      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-48 rounded-xl shadow-lg border z-50 overflow-hidden bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          {DENSITY_OPTIONS.map((opt, i) => {
            const isActive = current === opt.key;
            const isLast = i === DENSITY_OPTIONS.length - 1;
            return (
              <button
                key={opt.key}
                onClick={() => {
                  updateSetting('calendarDensity', opt.key);
                  setOpen(false);
                }}
                className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm transition-colors md:hover:bg-gray-50 md:dark:hover:bg-gray-700 cursor-pointer ${
                  isActive
                    ? 'text-btn-primary-dark dark:text-btn-primary'
                    : 'text-gray-900 dark:text-gray-100'
                } ${!isLast ? `border-b border-gray-200 dark:border-gray-700` : ''}`}
              >
                <span className="w-5 flex justify-center">
                  {isActive && <CheckIcon size="small" color="currentColor" />}
                </span>
                <opt.Icon size="small" color="currentColor" />
                <span className="flex-1 text-left">{t(opt.labelKey)}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
