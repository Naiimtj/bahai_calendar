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
import Help from './components/Help';
import Privacy from './components/Privacy';
import BaseToastNotification from './components/base/BaseToastNotification';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useKeyboardScrollFix } from './hooks/useKeyboardScrollFix';
import { useAndroidNavigationInset } from './hooks/useAndroidNavigationInset';

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
      case 'help':
        return <Help />;
      case 'about':
        return <About />;
      case 'privacy':
        return <Privacy />;
      default:
        return <CalendarView onMenuClick={() => setSidebarOpen(true)} />;
    }
  };

  return (
    <div className="h-full flex flex-row bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPage={page}
        onNavigate={setPage}
      />

      <div className="flex-1 flex flex-col w-full h-full">
        {page !== 'today' && (
          <Header
            title={t(PAGE_TITLES[page] || "Bahá'í Calendar")}
            onBack={closeToToday}
            onMenuClick={() => setSidebarOpen(true)}
          />
        )}

        <main className="flex-1 overflow-y-auto pb-[var(--kb-height)]">
          {renderPage()}
        </main>
      </div>

      {!isOnline && (
        <div
          className="fixed bottom-0 inset-x-0 z-50 bg-yellow-500 text-yellow-950 text-sm font-medium text-center py-2 px-4"
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
        >
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
