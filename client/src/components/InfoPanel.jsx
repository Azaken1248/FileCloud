import { FaTrash, FaDownload, FaFileImage, FaFileVideo, FaFileAudio, FaFileAlt, FaFileArchive, FaCode, FaEllipsisH } from 'react-icons/fa';
import FileIcon from './FileIcon';
import osuBlue from '../assets/icons/osu-blue.svg';

const humanSize = (bytes) => {
  if (bytes === null || bytes === undefined) return '-';
  if (bytes === 0) return '0 B';
  const sizes = ['B','KB','MB','GB','TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
};

const InfoPanel = ({ totalBytes = 0, recentFiles = [], typeBreakdown = [], largestFiles = [], onDownload, onDelete }) => {
  const usedGB = (totalBytes / (1024 ** 3));
  const totalBytesSafe = totalBytes || 0;

  const iconFor = (key) => {
    switch (key) {
      case 'Images': return <FaFileImage className="text-blue-300" />;
      case 'Video': return <FaFileVideo className="text-blue-300" />;
      case 'Audio': return <FaFileAudio className="text-blue-300" />;
      case 'Documents': return <FaFileAlt className="text-blue-300" />;
      case 'Archives': return <FaFileArchive className="text-blue-300" />;
      case 'Osu': return <img src={osuBlue} alt="Osu" className="w-full h-full object-contain" />;
      case 'Code': return <FaCode className="text-blue-300" />;
      default: return <FaEllipsisH className="text-blue-300" />;
    }
  };

  const visibleCategories = (typeBreakdown || []).filter((row) => Number(row.bytes || 0) > 0);

  const MobileCard = (
    <div className="block lg:hidden">
  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg border-2 border-blue-300 mb-3">
        <div className="text-sm text-gray-300">Used</div>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-medium">{humanSize(totalBytes)}</div>
          <div className="text-xs text-gray-400">{usedGB.toFixed(2)} GB</div>
        </div>
  <div className="w-full h-2 bg-blue-900 rounded mt-3 overflow-hidden border-2 border-blue-800">
          <div className="h-2 bg-green-500 rounded" style={{ width: Math.min(100, usedGB / 10 * 100) + '%' }} />
        </div>
      </div>

  <div className="bg-gray-800 p-3 rounded-md mb-3 border-2 border-blue-300">
        <h4 className="text-sm font-semibold mb-2">By category</h4>
        {visibleCategories.length === 0 ? (
          <div className="text-xs text-blue-300">No data</div>
        ) : (
          <div className="space-y-2">
            {visibleCategories.map((row) => {
              const pct = totalBytesSafe > 0 ? (row.bytes / totalBytesSafe) * 100 : 0;
              return (
                <div key={row.key} className="flex items-center justify-between bg-gray-900 p-2 rounded">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-6 h-6 text-blue-300">{iconFor(row.key)}</div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{row.key}</div>
                      <div className="text-xs text-blue-200">{(row.bytes/1024/1024).toFixed(2)} MB</div>
                    </div>
                  </div>
                  <div className="text-xs text-blue-200 w-20 text-right">{pct.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );

  const desktopVariant = (
  <aside className="hidden lg:block w-72 bg-transparent text-gray-100 p-4 rounded-lg border-2 border-blue-300">
      <h3 className="text-lg font-semibold mb-3">Storage & Activity</h3>

      <div className="mb-4">
        <div className="text-sm text-gray-300">Used</div>
        <div className="flex items-baseline justify-between">
          <div className="text-xl font-medium">{humanSize(totalBytes)}</div>
          <div className="text-xs text-gray-400">{usedGB.toFixed(2)} GB</div>
        </div>

  <div className="w-full h-2 bg-blue-900 rounded mt-3 overflow-hidden border-2 border-blue-800">
          <div className="h-2 bg-green-500 rounded" style={{ width: Math.min(100, usedGB / 10 * 100) + '%' }} />
        </div>
      </div>

      <div className="mb-3">
        <h4 className="text-sm font-semibold mb-2">By category</h4>
        <div className="space-y-2 hide-scrollbar">
          {visibleCategories.length === 0 && <div className="text-xs text-blue-300">No data</div>}
          {visibleCategories.map((row) => {
            const pct = totalBytesSafe > 0 ? (row.bytes / totalBytesSafe) * 100 : 0;
            return (
              <div key={row.key} className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-5 h-5 text-center text-blue-300">{iconFor(row.key)}</div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{row.key}</div>
                    <div className="text-xs text-blue-200">{(row.bytes/1024/1024).toFixed(2)} MB</div>
                  </div>
                </div>
                <div className="text-xs text-blue-200 w-20 text-right">{pct.toFixed(1)}%</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-semibold mb-2">Recent</h4>
  <div className="space-y-2 max-h-44 overflow-y-auto overscroll-contain pr-0 hide-scrollbar">
          {recentFiles.length === 0 && <div className="text-sm text-blue-200">No recent files</div>}
          {recentFiles.map((f) => (
            <div key={f.fileId} className="flex items-center justify-between bg-transparent py-2 px-1 border-b border-blue-300">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-6 h-6"><FileIcon fileName={f.fileName} isFolder={f.type === 'folder'} size={18} /></div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{f.fileName}</div>
                  <div className="text-xs text-blue-200">{f.fileSize ? humanSize(f.fileSize) : (f.folderSize ? humanSize(f.folderSize) : '-')}</div>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-2">
                <button onClick={(e) => { e.stopPropagation(); onDownload && onDownload(f); }} title="Download" className="p-2 text-blue-300 hover:text-blue-200">
                  <FaDownload />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDelete && onDelete(f.fileId); }} title="Delete" className="p-2 text-red-400 hover:text-red-300">
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2">
        <h4 className="text-sm font-semibold mt-3 mb-2">Top largest files</h4>
  <div className="space-y-2 max-h-40 overflow-y-auto overscroll-contain pr-0 hide-scrollbar">
          {largestFiles.length === 0 && <div className="text-sm text-blue-200">No files</div>}
          {largestFiles.map((f) => (
            <div key={f.fileId} className="flex items-center justify-between bg-transparent py-2 px-1 border-b border-blue-300">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-6 h-6"><FileIcon fileName={f.fileName} isFolder={f.type === 'folder'} size={18} /></div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{f.fileName}</div>
                  <div className="text-xs text-blue-200">{f.fileSize ? humanSize(f.fileSize) : (f.folderSize ? humanSize(f.folderSize) : '-')}</div>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-2">
                <button onClick={(e) => { e.stopPropagation(); onDownload && onDownload(f); }} title="Download" className="p-2 text-blue-300 hover:text-blue-200">
                  <FaDownload />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onDelete && onDelete(f.fileId); }} title="Delete" className="p-2 text-red-400 hover:text-red-300">
                  <FaTrash />
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
