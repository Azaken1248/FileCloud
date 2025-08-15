import { useState } from "react";
import { FaTrash, FaDownload } from "react-icons/fa";
import Loader from "./Loader";
import FileIcon from "./FileIcon"; 

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
};

const FileCard = ({ file, onDelete, onDownload }) => {
  const [loading, setLoading] = useState(false);

  const handleDownload = () => {
    setLoading(true);
    onDownload(file.fileId).finally(() => setLoading(false));
  };

  const handleDelete = () => {
    setLoading(true);
    onDelete(file.fileId).finally(() => setLoading(false));
  };

  return (
    <div
      className="bg-gray-700 text-gray-100 rounded-xl shadow-md p-6 w-full sm:max-w-md hover:scale-105 transition-transform duration-300 ease-in-out relative overflow-hidden"
      title={file.fileName}
    >
      {loading && (
        <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-40 rounded-xl z-10">
          <Loader />
        </div>
      )}

      <div className="flex flex-col items-center space-y-4">
        <div className="text-center w-full min-w-0">
          <div className="flex justify-center mb-3 h-[76px] items-center">
            <FileIcon fileName={file.fileName} />
          </div>
          <h3 className="text-sm sm:text-l font-semibold truncate w-full break-all">{file.fileName}</h3>
          <p className="text-sm text-gray-300 truncate">{formatFileSize(file.fileSize)}</p>
          <p className="text-xs text-gray-400">{file.uploadedAt}</p>
        </div>

        <div className="flex space-x-4 mt-4">
          <button
            onClick={handleDownload}
            className="bg-gray-600 hover:bg-gray-500 border-2 border-gray-500 px-4 py-2 rounded-full flex items-center justify-center gap-2 transition duration-300 ease-in-out transform hover:scale-105"
          >
            <FaDownload className="text-lg" />
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-500 border-2 border-red-600 px-4 py-2 rounded-full flex items-center justify-center gap-2 transition duration-300 ease-in-out transform hover:scale-105"
          >
            <FaTrash className="text-lg" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileCard;