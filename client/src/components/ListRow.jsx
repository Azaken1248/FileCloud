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
    <div onClick={handleRowClick} className={`relative flex items-center gap-4 p-3 hover:bg-surface0 border-b border-surface1 hover:border-surface1 first:rounded-t-md first:border-t first:border-surface1 last:rounded-b-md last:border-b-0 ${isFolder ? 'cursor-pointer' : 'cursor-default'}`}>
      <div className="w-8 flex-shrink-0 flex items-center justify-center">
        <FileIcon fileName={item.fileName} isFolder={isFolder} size={24} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="min-w-0 overflow-hidden clamp-ch-28">
            <div className="truncate font-semibold text-text">{item.fileName}</div>
          </div>
          <div className="text-sm text-subtext1 ml-4 flex-shrink-0">{isFolder ? formatFileSize(item.folderSize) : formatFileSize(item.fileSize)}</div>
        </div>
          <div className="text-xs text-subtext0 mt-1 flex items-center justify-between">
          <div className="truncate">{formatTimestamp(item.uploadedAt)}</div>
          <div className="flex items-center mobile-tight-actions">
              <button onClick={(e) => { e.stopPropagation(); onDownload && onDownload(item); }} className="text-blue hover:text-sapphire p-2 rounded-md mobile-small-action" title="Download">
                <FaDownload className="w-4 h-4" />
              </button>
            <button onClick={handleDeleteClick} className="text-red hover:text-maroon p-2 rounded-md mobile-small-action" title="Delete">
              <FaTrash className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      {deleting && (
        <div className="absolute inset-0 flex justify-center items-center bg-base bg-opacity-70 z-10 rounded">
          <Loader />
        </div>
      )}
    </div>
  );
};

export default ListRow;