import { useTranslation } from 'react-i18next';
import ArrowLeftIcon from './base/icons/ArrowLeftIcon';

export default function Privacy({ onClose }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={onClose}
          className="text-primary-text font-semibold text-sm inline-flex items-center gap-1"
        >
          <ArrowLeftIcon size="small" color="currentColor" />
          {t('settings.done')}
        </button>
        <h2 className="text-lg font-semibold">{t('privacy.title')}</h2>
        <div className="w-12" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        <section>
          <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-2">
            {t('privacy.dataCollectionTitle')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {t('privacy.dataCollectionBody')}
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-2">
            {t('privacy.localStorageTitle')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {t('privacy.localStorageBody')}
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-2">
            {t('privacy.apiTitle')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {t('privacy.apiBody')}
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-2">
            {t('privacy.thirdPartyTitle')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {t('privacy.thirdPartyBody')}
          </p>
        </section>

        <section>
          <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-2">
            {t('privacy.contactTitle')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {t('privacy.contactBody')}
          </p>
        </section>

        <p className="text-xs text-gray-400 dark:text-gray-600 pt-2">
          {t('privacy.lastUpdated')}
        </p>
      </div>
    </div>
  );
}
