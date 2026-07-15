import { useState, useRef, useEffect } from 'react';
import BaseIcon from './BaseIcon';
import BaseSpinner from './BaseSpinner';

const colorClasses = {
  primary: {
    contained:
      'bg-btn-primary dark:bg-btn-primary-dark text-white md:hover:bg-btn-primary-hover active:bg-btn-primary-active',
    outlined:
      'border border-btn-primary md:hover:bg-btn-primary/10 bg-white/10 rounded-full text-sm font-semibold px-4 py-2.5 active:bg-gray-100 text-gray-900 active:dark:bg-gray-800 dark:text-gray-100 backdrop-blur-sm md:hover:text-btn-primary-dark md:hover:dark:text-btn-primary',
    text: 'dark:text-btn-primary text-btn-primary-dark md:hover:underline md:hover:bg-transparent',
  },
  secondary: {
    contained:
      'bg-btn-secondary text-white md:hover:bg-btn-secondary-hover active:bg-btn-secondary-active',
    outlined:
      'border border-btn-secondary text-btn-secondary dark:text-btn-secondary-dark md:hover:bg-btn-secondary/30 active:bg-btn-secondary/20',
    text: 'dark:text-btn-secondary-dark text-btn-secondary md:hover:underline md:hover:bg-transparent',
  },
  success: {
    contained:
      'bg-success text-white md:hover:bg-success-hover active:bg-success-active',
    outlined:
      'border border-success text-success md:hover:bg-success/10 active:bg-success/20',
    text: 'dark:text-success text-success md:hover:underline md:hover:bg-transparent',
  },
  warning: {
    contained:
      'bg-warning text-white md:hover:bg-warning-hover active:bg-warning-active',
    outlined:
      'border border-warning text-warning md:hover:bg-warning/10 active:bg-warning/20',
    text: 'dark:text-warning text-warning md:hover:underline md:hover:bg-transparent',
  },
  danger: {
    contained:
      'bg-error text-white md:hover:bg-error-hover active:bg-error-active',
    outlined:
      'border border-error text-error md:hover:bg-error/10 active:bg-error/20',
    text: 'dark:text-error text-error md:hover:underline md:hover:bg-transparent',
  },
  info: {
    contained: 'bg-info text-white md:hover:bg-info-hover active:bg-info-active',
    outlined: 'border border-info text-info md:hover:bg-info/10 active:bg-info/20',
    text: 'dark:text-info text-info md:hover:underline md:hover:bg-transparent',
  },
  help: {
    contained:
      'bg-btn-secondary text-white md:hover:bg-btn-secondary-hover active:bg-btn-secondary-active',
    outlined:
      'border border-btn-secondary text-btn-secondary md:hover:bg-btn-secondary/10 active:bg-btn-secondary/20',
    text: 'dark:text-btn-secondary-dark text-btn-secondary md:hover:underline md:hover:bg-transparent',
  },
};

const sizes = ['small', 'large'];
const types = ['button', 'submit', 'reset'];
const tooltipPositions = ['top', 'bottom', 'left', 'right'];
const iconPositions = ['left', 'right', 'top', 'bottom'];

const determineStyle = (variant, outlined, text) => {
  if (text) return 'text';
  if (outlined) return 'outlined';
  if (variant === 'secondary') return 'outlined';
  return 'contained';
};

export const AppButton = ({
  label,
  type = types[0] || 'button',
  size = sizes[0] || 'small',
  className = '',
  loading = false,
  disabled = false,
  variant = 'primary',
  outlined = false,
  text = false,
  tooltip,
  tooltipPosition = tooltipPositions[0] || 'top',
  tooltipDisabled = false,
  tooltipShowDelay = 100,
  tooltipHideDelay = 0,
  icon,
  iconPosition = iconPositions[0] || 'left',
  iconSize,
  iconColor,
  iconClassName = '',
  htmlFor,
  children,
  onClick,
}) => {
  const buttonStyle = determineStyle(variant, outlined, text);
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimerRef = useRef(null);

  useEffect(() => {
    return () => clearTimeout(tooltipTimerRef.current);
  }, []);

  const handleTooltipEnter = () => {
    clearTimeout(tooltipTimerRef.current);
    tooltipTimerRef.current = setTimeout(
      () => setShowTooltip(true),
      tooltipShowDelay,
    );
  };

  const handleTooltipLeave = () => {
    clearTimeout(tooltipTimerRef.current);
    tooltipTimerRef.current = setTimeout(
      () => setShowTooltip(false),
      tooltipHideDelay,
    );
  };

  const hasPaddingOverride =
    className.includes('p-') ||
    className.includes('px-') ||
    className.includes('py-');

  const getPaddingClasses = () => {
    if (text) return 'p-0 bg-transparent shadow-none';
    if (hasPaddingOverride) return '';
    return 'px-3 py-2';
  };

  const getIconSize = () => {
    if (iconSize) return iconSize;
    return size === 'large' ? 'large' : 'md';
  };

  const getFlexDirection = () => {
    if (iconPosition === 'top') return 'flex-col';
    if (iconPosition === 'bottom') return 'flex-col-reverse';
    if (iconPosition === 'right') return 'flex-row-reverse';
    return 'flex-row';
  };

  const renderIcon = () => {
    if (!icon) return null;
    return (
      <BaseIcon
        icon={icon}
        size={getIconSize()}
        color={iconColor || 'currentColor'}
        className={iconClassName}
      />
    );
  };

  const renderContent = () => (
    <>
      {loading && (
        <BaseSpinner
          size={size === 'large' ? 'large' : 'md'}
          color="currentColor"
        />
      )}
      {!loading &&
        icon &&
        (iconPosition === 'left' || iconPosition === 'top') &&
        renderIcon()}
      {label || children}
      {!loading &&
        icon &&
        (iconPosition === 'right' || iconPosition === 'bottom') &&
        renderIcon()}
    </>
  );

  const contentButton = htmlFor ? (
    <label
      htmlFor={htmlFor}
      className={`flex items-center gap-2 ${getFlexDirection()} ${
        hasPaddingOverride ? '' : 'px-3 py-2'
      } ${className} ${
        size === 'large' ? 'px-6 py-3 text-lg font-semibold' : ''
      } ${
        disabled || loading
          ? 'pointer-events-none opacity-50 cursor-not-allowed'
          : 'cursor-pointer'
      }`}
    >
      {renderContent()}
    </label>
  ) : (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`inline-flex items-center justify-start gap-2 rounded text-sm font-medium transition-colors cursor-pointer ${getFlexDirection()} ${getPaddingClasses()} ${(colorClasses[variant] || colorClasses.primary)[buttonStyle] || ''} ${className} ${
        !text && size === 'large' ? 'px-6 py-3 text-lg font-semibold' : ''
      } ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {renderContent()}
    </button>
  );

  if (!tooltip || tooltipDisabled) {
    return contentButton;
  }

  const tooltipPlacementClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={handleTooltipEnter}
      onMouseLeave={handleTooltipLeave}
    >
      {contentButton}
      {showTooltip && (
        <span
          className={`absolute z-50 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg whitespace-nowrap pointer-events-none ${tooltipPlacementClasses[tooltipPosition] || tooltipPlacementClasses.top}`}
        >
          {tooltip}
        </span>
      )}
    </span>
  );
};

export default AppButton;
