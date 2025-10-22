import { useState } from 'react';
import FileIcon from './FileIcon';
import { FaTrash, FaDownload } from 'react-icons/fa';
import Loader from './Loader';

const formatTimestamp = (iso) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const now = Date.now();
  const diff = Math.floor((now - d.getTime()) / 1000);
  if (diff < 10) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 60 * 86400) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleString();
};

const formatFileSize = (bytes) => {
  if (bytes === null || bytes === undefined) return "-";
  if (bytes === 0) return '0 Bytes';
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  if (i < 0) return `${bytes} Bytes`;
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
};

const ListRow = ({ item, onOpen, onDownload, onDelete }) => {
  const isFolder = item.type === 'folder';
  const [deleting, setDeleting] = useState(false);

  const handleDeleteClick = async (e) => {
    e.stopPropagation();
    try {
      setDeleting(true);
      if (onDelete) await onDelete(item.fileId);
    } catch (err) {
      console.error('Delete failed', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleRowClick = () => {
    if (isFolder && onOpen) onOpen(item);
  };

  return (
    <div onClick={handleRowClick} className="relative flex items-center gap-4 p-3 hover:bg-gray-700 border-b border-blue-300 last:border-b-0 cursor-pointer">
      <div className="w-8 flex items-center justify-center">
        <FileIcon fileName={item.fileName} isFolder={isFolder} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="min-w-0 overflow-hidden clamp-ch-18">
            <div className="truncate font-semibold">{item.fileName}</div>
          </div>
          <div className="text-sm text-gray-300 ml-4">{isFolder ? formatFileSize(item.folderSize) : formatFileSize(item.fileSize)}</div>
        </div>
          <div className="text-xs text-gray-400 mt-1 flex items-center justify-between">
          <div className="truncate">{formatTimestamp(item.uploadedAt)}</div>
          <div className="flex items-center mobile-tight-actions">
              <button onClick={(e) => { e.stopPropagation(); onDownload && onDownload(item); }} className="text-blue-300 hover:text-blue-200 p-2 rounded-md mobile-small-action" title="Download">
                <FaDownload className="w-5 h-5" />
              </button>
            <button onClick={handleDeleteClick} className="text-red-400 hover:text-red-300 p-2 rounded-md mobile-small-action" title="Delete">
              <FaTrash className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      {deleting && (
        <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-40 z-10">
          <Loader />
        </div>
      )}
    </div>
  );
};

export default ListRow;
