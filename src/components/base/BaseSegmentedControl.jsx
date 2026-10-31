/**
 * BaseSegmentedControl — pill, rounded, or glass segmented tab selector.
 *
 * Props:
 *   options  – [{ value, label }]
 *   value    – currently selected value
 *   onChange – (value) => void
 *   variant  – 'pill' (default) | 'rounded' | 'glass'
 */
export default function BaseSegmentedControl({
  options,
  value,
  onChange,
  variant = 'pill',
}) {
  const isPill = variant === 'pill';
  const isRounded = variant === 'rounded';

  const wrapperClass = isPill
    ? 'flex overflow-x-auto scrollbar-none rounded-full p-0.5 bg-gray-200 dark:bg-gray-700'
    : isRounded
      ? 'flex overflow-x-auto scrollbar-none rounded-lg p-0.5 bg-gray-200 dark:bg-gray-800'
      : 'flex overflow-x-auto scrollbar-none rounded-full bg-gray-200/70 p-1 shadow-sm ring-1 ring-black/5 backdrop-blur-md dark:bg-gray-700/60 dark:ring-white/10';

  const activeClass = isPill
    ? 'bg-gray-600 dark:bg-gray-500 text-white'
    : isRounded
      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm dark:shadow-none'
      : 'bg-white text-gray-900 shadow-sm dark:bg-gray-950 dark:text-white';

  const inactiveClass = isPill
    ? 'text-gray-500 dark:text-gray-300'
    : isRounded
      ? 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
      : 'text-gray-700 dark:text-gray-200';

  const btnBase = isPill
    ? 'flex-1 shrink-0 whitespace-nowrap py-1.5 px-4 text-sm font-medium rounded-full transition-colors'
    : isRounded
      ? 'flex-1 shrink-0 whitespace-nowrap py-2 px-3 text-sm rounded-md font-medium transition-colors'
      : 'flex-1 shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[15px] font-medium transition-colors';

  return (
    <div className={wrapperClass}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          className={`cursor-pointer ${btnBase} ${value === opt.value ? activeClass : inactiveClass}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
