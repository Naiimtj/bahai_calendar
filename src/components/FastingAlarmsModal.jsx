import { useTranslation } from 'react-i18next';
import { BaseModal, BaseIcon, BaseMenu, BaseToggleSwitch } from './base';
import { formatGregorianDate } from '../lib/badiDate';
import {
  useFastingAlarms,
  OFFSET_MINUTES_OPTIONS,
} from '../hooks/useFastingAlarms';
import { shouldPreviewNativeSettings } from '../utils/devPreview';

function formatOffsetLabel(t, offsetMinutes) {
  if (offsetMinutes == null) return t('fasting.alarms.disabled');
  if (offsetMinutes === 0) return t('fasting.alarms.exactTime');
  if (offsetMinutes < 0) {
    return t('fasting.alarms.minutesBefore', { count: -offsetMinutes });
  }
  return t('fasting.alarms.minutesAfter', { count: offsetMinutes });
}

function buildOffsetItems(t) {
  const items = OFFSET_MINUTES_OPTIONS.map((minutes) => ({
    value: minutes,
    label: formatOffsetLabel(t, minutes),
  }));
  const midIndex = OFFSET_MINUTES_OPTIONS.findIndex((minutes) => minutes > 0);
  items.splice(midIndex, 0, { value: 0, label: t('fasting.alarms.exactTime') });
  return items;
}

function PeriodConfigEditor({ t, period, icon, config, onPatch, color }) {
  const items = buildOffsetItems(t);
  const selected = config.exact ? 0 : (config.offsetMinutes ?? 0);
  const enabled = config.exact || config.offsetMinutes != null;

  const handleSelect = (minutes) => {
    onPatch({
      exact: minutes === 0,
      offsetMinutes: minutes === 0 ? null : minutes,
    });
  };

  const handleToggle = (value) => {
    onPatch({ exact: value, offsetMinutes: null });
  };

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <BaseIcon
            icon={icon}
            size="xs"
            // className="stroke-gray-400"
            color={color}
          />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {t(`fasting.alarms.${period}Alarm`)}
          </span>
        </div>
        <BaseToggleSwitch
          value={enabled}
          onChange={handleToggle}
          aria-label={t(`fasting.alarms.${period}Alarm`)}
        />
      </div>
      <BaseMenu
        label={t(`fasting.alarms.${period}Alarm`)}
        value={selected}
        options={items}
        onChange={handleSelect}
        hideChevron
        className="!w-full !justify-between !rounded-lg !border !border-input-border !bg-white !px-3 !py-2 !text-sm !text-gray-900 dark:!border-gray-600 dark:!bg-gray-700 dark:!text-gray-100"
      />
    </div>
  );
}

/**
 * Configures fasting alarms: one general sunrise/sunset schedule applied to
 * every day of the Fast, optionally overridden per day. Each period has an
 * on/off switch and a wheel to select exact time or a lead/delay offset.
 * Requires the sun times for the fast period (set via the
 * Fasting page's location picker) to know when to schedule each native
 * alarm. Also offers a one-tap test button so users can instantly confirm
 * notifications work on their device.
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
    customizePerDay,
    setGeneralPeriod,
    setCustomizePerDay,
    setDayPeriod,
    effectiveFor,
    generalDisplayFor,
    dayKey,
  } = useFastingAlarms(sunTimes);

  // Off-device the controls are inert (native scheduling stays gated inside
  // the hook/service) but the config UI should still render so it can be
  // reviewed.
  const alarmsVisible = supported || shouldPreviewNativeSettings();

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      title={t('fasting.alarms.title')}
    >
      <p className="text-sm text-gray-500 text-center -mt-2">
        {t('fasting.alarms.subtitle')}
      </p>

      {!alarmsVisible && (
        <div className="rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 text-sm p-3 text-center">
          {t('fasting.alarms.unsupported')}
        </div>
      )}

      {alarmsVisible && !sunTimes?.length && (
        <div className="rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 text-sm p-3 text-center">
          {t('fasting.alarms.noLocation')}
        </div>
      )}

      {supported && permission === 'denied' && (
        <div className="rounded-lg bg-warning/10 text-warning text-sm p-3 text-center">
          {t('fasting.alarms.permissionDenied')}
        </div>
      )}

      {alarmsVisible && sunTimes?.length > 0 && (
        <>
          <div className="rounded-xl md:p-4 p-2 bg-gray-100 dark:bg-gray-800 space-y-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {t('fasting.alarms.generalConfig')}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {t('fasting.alarms.generalConfigHint')}
                </p>
              </div>
            </div>

            <div className="flex gap-4 pt-1">
              <PeriodConfigEditor
                t={t}
                period="sunrise"
                icon="sunrise"
                config={generalDisplayFor('sunrise')}
                onPatch={(patch) => setGeneralPeriod('sunrise', patch)}
                color="#FBBF24"
              />
              <PeriodConfigEditor
                t={t}
                period="sunset"
                icon="sunset"
                config={generalDisplayFor('sunset')}
                onPatch={(patch) => setGeneralPeriod('sunset', patch)}
                color="#FB923C"
              />
            </div>
          </div>

          <div className="rounded-xl md:p-4 p-2 bg-gray-100 dark:bg-gray-800 mb-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {t('fasting.alarms.customizePerDay')}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {t('fasting.alarms.customizePerDayHint')}
                  </p>
                </div>
              </div>
              <BaseToggleSwitch
                value={customizePerDay}
                onChange={setCustomizePerDay}
              />
            </div>
          </div>

          {customizePerDay && (
            <div className="space-y-2 overflow-y-auto mb-4">
              {sunTimes.map((entry, index) => {
                const key = dayKey(entry.date);
                const sunrise = effectiveFor(entry, 'sunrise');
                const sunset = effectiveFor(entry, 'sunset');
                return (
                  <div
                    key={key}
                    className="rounded-xl md:px-5 px-3 md:py-4 py-2 bg-gray-100 dark:bg-gray-800"
                  >
                    <div className="text-sm font-medium text-primary-text">
                      {t('fasting.day')} {index + 1}
                    </div>
                    <div className="text-xs text-gray-400 truncate mb-2">
                      {formatGregorianDate(entry.date, lang)}
                    </div>
                    <div className="flex gap-3">
                      <PeriodConfigEditor
                        t={t}
                        period="sunrise"
                        icon="sunrise"
                        config={sunrise}
                        onPatch={(patch) =>
                          setDayPeriod(entry, 'sunrise', patch)
                        }
                        color="#FBBF24"
                      />
                      <PeriodConfigEditor
                        t={t}
                        period="sunset"
                        icon="sunset"
                        config={sunset}
                        onPatch={(patch) =>
                          setDayPeriod(entry, 'sunset', patch)
                        }
                        color="#FB923C"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </BaseModal>
  );
}
