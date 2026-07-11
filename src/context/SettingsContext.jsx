import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useTranslation } from 'react-i18next';
import { fetchSunsetForDate } from '../services/sunTimesApi';

const SettingsContext = createContext();

const SUPPORTED_LANGS = ['ar', 'fa', 'en', 'es', 'fr', 'de'];

const DEFAULTS = {
  language: 'system', // 'ar' | 'fa' | 'en' | 'es' | 'fr' | 'de' | 'system'
  dateShift: 'clock', // 'sunset' | 'clock'
  secondaryFormat: 'name', // 'numbers' | 'name' — Format for secondary dates in calendar views
  weekStart: 'monday', // 'jalal' | 'sunday' | 'monday' — First day of the week
  calendarView: 'gregorian', // 'gregorian' | 'badi' | 'mixed' — Selected calendar view
  calendarDensity: 'compacta', // 'compacta' | 'detalles' | 'lista' — Calendar cell density
  showWeekNumbers: true,
  darkMode: 'system', // 'dark' | 'light' | 'system'
  timeFormat: 'system', // 'system' | '24' | '12' — Clock format for event times
};

export function SettingsProvider({ children }) {
  const { i18n } = useTranslation();
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('bahai-cal-settings');
      return saved ? { ...DEFAULTS, ...JSON.parse(saved) } : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

  const updateSetting = (key, value) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem('bahai-cal-settings', JSON.stringify(next));
      return next;
    });
  };

  // Effective "today" — may be tomorrow when dateShift=sunset and past sunset
  const [effectiveToday, setEffectiveToday] = useState(new Date());

  const refreshEffectiveToday = useCallback(async () => {
    const now = new Date();
    if (settings.dateShift !== 'sunset') {
      setEffectiveToday(now);
      return;
    }
    try {
      const locStr = localStorage.getItem('bahai-location');
      const loc = locStr ? JSON.parse(locStr) : null;
      if (!loc) {
        setEffectiveToday(now);
        return;
      }
      const sunset = await fetchSunsetForDate(loc.lat, loc.lon, now);
      if (sunset && now > sunset) {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        setEffectiveToday(tomorrow);
      } else {
        setEffectiveToday(now);
      }
    } catch {
      setEffectiveToday(new Date());
    }
  }, [settings.dateShift]);

  useEffect(() => {
    refreshEffectiveToday();
  }, [refreshEffectiveToday]);

  // Resolve effective language
  const resolveSystemLang = () => {
    const navLang = navigator.language?.split('-')[0];
    return SUPPORTED_LANGS.includes(navLang) ? navLang : 'en';
  };

  const lang =
    settings.language === 'system' ? resolveSystemLang() : settings.language;

  // Sync i18next language
  useEffect(() => {
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
    localStorage.setItem('bahai-cal-lang', lang);
  }, [lang, i18n]);

  // Resolve dark mode
  const prefersDark =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark =
    settings.darkMode === 'system' ? prefersDark : settings.darkMode === 'dark';

  // Sync class on <html> for Tailwind dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSetting,
        lang,
        dark,
        effectiveToday,
        refreshEffectiveToday,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
