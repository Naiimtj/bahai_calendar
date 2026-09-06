import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseModal, BaseButton, BaseIcon, BaseToggleSwitch } from './base';
import { formatGregorianDate } from '../lib/badiDate';
import { useFastingAlarms } from '../hooks/useFastingAlarms';

/**
 * Lists every day of the current Fast with independent sunrise/sunset alarm
 * toggles, plus a bulk enable/disable-all control. Requires the sun times for
 * the fast period (set via the Fasting page's location picker) to know when
 * to schedule each native alarm. Also offers a one-tap test button so users
 * can instantly confirm notifications work (and how they sound) on their device.
 */
export default function FastingAlarmsModal({
  visible,
  onClose,
  sunTimes,
  lang,
}) {
  const { t } = useTranslation();
  const {
    supported,
    permission,
    dayAlarms,
    toggleAlarm,
    setAll,
    dayKey,
    sendTestAlarm,
  } = useFastingAlarms(sunTimes);

  const [testStatus, setTestStatus] = useState(null);

  const handleSendTest = async () => {
    const granted = await sendTestAlarm();
    setTestStatus(granted ? 'sent' : 'denied');
  };

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      title={t('fasting.alarms.title')}
    >
      <p className="text-sm text-gray-500 text-center -mt-2">
        {t('fasting.alarms.subtitle')}
      </p>

      {!supported && (
        <div className="rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 text-sm p-3 text-center">
          {t('fasting.alarms.unsupported')}
        </div>
      )}

      {supported && (
        <div className="rounded-xl p-4 bg-gray-100 dark:bg-gray-800 space-y-3">
          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            {t('fasting.alarms.testTitle')}
          </div>
          <p className="text-xs text-gray-500">
            {t('fasting.alarms.testSubtitle')}
          </p>
          <BaseButton
            label={t('fasting.alarms.sendTest')}
            icon="clock"
            onClick={handleSendTest}
            className="w-full text-xs"
          />
          {testStatus === 'sent' && (
            <p className="text-xs text-success text-center">
              {t('fasting.alarms.testSent')}
            </p>
          )}
          {testStatus === 'denied' && (
            <p className="text-xs text-warning text-center">
              {t('fasting.alarms.permissionDenied')}
            </p>
          )}
        </div>
      )}

      {supported && !sunTimes?.length && (
        <div className="rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 text-sm p-3 text-center">
          {t('fasting.alarms.noLocation')}
        </div>
      )}

      {supported && permission === 'denied' && (
        <div className="rounded-lg bg-warning/10 text-warning text-sm p-3 text-center">
          {t('fasting.alarms.permissionDenied')}
        </div>
      )}

      {supported && sunTimes?.length > 0 && (
        <>
          <div className="flex gap-2">
            <BaseButton
              label={t('fasting.alarms.activateAll')}
              icon="check"
              outlined
              onClick={() => setAll(true)}
              className="flex-1 text-xs"
            />
            <BaseButton
              label={t('fasting.alarms.deactivateAll')}
              icon="close"
              outlined
              onClick={() => setAll(false)}
              className="flex-1 text-xs"
            />
          </div>

          <div className="space-y-2 overflow-y-auto">
            {sunTimes.map((entry, index) => {
              const key = dayKey(entry.date);
              const state = dayAlarms[key] || {};
              return (
                <div
                  key={key}
                  className="rounded-xl p-3 bg-gray-100 dark:bg-gray-800 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-primary-text">
                      {t('fasting.day')} {index + 1}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {formatGregorianDate(entry.date, lang)}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <BaseIcon
                        icon="sunrise"
                        size="xs"
                        className="stroke-gray-400"
                      />
                      <BaseToggleSwitch
                        value={!!state.sunrise}
                        onChange={() => toggleAlarm(entry, 'sunrise')}
                        aria-label={`${t('fasting.alarms.sunriseAlarm')} — ${t('fasting.day')} ${index + 1}`}
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <BaseIcon
                        icon="sunset"
                        size="xs"
                        className="stroke-gray-400"
                      />
                      <BaseToggleSwitch
                        value={!!state.sunset}
                        onChange={() => toggleAlarm(entry, 'sunset')}
                        aria-label={`${t('fasting.alarms.sunsetAlarm')} — ${t('fasting.day')} ${index + 1}`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </BaseModal>
  );
}
