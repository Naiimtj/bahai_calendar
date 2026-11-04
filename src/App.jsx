import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SplashScreen } from '@capacitor/splash-screen';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { BadiYearProvider, useBadiYear } from './context/BadiYearContext';
import { PersonalEventsProvider } from './context/PersonalEventsContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import BadiCalendar from './components/BadiCalendar';
import MixedCalendar from './components/MixedCalendar';
import CompactCalendar from './components/CompactCalendar';
import UpcomingEvents from './components/UpcomingEvents';
import Settings from './components/Settings';
import Fasting from './components/Fasting';
import About from './components/About';
import Privacy from './components/Privacy';
import BaseToastNotification from './components/base/BaseToastNotification';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useKeyboardScrollFix } from './hooks/useKeyboardScrollFix';
import { useAndroidNavigationInset } from './hooks/useAndroidNavigationInset';
import { useEventNotifications } from './hooks/useEventNotifications';
import { useWidgetSync } from './hooks/useWidgetSync';

function CalendarView({ onMenuClick }) {
  const { settings, effectiveToday } = useSettings();
  const { error } = useBadiYear();
  const [selectedDate, setSelectedDate] = useState(effectiveToday);

  if (error)
    return (
      <CompactCalendar
        onMenuClick={onMenuClick}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />
    );

  switch (settings.calendarView) {
    case 'badi':
      return (
        <BadiCalendar
          onMenuClick={onMenuClick}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      );
    case 'mixed':
      return (
        <MixedCalendar
          onMenuClick={onMenuClick}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      );
    default:
      return (
        <CompactCalendar
          onMenuClick={onMenuClick}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      );
  }
}

const PAGE_TITLES = {
  today: 'pages.calendar',
  events: 'pages.upcomingEvents',
  fasting: 'pages.fasting',
  settings: 'pages.settings',
  help: 'pages.help',
  about: 'pages.about',
  privacy: 'pages.privacy',
};

function AppInner() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { page, setPage } = useNavigation();
  const { t } = useTranslation();
  const { error } = useBadiYear();

  useEffect(() => {
    SplashScreen.hide().catch(() => {});
  }, []);
  const [toastDismissed, setToastDismissed] = useState(false);
  const isOnline = useOnlineStatus();
  useKeyboardScrollFix();
  useAndroidNavigationInset();
  useEventNotifications();
  useWidgetSync();

  useEffect(() => {
    if (error && page === 'fasting') setPage('today');
  }, [error, page, setPage]);

  const closeToToday = () => {
    setSidebarOpen(false);
    setPage('today');
  };

  const renderPage = () => {
    switch (page) {
      case 'events':
        return <UpcomingEvents />;
      case 'fasting':
        return <Fasting />;
      case 'settings':
        return <Settings />;
      case 'about':
        return <About />;
      case 'privacy':
        return <Privacy />;
      default:
        return <CalendarView onMenuClick={() => setSidebarOpen(true)} />;
    }
  };

  return (
    <div className="h-full flex flex-row bg-transparent text-slate-900 dark:text-slate-100">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPage={page}
        onNavigate={setPage}
      />

      <div className="flex-1 flex flex-col w-full h-full relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(125,211,207,0.18),_transparent_22%)]" />

        {page !== 'today' && (
          <Header
            title={t(PAGE_TITLES[page] || "Bahá'í Calendar")}
            onBack={closeToToday}
            onMenuClick={() => setSidebarOpen(true)}
          />
        )}

        <main
          className={`relative flex-1 overflow-y-auto pb-[var(--kb-height)] ${page === 'today' ? '' : 'md:pt-safe'}`}
        >
          {renderPage()}
        </main>
      </div>

      {!isOnline && (
        <div className="fixed bottom-[var(--app-system-navigation-bottom,0px)] inset-x-0 z-50 bg-amber-400/90 text-amber-950 text-sm font-medium text-center px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md shadow-[0_-8px_24px_rgba(251,146,60,0.18)]">
          {t('offline.banner')}
        </div>
      )}

      <BaseToastNotification
        display={!!error && !toastDismissed}
        type="warning"
        duration={8000}
        message={t('toast.apiError')}
        onClose={() => setToastDismissed(true)}
      />
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <BadiYearProvider>
        <PersonalEventsProvider>
          <NavigationProvider>
            <AppInner />
          </NavigationProvider>
        </PersonalEventsProvider>
      </BadiYearProvider>
    </SettingsProvider>
  );
}
