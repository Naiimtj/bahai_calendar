import { useTranslation } from 'react-i18next';
import { BaseIcon } from './base';
import Privacy from './Privacy';

export default function About() {
  const { t } = useTranslation();

  return (
    <div className={`flex flex-col px-4 pb-6 h-full md:pt-6`}>
      <div className="text-center flex flex-col items-center mb-8">
        <BaseIcon icon="info" className="mb-3 stroke-primary-text size-14" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          {t('about.title')}
        </h2>
      </div>

      <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
        <p>{t('about.description1')}</p>
        <p>{t('about.description2')}</p>
        <p>{t('about.description3')}</p>
      </div>

      <div className="my-6 shadow-xl rounded-xl p-4 border-b border-gray-200 dark:border-gray-800">
        <h3 className="text-gray-800 dark:text-gray-200 font-semibold mb-2">
          {t('about.structureTitle')}
        </h3>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>📅 {t('about.months')}</li>
          <li>🎉 {t('about.ayyamiha')}</li>
          <li>🌅 {t('about.month19')}</li>
          <li>🌿 {t('about.nawruz')}</li>
          <li>⭐ {t('about.holyDays')}</li>
        </ul>
        <div className="mt-4">
          <h3 className="text-gray-800 dark:text-gray-200 font-semibold mb-2">
            {t('help.colorIndicators')}
          </h3>
          <ul className="text-gray-600 dark:text-gray-400 space-y-1 text-sm">
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
      </div>
      <Privacy />
    </div>
  );
}
