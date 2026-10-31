import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../context/SettingsContext';
import { formatGregorianDate } from '../lib/badiDate';
import BaseSpinner from './base/BaseSpinner';
import { BaseIcon } from './base';
import FastingAlarmsModal from './FastingAlarmsModal';
import LocationPicker from './LocationPicker';
import { useFastingAlarms } from '../hooks/useFastingAlarms';
import { useFastingSunTimes } from '../hooks/useFastingSunTimes';
import { shouldPreviewNativeSettings } from '../utils/devPreview';

export default function Fasting() {
  const { lang } = useSettings();
  const { t } = useTranslation();
  const { supported } = useFastingAlarms();
  const {
    today,
    fast,
    fastYear,
    isFasting,
    daysUntil,
    daysRemaining,
    loading,
    location,
    saveLocation,
    clearLocation,
    sunTimes,
    loadingSun,
  } = useFastingSunTimes();

  const [showAlarms, setShowAlarms] = useState(false);

  const handleClearLocation = () => {
    clearLocation();
  };

  const formatTime = (date) =>
    new Intl.DateTimeFormat(lang, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);

  if (loading || !fast) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <BaseSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-auto px-4 md:pt-6 pb-6">
      <div className="text-center mb-8">
        <img
          src="/static/icons/fast_icon.png"
          alt="Fasting"
          className="mx-auto mb-4 w-24 h-24"
        />
        <h2 className="text-2xl font-bold dark:text-primary-light text-primary-dark">
          {t('fasting.theFast')}
        </h2>
        <p className="text-gray-400 mt-1">{t('fasting.monthAla')}</p>
      </div>

      <div className="rounded-xl p-5 mb-4 bg-gray-100 dark:bg-gray-800">
        <div className="text-center">
          {isFasting ? (
            <>
              <div className="text-primary-text text-lg font-semibold mb-2">
                {t('fasting.fastUnderway')}
              </div>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
                {daysRemaining}
              </div>
              <div className="text-gray-400">{t('fasting.daysRemaining')}</div>
            </>
          ) : (
            <>
              <div className="text-gray-400 text-sm mb-2">
                {t('fasting.nextFastIn')}
              </div>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
                {daysUntil}
              </div>
              <div className="text-gray-400">{t('fasting.days')}</div>
            </>
          )}
        </div>
      </div>

      <div className="rounded-xl p-4 space-y-3 bg-gray-100 dark:bg-gray-800">
        <div className="flex justify-between">
          <span className="text-gray-400">{t('fasting.start')}</span>
          <span className="dark:text-white text-gray-900">
            {formatGregorianDate(fast.start, lang)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">{t('fasting.end')}</span>
          <span className="dark:text-white text-gray-900">
            {formatGregorianDate(fast.end, lang)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">{t('fasting.bahaiYear')}</span>
          <span className="dark:text-primary-light text-primary-dark  font-medium">
            {fastYear} B.E.
          </span>
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-500 text-center leading-relaxed">
        {t('fasting.description')}
      </div>

      {/* Sun Times Section */}
      <div className="relative rounded-xl p-2 md:p-4 bg-gray-100 dark:bg-gray-800 mt-4 w-full">
        <div
          className={
            'flex flex-col justify-between mb-3 gap-2 w-full' +
            (location ? '' : ' items-center')
          }
        >
          <div className="flex flex-col md:gap-2 gap-2 items-center md:items-start justify-between my-3 md:my-0">
            <span className="text-lg font-semibold dark:text-gray-300 text-gray-800 uppercase tracking-wide">
              {t('fasting.sunTimes')}
            </span>
            <div className="flex items-center justify-end gap-1">
              {location && (
                <div className="flex flex-row items-center gap-3">
                  <div className="flex flex-row items-center">
                    <BaseIcon
                      icon="locationOn"
                      size="xs"
                      className="fill-gray-400"
                    />
                    <span className="text-xs text-gray-400">
                      {location.name}
                    </span>
                  </div>

                  <BaseIcon
                    icon="delete"
                    className="stroke-primary-text md:hover:stroke-red-500 cursor-pointer size-4"
                    onClick={handleClearLocation}
                  />
                </div>
              )}
            </div>
          </div>
          {!location && (
            <LocationPicker
              location={location}
              language={lang}
              onLocationChange={saveLocation}
              onClear={handleClearLocation}
              className="flex-1 gap-2 w-full"
            />
          )}
          {Boolean(
            (supported && location) || shouldPreviewNativeSettings(),
          ) && (
            <BaseIcon
              icon="alarm"
              size="x-large"
              onClick={() => setShowAlarms(true)}
              className="fill-white"
              wrapperClassName="absolute top-2 right-2 p-2 rounded-full bg-btn-primary-hover md:hover:bg-btn-primary-dark dark:bg-btn-primary-dark md:dark:hover:bg-btn-primary-hover"
            />
          )}
        </div>

        {location && (
          <div>
            {loadingSun ? (
              <div className="flex justify-center py-3">
                <BaseSpinner noCurrentQuote />
              </div>
            ) : (
              sunTimes && (
                <div className="">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="text-xs text-gray-400">
                        <th className="text-center pb-1 font-normal">
                          {t('fasting.day')}
                        </th>
                        <th className="text-center pb-1 font-normal">
                          {t('fasting.date')}
                        </th>
                        <th className="text-center pb-1 font-normal">
                          <BaseIcon
                            icon="sunrise"
                            size="xs"
                            color="#FBBF24"
                            className="inline mr-1"
                          />
                          {t('fasting.sunrise')}
                        </th>
                        <th className="text-center pb-1 font-normal">
                          <BaseIcon
                            icon="sunset"
                            size="xs"
                            color="#FB923C"
                            className="inline mr-1"
                          />
                          {t('fasting.sunset')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sunTimes.map((entry, i) => {
                        const isToday =
                          entry.date.toDateString() === today.toDateString();
                        return (
                          <tr
                            key={entry.date.toISOString()}
                            className={
                              isToday
                                ? 'bg-blue-500/10'
                                : 'border-t border-gray-200 dark:border-gray-700'
                            }
                          >
                            <td
                              className={`py-1 text-center ${
                                isToday
                                  ? 'font-semibold text-primary-text'
                                  : 'text-gray-400'
                              }`}
                            >
                              {i + 1}
                            </td>
                            <td
                              className={`py-1 text-center ${
                                isToday
                                  ? 'font-semibold text-primary-text'
                                  : 'text-gray-400'
                              }`}
                            >
                              {new Intl.DateTimeFormat(lang, {
                                month: 'short',
                                day: 'numeric',
                              }).format(entry.date)}
                            </td>
                            <td
                              className={`text-center py-1 tabular-nums ${
                                isToday
                                  ? 'font-semibold text-primary-text'
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}
                            >
                              {formatTime(entry.sunrise)}
                            </td>
                            <td
                              className={`text-center py-1 tabular-nums ${
                                isToday
                                  ? 'font-semibold text-primary-text'
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}
                            >
                              {formatTime(entry.sunset)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
        )}
      </div>

      <FastingAlarmsModal
        visible={showAlarms}
        onClose={() => setShowAlarms(false)}
        sunTimes={sunTimes}
        lang={lang}
      />
    </div>
  );
}
