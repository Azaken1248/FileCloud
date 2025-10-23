import { FaTrash, FaDownload, FaFileImage, FaFileVideo, FaFileAudio, FaFileAlt, FaFileArchive, FaCode, FaEllipsisH } from 'react-icons/fa';
import FileIcon from './FileIcon';
import osuBlue from '../assets/icons/osu-blue.svg';

const humanSize = (bytes) => {
  if (bytes === null || bytes === undefined) return '-';
  if (bytes === 0) return '0 B';
  const sizes = ['B','KB','MB','GB','TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  if (i === -Infinity || i < 0) return '0 B';
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
};

const InfoPanel = ({ totalBytes = 0, recentFiles = [], typeBreakdown = [], largestFiles = [], onDownload, onDelete }) => {
  const usedGB = (totalBytes / (1024 ** 3));
  const totalBytesSafe = totalBytes || 0;

  const iconFor = (key) => {
    switch (key) {
      case 'Images': return <FaFileImage className="text-sky" />;
      case 'Video': return <FaFileVideo className="text-teal" />;
      case 'Audio': return <FaFileAudio className="text-flamingo" />;
      case 'Documents': return <FaFileAlt className="text-lavender" />;
      case 'Archives': return <FaFileArchive className="text-yellow" />;
      case 'Osu': return <img src={osuBlue} alt="Osu" className="w-full h-full object-contain" />;
      case 'Code': return <FaCode className="text-mauve" />;
      default: return <FaEllipsisH className="text-overlay1" />;
    }
  };

  const visibleCategories = (typeBreakdown || []).filter((row) => Number(row.bytes || 0) > 0);

  const MobileCard = (
    <div className="block lg:hidden">
      <div className="bg-mantle text-text p-4 rounded-lg border border-surface2 mb-3">
        <div className="text-sm text-subtext1">Used</div>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-medium text-text">{humanSize(totalBytes)}</div>
          <div className="text-xs text-subtext0">{usedGB.toFixed(2)} GB</div>
        </div>
        <div className="w-full h-2 bg-surface1 rounded mt-3 overflow-hidden border border-surface2">
          <div className="h-full bg-green rounded" style={{ width: Math.min(100, usedGB / 10 * 100) + '%' }} />
        </div>
      </div>

      <div className="bg-mantle p-3 rounded-lg mb-3 border border-surface2">
        <h4 className="text-sm font-semibold mb-2 text-subtext1">By category</h4>
        {visibleCategories.length === 0 ? (
          <div className="text-xs text-subtext0">No data</div>
        ) : (
          <div className="space-y-2">
            {visibleCategories.map((row) => {
              const pct = totalBytesSafe > 0 ? (row.bytes / totalBytesSafe) * 100 : 0;
              return (
                <div key={row.key} className="flex items-center justify-between bg-mantle p-2 border-surface2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-6 h-6 flex items-center justify-center">{iconFor(row.key)}</div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-text">{row.key}</div>
                      <div className="text-xs text-subtext1">{(row.bytes/1024/1024).toFixed(2)} MB</div>
                    </div>
                  </div>
                  <div className="text-xs text-subtext0 w-20 text-right">{pct.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const desktopVariant = (
    <aside className="hidden lg:block w-72 bg-mantle text-text p-4 rounded-lg border border-surface1">
      <h3 className="text-lg font-semibold mb-3 text-subtext1">Storage & Activity</h3>

      <div className="mb-4">
        <div className="text-sm text-subtext0">Used</div>
        <div className="flex items-baseline justify-between">
          <div className="text-xl font-medium text-text">{humanSize(totalBytes)}</div>
          <div className="text-xs text-subtext0">{usedGB.toFixed(2)} GB</div>
        </div>
        <div className="w-full h-2 bg-base rounded mt-3 overflow-hidden border border-surface1">
          <div className="h-full bg-green rounded" style={{ width: Math.min(100, usedGB / 10 * 100) + '%' }} />
        </div>
      </div>

      <div className="mb-3">
        <h4 className="text-sm font-semibold mb-2 text-subtext1">By category</h4>
        <div className="space-y-2 hide-scrollbar">
          {visibleCategories.length === 0 && <div className="text-xs text-subtext0">No data</div>}
          {visibleCategories.map((row) => {
            const pct = totalBytesSafe > 0 ? (row.bytes / totalBytesSafe) * 100 : 0;
            return (
              <div key={row.key} className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-5 h-5 flex items-center justify-center">{iconFor(row.key)}</div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-text">{row.key}</div>
                    <div className="text-xs text-subtext1">{(row.bytes/1024/1024).toFixed(2)} MB</div>
                  </div>
                </div>
                <div className="text-xs text-subtext0 w-20 text-right">{pct.toFixed(1)}%</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-semibold mb-2 text-subtext1">Recent</h4>
        <div className="max-h-44 overflow-y-auto overscroll-contain pr-0 hide-scrollbar">
          {recentFiles.length === 0 && <div className="text-sm text-subtext0 p-3 text-center">No recent files</div>}
          {recentFiles.map((f) => (
            <div
              key={f.fileId || f.fileName}
              onClick={() => { if (f.type === 'folder') {} }}
              className={`relative flex items-center gap-3 p-3 hover:bg-surface1 border-b border-surface1 last:border-b-0 ${f.type === 'folder' ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className="w-6 h-6 flex-shrink-0">
                <FileIcon fileName={f.fileName} isFolder={f.type === 'folder'} size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate font-semibold text-sm text-text">{f.fileName}</div>
                <div className="text-xs text-subtext1">{f.fileSize ? humanSize(f.fileSize) : (f.folderSize ? humanSize(f.folderSize) : '-')}</div>
              </div>
              <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                <button onClick={(e) => { e.stopPropagation(); onDownload && onDownload(f); }} title="Download" className="p-2 text-blue hover:text-sapphire rounded">
                  <FaDownload className="w-3 h-3" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDelete && onDelete(f.fileId); }} title="Delete" className="p-2 text-red hover:text-maroon rounded">
                  <FaTrash className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2">
        <h4 className="text-sm font-semibold mt-3 mb-2 text-subtext1">Top largest files</h4>
        <div className="max-h-40 overflow-y-auto overscroll-contain pr-0 hide-scrollbar">
          {largestFiles.length === 0 && <div className="text-sm text-subtext0 p-3 text-center">No files</div>}
          {largestFiles.map((f) => (
            <div
              key={f.fileId || f.fileName}
              onClick={() => { if (f.type === 'folder') {} }}
              className={`relative flex items-center gap-3 p-3 hover:bg-surface1 border-b border-surface1 last:border-b-0 ${f.type === 'folder' ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className="w-6 h-6 flex-shrink-0">
                <FileIcon fileName={f.fileName} isFolder={f.type === 'folder'} size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="truncate font-semibold text-sm text-text">{f.fileName}</div>
                <div className="text-xs text-subtext1">{f.fileSize ? humanSize(f.fileSize) : (f.folderSize ? humanSize(f.folderSize) : '-')}</div>
              </div>
              <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                <button onClick={(e) => { e.stopPropagation(); onDownload && onDownload(f); }} title="Download" className="p-2 text-blue hover:text-sapphire rounded">
                  <FaDownload className="w-3 h-3" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDelete && onDelete(f.fileId); }} title="Delete" className="p-2 text-red hover:text-maroon rounded">
                  <FaTrash className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {MobileCard}
      {desktopVariant}
    </>
  );
};

export default InfoPanel;