import { useState } from "react";
import FileIcon from "./FileIcon";
import Loader from "./Loader";
import { FaTrash } from "react-icons/fa";

const FolderCard = ({ folder, onOpen, onDelete }) => {
  const [deleting, setDeleting] = useState(false);

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
      className="bg-gray-700 text-gray-100 rounded-xl shadow-md p-6 w-full sm:max-w-md hover:scale-105 transition-transform duration-300 ease-in-out relative overflow-hidden cursor-pointer"
      title={folder.fileName}
      onClick={() => { if (!deleting) onOpen(folder); }}
    >
      {deleting && (
        <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-40 rounded-xl z-10">
          <Loader />
        </div>
      )}
      {/* delete button moved to bottom to match requested layout */}

      <div className="flex flex-col items-center space-y-4">
        <div className="text-center w-full min-w-0">
          <div className="flex justify-center mb-3 h-[76px] items-center">
            <FileIcon fileName={folder.fileName} isFolder={true} />
          </div>
          <h3 className="text-sm sm:text-l font-semibold truncate w-full break-all">{folder.fileName}</h3>
          <p className="text-sm text-gray-300">{formatFileSize(folder.folderSize || 0)}</p>
          <p className="text-xs text-gray-400">{folder.uploadedAt}</p>
        </div>
        <div className="flex justify-center mt-4">
          <button
            onClick={handleDelete}
            className="w-12 h-10 rounded-full text-red-400 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 border-2 border-red-600 flex items-center justify-center transition duration-200 transform hover:scale-105 hover:bg-red-600/10"
            aria-label={`Delete folder ${folder.fileName}`}
            title="Delete folder"
          >
            <FaTrash className="text-lg" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FolderCard;
