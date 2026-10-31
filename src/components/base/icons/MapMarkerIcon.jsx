import { getIconSize } from '../../../utils/sizeIcon';

const MapMarkerIcon = ({
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
      viewBox="0 0 36 36"
      fill={color}
      className={className}
      {...props}
    >
      <path d="M18 36 7.51 21.68A13 13 0 1 1 28.49 21.68Z" />
      <path
        className="fill-white"
        d="M14.25 11.75a3.75 3.75 0 1 0 7.5 0a3.75 3.75 0 1 0-7.5 0ZM17.2 15h1.6v5.5a.8.8 0 0 1-1.6 0Z"
      />
    </svg>
  );
};

export default MapMarkerIcon;
