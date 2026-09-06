import { getIconSize } from '../../../utils/sizeIcon';

const DensityDetailsIcon = ({
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
      viewBox="0 0 24 24"
      fill={color}
      className={className}
      {...props}
    >
      <path d="M4 4h16v7H4zm0 9h16v7H4z" />
    </svg>
  );
};
export default DensityDetailsIcon;
