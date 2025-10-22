import { useState } from "react";
import FileIcon from "./FileIcon";
import Loader from "./Loader";
import { FaTrash, FaDownload } from "react-icons/fa";

const FolderCard = ({ folder, onOpen, onDelete, onDownload }) => {
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async (e) => {
    e.stopPropagation();
    const confirm = window.confirm("Delete folder '" + folder.fileName + "'? This will delete all files and folders inside it. This action cannot be undone.");
    if (!confirm) return;
    setDeleting(true);
    try {
      if (typeof onDelete === "function") {
        await onDelete(folder.fileId);
      }
    } catch (err) {
      console.error("Folder delete failed", err);
      alert("Failed to delete folder");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="bg-transparent text-gray-100 rounded-lg border-2 border-blue-300 p-3 w-full sm:max-w-sm hover:border-blue-400 hover:bg-blue-300/25 hover:scale-105 transform transition-all duration-200 ease-in-out relative overflow-hidden cursor-pointer"
      title={folder.fileName}
      onClick={() => { if (!deleting) onOpen(folder); }}
    >
      {deleting && (
        <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-40 rounded-xl z-10">
          <Loader />
        </div>
      )}

      <div className="flex flex-col items-center space-y-4">
        <div className="text-center w-full min-w-0">
          <div className="flex justify-center mb-3 h-[76px] items-center">
            <FileIcon fileName={folder.fileName} isFolder={true} />
          </div>
          <h3 className="text-sm sm:text-lg font-semibold truncate w-full break-all">{folder.fileName}</h3>
          <p className="text-sm text-gray-300">{formatFileSize(folder.folderSize || 0)}</p>
          <p className="text-xs text-gray-400">{formatTimestamp(folder.uploadedAt)}</p>
        </div>
        <div className="flex justify-center mt-2">
          <div className="flex space-x-3">
            <button
              onClick={(e) => { e.stopPropagation(); if (onDownload) onDownload(folder); }}
              className="w-10 h-10 rounded-md text-blue-300 hover:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300 border border-blue-300 flex items-center justify-center transition-colors duration-150"
              aria-label={`Download folder ${folder.fileName}`}
              title="Download folder"
            >
              <FaDownload className="text-base" />
            </button>

            <button
              onClick={handleDelete}
              className="w-10 h-10 rounded-md text-red-400 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 border border-red-400 flex items-center justify-center transition-colors duration-150"
              aria-label={`Delete folder ${folder.fileName}`}
              title="Delete folder"
            >
              <FaTrash className="text-base" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FolderCard;
