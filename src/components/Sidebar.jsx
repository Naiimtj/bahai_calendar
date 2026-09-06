import { useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useBadiYear } from '../context/BadiYearContext';
import HomeIcon from './base/icons/HomeIcon';
import BahaiIcon from './base/icons/BahaiIcon';
import CalendarIcon from './base/icons/CalendarIcon';
import ClockIcon from './base/icons/ClockIcon';
import SettingsIcon from './base/icons/SettingsIcon';
import InfoIcon from './base/icons/InfoIcon';
import CloseIcon from './base/icons/CloseIcon';

const ITEMS = [
  {
    key: 'today',
    Icon: HomeIcon,
    labelKey: 'sidebar.bahaiToday',
  },
  {
    key: 'events',
    Icon: BahaiIcon,
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
    key: 'about',
    Icon: InfoIcon,
    labelKey: 'sidebar.about',
  },
];

export default function Sidebar({ open, onClose, currentPage, onNavigate }) {
  const { t } = useTranslation();
  const { error } = useBadiYear();
  const panelRef = useRef(null);
  const startYRef = useRef(0);
  const startXRef = useRef(0);

  const BADI_ONLY_PAGES = new Set(['fasting']);

  const handleTouchStart = useCallback((e) => {
    startYRef.current = e.touches[0].clientY;
    startXRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e) => {
      const dy = e.changedTouches[0].clientY - startYRef.current;
      const dx = Math.abs(e.changedTouches[0].clientX - startXRef.current);
      const isAtTop = (panelRef.current?.scrollTop ?? 0) <= 0;
      if (isAtTop && dy > 70 && dy > dx) onClose();
    },
    [onClose],
  );

  const navItems = (
    <nav className="py-0 md:py-2">
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
              <item.Icon size="large" color="currentColor" />
            </span>
            <span
              className={`text-md ${
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
      <aside className="hidden md:flex md:flex-col md:w-64 md:shrink-0 h-full border-r bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 pt-safe">
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
          className="fixed inset-0 bg-black/50 z-50 md:hidden "
          onClick={onClose}
        />
      )}

      <div
        ref={panelRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`fixed top-[max(0.5rem,env(safe-area-inset-top))] right-[max(0.5rem,env(safe-area-inset-right))] z-[60] w-52 max-w-xs max-h-[90vh] transform overflow-y-auto rounded-2xl border border-gray-200 shadow-xl transition-all duration-300 dark:border-gray-700 md:hidden
          ${open ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'}
          bg-white dark:bg-gray-900`}
      >
        {/* Drawer header */}
        <div className="md:block hidden h-16 items-center justify-between px-2 border-b border-gray-200 dark:border-gray-800  dark:bg-gray-900">
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
