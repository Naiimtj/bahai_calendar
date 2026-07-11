import { useTranslation } from 'react-i18next';

export default function Help() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-full px-4 py-6">
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">❓</div>
        <h2 className="text-xl font-bold">{t('help.title')}</h2>
      </div>

      <div className="space-y-4 text-sm text-gray-300">
        <div className="bg-gray-800 rounded-xl p-4">
          <h3 className="text-primary-text font-semibold mb-1">
            {t('help.calendarViews')}
          </h3>
          <p className="text-gray-400">{t('help.calendarViewsDesc')}</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-4">
          <h3 className="text-primary-text font-semibold mb-1">
            {t('help.colorIndicators')}
          </h3>
          <ul className="text-gray-400 space-y-1">
            <li>
              <span className="inline-block w-2 h-2 rounded-full bg-gold-500 mr-2" />
              {t('help.holyDay')}
            </li>
            <li>
              <span className="inline-block w-2 h-2 rounded-full bg-primary mr-2" />
              {t('help.ridvan')}
            </li>
            <li>
              <span className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-2" />
              {t('help.feast')}
            </li>
            <li>
              <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2" />
              {t('help.todayIndicator')}
            </li>
          </ul>
        </div>

        <div className="bg-gray-800 rounded-xl p-4">
          <h3 className="text-primary-text font-semibold mb-1">
            {t('help.navigation')}
          </h3>
          <p className="text-gray-400">{t('help.navigationDesc')}</p>
        </div>
      </div>
    </div>
  );
}
