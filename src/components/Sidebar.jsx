import { useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useBadiYear } from '../context/BadiYearContext';
import HomeIcon from './base/icons/HomeIcon';
import BahaiIcon from './base/icons/BahaiIcon';
import CalendarIcon from './base/icons/CalendarIcon';
import ClockIcon from './base/icons/ClockIcon';
import SettingsIcon from './base/icons/SettingsIcon';
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
        let rowClass = 'hover:bg-slate-100/80 dark:hover:bg-slate-800/80';
        if (isDisabled) rowClass = 'opacity-40 cursor-not-allowed';
        else if (isActive) rowClass = 'font-semibold';
        return (
          <button
            key={item.key}
            onClick={() => {
              if (isDisabled) return;
              onNavigate(item.key);
              onClose();
            }}
            disabled={isDisabled}
            className={`w-full flex items-center justify-start gap-2 px-4 py-3.5 text-left transition-colors ${rowClass} md:cursor-pointer md:justify-center md:px-2 lg:justify-start lg:px-5`}
          >
            <span
              className={
                isActive
                  ? 'text-teal-700 dark:text-teal-300'
                  : 'text-slate-500 dark:text-slate-400'
              }
            >
              <item.Icon size="large" color="currentColor" />
            </span>
            <span
              className={`inline text-md md:hidden lg:inline ${
                isActive
                  ? 'text-teal-700 dark:text-teal-300'
                  : 'text-slate-800 dark:text-slate-100'
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
      <aside className="hidden md:flex md:flex-col md:w-16 lg:w-auto md:shrink-0 h-full border-r border-slate-200/35 bg-white/60 dark:border-slate-800/70 dark:bg-slate-950/70 backdrop-blur-xl pt-safe shadow-[0_0_0_1px_rgba(148,163,184,0.04)]">
        <div className="h-16 flex items-center justify-center gap-3 px-2 dark:border-slate-800/70 lg:justify-start lg:px-5">
          <img src="/favicon.svg" alt="" className="h-8 w-8 object-contain" />
          <h2 className="hidden text-base font-semibold text-slate-900 dark:text-slate-100 lg:block">
            Bahá&apos;í Calendar
          </h2>
        </div>
        {navItems}
      </aside>

      {open && (
        <div
          className="fixed inset-0 bg-slate-900/30 z-50 backdrop-blur-[2px] md:hidden"
          onClick={onClose}
        />
      )}

      <div
        ref={panelRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`fixed top-[max(0.5rem,env(safe-area-inset-top))] right-[max(0.5rem,env(safe-area-inset-right))] z-[60] w-60 max-w-xs max-h-[calc(100dvh-max(0.5rem,env(safe-area-inset-top))-0.5rem-var(--app-system-navigation-bottom,0px))] transform overflow-y-auto rounded-3xl border border-slate-200/40 bg-white/75 p-2 shadow-[0_24px_60px_rgba(15,23,42,0.10)] backdrop-blur-xl transition-all duration-300 dark:border-slate-800/80 dark:bg-slate-950/80 md:hidden
          ${open ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'}`}
      >
        <div className="md:block hidden h-16 items-center justify-between px-2 border-b border-slate-200/30 dark:border-slate-800/70">
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="" className="h-8 w-8 object-contain" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Bahá&apos;í Calendar
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full transition-colors text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <CloseIcon size="md" color="currentColor" />
          </button>
        </div>
        {navItems}
      </div>
    </>
  );
}
