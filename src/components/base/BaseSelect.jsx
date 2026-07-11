import BaseIcon from './BaseIcon';

function buildSelectClass({ plain, size, hasError, disabled }) {
  const sizeBox =
    size === 'small'
      ? 'px-3 py-1.5 text-base sm:text-sm'
      : 'px-3 py-2 text-base';

  if (plain) {
    const state = disabled ? 'opacity-60 cursor-not-allowed' : '';
    return `absolute inset-0 w-full h-full opacity-0 cursor-pointer ${state}`;
  }

  let border =
    'border-input-border dark:border-gray-600 hover:border-primary-dark dark:hover:border-primary';
  if (hasError) {
    border =
      'border-input-error focus:border-input-error focus:ring-1 focus:ring-input-error';
  }
  let bg = 'bg-white dark:bg-gray-800 cursor-pointer';
  if (disabled) {
    bg = 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-60';
  }
  return `w-full ${sizeBox} text-gray-900 dark:text-gray-100 border rounded outline-none transition-colors appearance-none pr-8 ${border} ${bg}`;
}

function buildChevronClass({ plain, disabled }) {
  if (plain) return 'stroke-primary-dark dark:stroke-btn-primary';
  if (disabled) return 'stroke-gray-400 dark:stroke-gray-500';
  return 'stroke-gray-500 dark:stroke-gray-400';
}

const BaseSelect = ({
  options = [],
  label,
  value,
  defaultValue,
  onChange,
  disabled = false,
  mandatory = false,
  placeholder,
  helperText,
  errorMessage,
  size = 'small',
  fullWidth = true,
  plain = false,
  className = '',
}) => {
  const hasError = !!errorMessage;

  const handleChange = (e) => {
    if (onChange) onChange(e.target.value);
  };

  const selectValue = value === undefined ? defaultValue : value;

  const selectClass = buildSelectClass({ plain, size, hasError, disabled });
  const sizePlain =
    size === 'small' ? 'py-1.5 text-base sm:text-sm' : 'py-2 text-base';
  const selectedLabel = options.find((opt) => opt.value === selectValue)?.label;

  return (
    <div className={`${fullWidth ? 'w-full' : 'inline-block'} ${className}`}>
      {label && (
        <label
          className={`block text-sm font-medium mb-1 ${hasError ? 'text-input-label-error' : 'text-input-label'}`}
        >
          {label}
          {mandatory && ' *'}
        </label>
      )}
      {plain ? (
        <div className="relative inline-flex items-center gap-1">
          <span
            className={`${sizePlain} text-primary-dark dark:text-btn-primary ${disabled ? 'opacity-60' : ''}`}
          >
            {selectedLabel}
          </span>
          <BaseIcon
            icon="arrowDown"
            size="xs"
            className={buildChevronClass({ plain, disabled })}
          />
          <select
            value={selectValue ?? ''}
            onChange={handleChange}
            disabled={disabled}
            required={mandatory}
            className={selectClass}
          >
            {placeholder && (
              <option value="" disabled className="text-sm">
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="text-sm">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="relative flex items-center">
          <select
            value={selectValue ?? ''}
            onChange={handleChange}
            disabled={disabled}
            required={mandatory}
            className={selectClass}
          >
            {placeholder && (
              <option value="" disabled className="text-sm">
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="text-sm">
                {opt.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2">
            <BaseIcon
              icon="arrowDown"
              size="xs"
              className={buildChevronClass({ plain, disabled })}
            />
          </span>
        </div>
      )}
      {(hasError || helperText) && (
        <p
          className={`mt-1 text-xs ${hasError ? 'text-input-label-error' : 'text-input-helper'}`}
        >
          {errorMessage ?? helperText}
        </p>
      )}
    </div>
  );
};

export default BaseSelect;
