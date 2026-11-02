import { useTranslation } from 'react-i18next';

export default function Privacy() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-full text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-semibold">{t('privacy.title')}</h2>
        <div className="w-12" />
      </div>

      <div className="flex-1 overflow-y-auto pt-6 space-y-6">
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
            {t('privacy.permissionsTitle')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {t('privacy.permissionsBody')}
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

        <p className="text-xs text-gray-400 dark:text-gray-500">
          {t('privacy.lastUpdated')}
        </p>
      </div>
    </div>
  );
}
