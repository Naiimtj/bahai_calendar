import { getIconSize } from '../../../utils/sizeIcon';

const StarNineIcon = ({
  size = 'md',
  color = 'currentColor',
  className = '',
  ...props
}) => {
  const iconSize = getIconSize(size);
  const points = Array.from({ length: 18 }, (_, index) => {
    const angle = (index * Math.PI) / 9 - Math.PI / 2;
    const radius = index % 2 === 0 ? 11 : 7.2;
    return `${12 + Math.cos(angle) * radius},${12 + Math.sin(angle) * radius}`;
  }).join(' ');

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
      <polygon points={points} />
    </svg>
  );
};

export default StarNineIcon;
