import iconDefinitions from '../assets/material-icons.json';

const generateIconMap = () => {
  const map = new Map();
  const defs = iconDefinitions.iconDefinitions;


  for (const iconName in defs) {
    const def = defs[iconName];
    if (def.fileExtensions) {
      for (const ext of def.fileExtensions) {
        map.set(ext, iconName);
      }
    }
  }


  for (const iconName in defs) {
    const def = defs[iconName];
    if (def.fileNames) {
      for (const fileName of def.fileNames) {
        map.set(fileName.toLowerCase(), iconName);
      }
    }
  }

  return map;
};


export const iconMap = generateIconMap();