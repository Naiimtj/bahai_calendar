import { useTranslation } from 'react-i18next';
import { BaseButton } from './base';
import MenuIcon from './base/icons/MenuIcon';

export default function Header({ onBack, onMenuClick }) {
  const { t } = useTranslation();

  return (
    <header
      className="md:hidden flex items-center justify-between md:px-4 pr-4 md:py-3 sticky top-0 z-30"
      style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
    >
      {/* Back to calendar */}
      <BaseButton
        onClick={onBack}
        text
        icon="arrowLeft"
        className="!text-[16px] justify-start px-2 py-2"
      >
        {t('addEvent.calendar')}
      </BaseButton>

      {/* Menu button — mobile/tablet only */}
      <button
        onClick={onMenuClick}
        className="flex items-center justify-center rounded-full lg:hidden text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer max-lg:h-7 max-lg:w-7"
      >
        <MenuIcon size="x-large" color="currentColor" />
      </button>
    </header>
  );
}
