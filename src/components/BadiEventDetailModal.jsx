import { useState } from 'react';
import { BaseModal, BaseIcon, BaseAnchor, BaseButton } from './base';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '../context/NavigationContext';
import { useSettings } from '../context/SettingsContext';
import { formatGregorianDate } from '../lib/badiDate';

function getUrlHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

/**
 * Read-only detail modal for Badíʿ calendar holy day / feast events.
 * Shows desc, time_note, and URLs. No edit or delete actions.
 */
export default function BadiEventDetailModal({ visible, event, onClose }) {
  const { t } = useTranslation();
  const { setPage } = useNavigation();
  const { lang } = useSettings();
  const [showUrls, setShowUrls] = useState(false);
  if (!visible || !event) return null;

  const urls = event.url
    ? event.url
        .split('\n')
        .map((u) => u.trim())
        .filter(Boolean)
    : [];
  const textColors = {
    'bg-gold-500': 'text-amber-600',
    'bg-primary': 'text-primary-dark',
    'bg-blue-400': 'text-blue-400',
  };
  return (
    <BaseModal visible={visible} onClose={onClose} closeButtonHidden>
      <div className="flex flex-col gap-4 -m-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg sm:min-w-md">
        {/* Header */}
        <div className="flex items-center justify-between">
          <BaseButton text icon="arrowLeft" size="md" onClick={onClose} />
        </div>

        {/* Title + time note */}
        <div className="flex md:flex-row flex-col md:gap-4 gap-2 md:items-end">
          <h2 className={`text-2xl font-bold text-gray-700 dark:text-gray-300`}>
            {event.name}
          </h2>
          {event.time_note && (
            <div className={`text-sm italic ${textColors[event.color]}`}>
              {event.time_note}
            </div>
          )}
        </div>

        {/* Date */}
        {event.gregDate && (
          <div className={`text-sm text-gray-500 dark:text-gray-400`}>
            {formatGregorianDate(event.gregDate, lang)}
          </div>
        )}

        {/* Description */}
        {event.desc && (
          <div className="rounded-xl md:px-4 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {event.desc}
          </div>
        )}
        <div className="flex justify-between gap-2">
          <BaseButton
            outlined
            variant="secondary"
            icon="bahai"
            size="md"
            className="!border-primary-dark !text-primary-dark"
            onClick={() => {
              onClose();
              setPage('events');
            }}
          >
            {t('sidebar.upcomingEvents')}
          </BaseButton>
          {urls.length > 0 && (
            <BaseButton
              text
              icon="info"
              size="md"
              onClick={() => setShowUrls((prev) => !prev)}
            />
          )}
        </div>

        {/* URLs */}
        {showUrls && urls.length > 0 && (
          <div className="flex flex-col gap-x-3 gap-y-1 px-1">
            {urls.map((url) => (
              <BaseAnchor key={url} href={url} size="xs" variant="primary">
                {getUrlHost(url)}
              </BaseAnchor>
            ))}
          </div>
        )}
      </div>
    </BaseModal>
  );
}
