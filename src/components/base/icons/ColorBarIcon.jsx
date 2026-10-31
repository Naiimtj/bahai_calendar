import { getIconSize } from '../../../utils/sizeIcon';

const ColorBarIcon = ({
  size = 'md',
  color = '#000',
  className = '',
  ...props
}) => {
  const iconSize = getIconSize(size);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={iconSize}
      height={iconSize}
      viewBox="0 0 4 4"
      preserveAspectRatio="none"
      fill={color}
      className={className}
      {...props}
    >
      <rect width="4" height="4" />
    </svg>
  );
};

export default ColorBarIcon;
