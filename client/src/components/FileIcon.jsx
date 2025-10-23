import { useState, useEffect } from 'react';
import { iconMap } from '../utils/iconMap.js';
import { FaFileAlt, FaFolder } from 'react-icons/fa';

const FileIcon = ({ fileName, isFolder = false, size = 48 }) => {
  const [Icon, setIcon] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setIcon(null);

    const getIcon = async () => {
      const lowerFileName = fileName?.toLowerCase() || '';
      const extension = lowerFileName.split('.').pop();
      const mapped = iconMap.get(lowerFileName) || iconMap.get(extension);
      const iconName = mapped || (isFolder ? 'folder-app' : 'document');

      try {
        const iconModule = await import(`../assets/icons/${iconName}.svg`);
        if (mounted) {
          setIcon(iconModule.default);
        }
      } catch (error) {
        if (mounted) {
          setIcon(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getIcon();
    return () => { mounted = false; };
  }, [fileName, isFolder]);

  const px = typeof size === 'number' ? `${size}px` : size;

  const containerStyle = { width: px, height: px, display: 'inline-block', verticalAlign: 'middle' };
  const innerStyle = { width: '100%', height: '100%', objectFit: 'contain', display: 'block' };

  if (loading) {
    return <span style={containerStyle}></span>;
  }

  if (Icon) {
    return <span style={containerStyle}><img src={Icon} alt={`${fileName} icon`} style={innerStyle} /></span>;
  }

  return isFolder ? (
    <span style={containerStyle} className="text-sky">
      <FaFolder style={innerStyle} />
    </span>
  ) : (
    <span style={containerStyle} className="text-text">
      <FaFileAlt style={innerStyle} />
    </span>
  );
};

export default FileIcon;