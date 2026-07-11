import { useTranslation } from 'react-i18next';

export default function About() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-full px-4 py-6">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">⭐</div>
        <h2 className="text-2xl font-bold text-primary-text">
          {t('about.title')}
        </h2>
        <p className="text-gray-500 text-sm mt-1">v1.0.0</p>
      </div>

      <div className="bg-gray-800 rounded-xl p-5 space-y-4 text-sm text-gray-300 leading-relaxed">
        <p>
          <strong className="text-primary-text">{t('about.title')}</strong>{' '}
          {t('about.description1')}
        </p>
        <p>{t('about.description2')}</p>
        <p>{t('about.description3')}</p>
      </div>

      <div className="mt-6 bg-gray-800 rounded-xl p-4">
        <h3 className="text-primary-text font-semibold mb-2">
          {t('about.structureTitle')}
        </h3>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>📅 {t('about.months')}</li>
          <li>🎉 {t('about.ayyamiha')}</li>
          <li>🌅 {t('about.month19')}</li>
          <li>🌿 {t('about.nawruz')}</li>
          <li>⭐ {t('about.holyDays')}</li>
        </ul>
      </div>
    </div>
  );
}
