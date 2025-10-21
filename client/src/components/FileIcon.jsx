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
  const className = `inline-block`;

  if (!Icon) {
    return isFolder ? (
      <FaFolder className={className} style={{ width: px, height: px }} />
    ) : (
      <FaFileAlt className={className} style={{ width: px, height: px }} />
    );
  }

  return <img src={Icon} alt={`${fileName} icon`} style={{ width: px, height: px }} className={className} />;
};

export default FileIcon;