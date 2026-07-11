import { useTranslation } from 'react-i18next';
import { useBadiYear } from '../context/BadiYearContext';
import HomeIcon from './base/icons/HomeIcon';
import CalendarIcon from './base/icons/CalendarIcon';
import ClockIcon from './base/icons/ClockIcon';
import SettingsIcon from './base/icons/SettingsIcon';
import HelpCircleIcon from './base/icons/HelpCircleIcon';
import InfoIcon from './base/icons/InfoIcon';
import CloseIcon from './base/icons/CloseIcon';
import ShieldCheckIcon from './base/icons/ShieldCheckIcon';

const ITEMS = [
  {
    key: 'today',
    Icon: HomeIcon,
    labelKey: 'sidebar.bahaiToday',
  },
  {
    key: 'events',
    Icon: CalendarIcon,
    labelKey: 'sidebar.upcomingEvents',
  },
  {
    key: 'fasting',
    Icon: ClockIcon,
    labelKey: 'sidebar.fasting',
  },
  {
    key: 'settings',
    Icon: SettingsIcon,
    labelKey: 'sidebar.settings',
  },
  {
    key: 'help',
    Icon: HelpCircleIcon,
    labelKey: 'sidebar.help',
  },
  {
    key: 'about',
    Icon: InfoIcon,
    labelKey: 'sidebar.about',
  },
  {
    key: 'privacy',
    Icon: ShieldCheckIcon,
    labelKey: 'sidebar.privacy',
  },
];

export default function Sidebar({ open, onClose, currentPage, onNavigate }) {
  const { t } = useTranslation();
  const { error } = useBadiYear();

  const BADI_ONLY_PAGES = new Set(['fasting']);

  const navItems = (
    <nav className="py-2">
      {ITEMS.map((item) => {
        const isActive = currentPage === item.key;
        const isDisabled = error && BADI_ONLY_PAGES.has(item.key);
        let rowClass = 'hover:bg-gray-100 dark:hover:bg-gray-800';
        if (isDisabled) rowClass = 'opacity-40 cursor-not-allowed';
        else if (isActive)
          rowClass = 'bg-gray-100 dark:bg-gray-800 font-semibold';
        return (
          <button
            key={item.key}
            onClick={() => {
              if (isDisabled) return;
              onNavigate(item.key);
              onClose();
            }}
            disabled={isDisabled}
            className={`w-full flex items-center gap-2 px-2 py-3.5 text-left transition-colors ${rowClass} md:cursor-pointer`}
          >
            <span
              className={
                isActive
                  ? 'text-primary-text'
                  : 'text-gray-500 dark:text-gray-400'
              }
            >
              <item.Icon size="md" color="currentColor" />
            </span>
            <span
              className={`text-sm ${
                isActive
                  ? 'text-primary-text'
                  : 'text-gray-900 dark:text-gray-100'
              }`}
            >
              {t(item.labelKey)}
            </span>
          </button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* ── Desktop: permanent left sidebar ── */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:shrink-0 h-full border-r bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-200 dark:border-gray-800">
          <img src="/favicon.svg" alt="" className="h-8 w-8" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Bahá&apos;í Calendar
          </h2>
        </div>
        {navItems}
      </aside>

      {/* ── Mobile/Tablet: drawer overlay ── */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-52 z-50 transform transition-transform duration-300 md:hidden pt-safe pb-safe
          ${open ? 'translate-x-0' : 'translate-x-full'}
          bg-white dark:bg-gray-900`}
      >
        {/* Drawer header */}
        <div className="h-16 flex items-center justify-between px-2 border-b border-gray-200 dark:border-gray-800  dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="" className="h-8 w-8" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Bahá&apos;í Calendar
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full transition-colors text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"
          >
            <CloseIcon size="md" color="currentColor" />
          </button>
        </div>
        {navItems}
      </div>
    </>
  );
}
