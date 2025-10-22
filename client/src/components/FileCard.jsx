import { useState } from "react";
import { FaTrash, FaDownload } from "react-icons/fa";
import Loader from "./Loader";
import FileIcon from "./FileIcon"; 

const formatFileSize = (bytes) => {
  if (bytes === null || bytes === undefined) return "-";
  if (bytes === 0) return '0 Bytes';
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  if (i < 0) return `${bytes} Bytes`;
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
};

const FileCard = ({ file, onDelete, onDownload }) => {
  const [loading, setLoading] = useState(false);

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

  const handleDownload = async () => {
    setLoading(true);
    try {
      const url = await onDownload(file.fileId);
      if (!url) {
        throw new Error("Download URL could not be retrieved.");
      }
      
      const link = document.createElement('a');
      link.href = url;
      
      link.setAttribute('download', file.fileName);
      
      document.body.appendChild(link);
      link.click();
      link.remove();

    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setLoading(true);
    onDelete(file.fileId)
      .then(() => setLoading(false))
      .catch(() => setLoading(false));
  };

  return (
    <div
      className="bg-transparent text-gray-100 rounded-lg border-2 border-blue-300 p-4 w-full hover:border-blue-400 hover:bg-blue-300/25 hover:scale-105 transform transition-all duration-200 ease-in-out relative overflow-hidden"
      title={file.fileName}
    >
      {loading && (
        <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-40 rounded-xl z-10">
          <Loader />
        </div>
      )}

      <div className="flex flex-col items-center space-y-4">
        <div className="text-center w-full min-w-0 overflow-hidden">
          <div className="flex justify-center mb-3 h-[76px] items-center">
            <FileIcon fileName={file.fileName} />
          </div>
          <h3 className="text-sm sm:text-l font-semibold truncate w-full clamp-ch-18">{file.fileName}</h3>
          <p className="text-sm text-gray-300 truncate">{formatFileSize(file.fileSize)}</p>
          <p className="text-xs text-gray-400">{formatTimestamp(file.uploadedAt)}</p>
        </div>

        <div className="flex space-x-3 mt-4">
          <button
            onClick={handleDownload}
            className="w-10 h-10 rounded-md text-blue-300 hover:text-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300 border border-blue-300 flex items-center justify-center transition-colors duration-150"
            aria-label={`Download ${file.fileName}`}
            title="Download"
          >
            <FaDownload className="text-base" />
          </button>
          <button
            onClick={handleDelete}
            className="w-10 h-10 rounded-md text-red-400 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 border border-red-400 flex items-center justify-center transition-colors duration-150"
            aria-label={`Delete ${file.fileName}`}
            title="Delete"
          >
            <FaTrash className="text-base" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileCard;