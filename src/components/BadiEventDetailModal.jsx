import { BaseModal, BaseIcon, BaseAnchor } from './base';

/**
 * Read-only detail modal for Badíʿ calendar holy day / feast events.
 * Shows desc, time_note, and URLs. No edit or delete actions.
 */
export default function BadiEventDetailModal({ visible, event, onClose }) {
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
        <div className="flex items-center">
          <BaseIcon
            icon="arrowLeft"
            size="md"
            onClick={onClose}
            className="hover:stroke-primary stroke-primary-dark dark:stroke-gray-300 dark:hover:stroke-white cursor-pointer"
          />
        </div>

        {/* Title */}
        <h2 className={`text-2xl font-bold text-gray-700 dark:text-gray-300`}>
          {event.name}
        </h2>

        {/* Time note */}
        {event.time_note && (
          <div className={`px-4 text-sm italic ${textColors[event.color]}`}>
            {event.time_note}
          </div>
        )}

        {/* Description */}
        {event.desc && (
          <div className="rounded-xl bg-white dark:bg-gray-800/60 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {event.desc}
          </div>
        )}

        {/* URLs */}
        {urls.length > 0 && (
          <div className="flex flex-col gap-2 px-1">
            {urls.map((url) => (
              <BaseAnchor key={url} href={url} size="sm" variant="primary">
                {url}
              </BaseAnchor>
            ))}
          </div>
        )}
      </div>
    </BaseModal>
  );
}
