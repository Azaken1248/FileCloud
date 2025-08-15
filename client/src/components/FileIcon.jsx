import React, { useState, useEffect } from 'react';
import { iconMap } from '../utils/iconMap';
import { FaFileAlt } from 'react-icons/fa';

const FileIcon = ({ fileName }) => {
  const [Icon, setIcon] = useState(null);

  useEffect(() => {
    const getIcon = async () => {
      const lowerFileName = fileName?.toLowerCase() || '';
      const extension = lowerFileName.split('.').pop();
      
      const iconName = iconMap.get(lowerFileName) || iconMap.get(extension) || 'default';

      try {
        const iconModule = await import(`../assets/icons/${iconName}.svg`);
        setIcon(iconModule.default);
      } catch (error) {
        setIcon(() => FaFileAlt);
      }
    };

    getIcon();
  }, [fileName]);

  if (!Icon) {
    return <div className="w-14 h-14 animate-pulse bg-gray-600 rounded"></div>;
  }
  
  const isSvgPath = typeof Icon === 'string';

  return isSvgPath ? (
    <img src={Icon} alt={`${fileName} icon`} className="w-14 h-14" />
  ) : (
    <Icon className="w-12 h-12 text-gray-400" />
  );
};

export default FileIcon;