import { useState, useEffect } from 'react';
import { iconMap } from '../utils/iconMap';
import { FaFileAlt, FaFolder } from 'react-icons/fa';

const FileIcon = ({ fileName, isFolder = false, size = 48 }) => {
  const [Icon, setIcon] = useState(null);

  useEffect(() => {
    let mounted = true;
    const getIcon = async () => {
      const lowerFileName = fileName?.toLowerCase() || '';
      const extension = lowerFileName.split('.').pop();
      const mapped = iconMap.get(lowerFileName) || iconMap.get(extension);
      const iconName = mapped || (isFolder ? 'folder-app' : 'default');

      try {
        const iconModule = await import(`../assets/icons/${iconName}.svg`);
        if (mounted) setIcon(iconModule.default);
      } catch (error) {
        if (mounted) setIcon(() => null);
      }
    };

    getIcon();
    return () => { mounted = false; };
  }, [fileName, isFolder]);

  const px = typeof size === 'number' ? `${size}px` : size;

  // container ensures consistent visual size; inner uses object-contain
  const containerStyle = { width: px, height: px, display: 'inline-block' };
  const innerStyle = { width: '100%', height: '100%', objectFit: 'contain', display: 'block' };

  if (!Icon) {
    return isFolder ? (
      <span style={containerStyle}>
        <FaFolder style={innerStyle} />
      </span>
    ) : (
      <span style={containerStyle}>
        <FaFileAlt style={innerStyle} />
      </span>
    );
  }

  return <span style={containerStyle}><img src={Icon} alt={`${fileName} icon`} style={innerStyle} /></span>;
};

export default FileIcon;