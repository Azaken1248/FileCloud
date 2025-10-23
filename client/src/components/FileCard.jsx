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

const FileCard = ({ file, onDelete, onDownload }) => {
  const [loading, setLoading] = useState(false);

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
      className=" text-text rounded-lg border-2 bg-mantle border-pink p-4 w-full hover:border-pink hover:bg-surface0 hover:scale-105 transform transition-all duration-200 ease-in-out relative overflow-hidden"
      title={file.fileName}
    >
      {loading && (
        <div className="absolute inset-0 flex justify-center items-center bg-base bg-opacity-70 rounded-lg z-10">
          <Loader />
        </div>
      )}

      <div className="flex flex-col items-center space-y-4">
        <div className="text-center min-w-0 overflow-hidden w-auto">
          <div className="flex justify-center mb-3 h-[76px] items-center">
            <FileIcon fileName={file.fileName} />
          </div>
          <h3 className="text-sm sm:text-l font-semibold truncate text-center block mx-auto clamp-ch-18 text-text">{file.fileName}</h3>
          <p className="text-sm text-subtext1 truncate text-center block mx-auto clamp-ch-18">{formatFileSize(file.fileSize)}</p>
          <p className="text-xs text-subtext0 text-center block mx-auto clamp-ch-18">{formatTimestamp(file.uploadedAt)}</p>
        </div>

        <div className="flex space-x-3 mt-4">
          <button
            onClick={handleDownload}
            className="w-10 h-10 rounded-md text-peach hover:text-flamingo focus:outline-none focus:ring-2 focus:ring-peach border-2 border-sapphire hover:bg-peach/10 flex items-center justify-center transition-colors duration-150"
            aria-label={`Download ${file.fileName}`}
            title="Download"
          >
            <FaDownload className="text-sapphire" />
          </button>
          <button
            onClick={handleDelete}
            className="w-10 h-10 rounded-md text-red hover:text-maroon focus:outline-none focus:ring-2 focus:ring-red border-2 border-red hover:bg-red/10 flex items-center justify-center transition-colors duration-150"
            aria-label={`Delete ${file.fileName}`}
            title="Delete"
          >
            <FaTrash className="text-red" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileCard;