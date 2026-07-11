import MenuIcon from './base/icons/MenuIcon';

export default function Header({ onMenuClick }) {
  return (
    <header
      className="md:hidden flex items-center justify-end md:px-4 pr-4 md:py-3 sticky top-0 z-30"
      style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
    >
      {/* Menu button — mobile/tablet only */}
      <button
        onClick={onMenuClick}
        className="flex items-center justify-center rounded-full lg:hidden text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
      >
        <MenuIcon size="md" color="currentColor" />
      </button>
    </header>
  );
}
