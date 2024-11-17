import React, { useState } from "react";
import { FaFile, FaTrash, FaDownload, FaEye } from "react-icons/fa";
import { 
  FaFilePdf, 
  FaFileWord, 
  FaFileExcel, 
  FaFileImage, 
  FaFileVideo, 
  FaFileAudio, 
  FaFileArchive, 
  FaFileAlt, 
  FaFileCode 
} from "react-icons/fa";
import Loader from "./Loader"; 

const getFileIcon = (fileName) => {
  const extension = fileName.split(".").pop().toLowerCase();

  const iconMapping = {
    pdf: <FaFilePdf className="text-red-600 text-6xl" />,
    doc: <FaFileWord className="text-blue-600 text-6xl" />,
    docx: <FaFileWord className="text-blue-600 text-6xl" />,
    xls: <FaFileExcel className="text-green-600 text-6xl" />,
    xlsx: <FaFileExcel className="text-green-600 text-6xl" />,
    png: <FaFileImage className="text-orange-600 text-6xl" />,
    jpg: <FaFileImage className="text-orange-600 text-6xl" />,
    jpeg: <FaFileImage className="text-orange-600 text-6xl" />,
    gif: <FaFileImage className="text-orange-600 text-6xl" />,
    mp4: <FaFileVideo className="text-purple-600 text-6xl" />,
    mov: <FaFileVideo className="text-purple-600 text-6xl" />,
    mp3: <FaFileAudio className="text-teal-600 text-6xl" />,
    wav: <FaFileAudio className="text-teal-600 text-6xl" />,
    zip: <FaFileArchive className="text-yellow-600 text-6xl" />,
    rar: <FaFileArchive className="text-yellow-600 text-6xl" />,
    txt: <FaFileAlt className="text-gray-500 text-6xl" />,
    js: <FaFileCode className="text-yellow-400 text-6xl" />,
    css: <FaFileCode className="text-blue-400 text-6xl" />,
    html: <FaFileCode className="text-red-400 text-6xl" />,
    default: <FaFile className="text-gray-300 text-6xl" />,
  };

  return iconMapping[extension] || iconMapping.default;
};

const FileCard = ({ file, onDelete, onDownload, onPreview }) => {
  const [loading, setLoading] = useState(false); 

  const handleDownload = () => {
    setLoading(true);
    onDownload(file.id) 
      .finally(() => setLoading(false)); 
  };

  const handlePreview = () => {
    onPreview(file.id); 
  };

  return (
    <div className="bg-gray-700 text-gray-100 rounded-xl shadow-md p-6 mx-auto hover:scale-105 transition-transform duration-300 ease-in-out relative max-w-xs sm:max-w-md overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-40 rounded-xl z-10">
          <Loader />
        </div>
      )}

      <div className="flex flex-col items-center space-y-4">
        <div className="text-center">
          <div className="flex justify-center mb-3">
            {getFileIcon(file.name)}
          </div>
          <h3 className="text-lg sm:text-xl font-semibold truncate w-full overflow-ellipsis">{file.name}</h3>
          <p className="text-sm text-gray-300 truncate">{file.size}</p>
          <p className="text-xs text-gray-400">{file.lastModified}</p>
        </div>

        <div className="flex space-x-4 mt-4">
          <button
            onClick={handlePreview}
            className="bg-gray-600 hover:bg-gray-500 border-2 border-gray-500 px-3 py-2 rounded-full flex items-center justify-center transition duration-300 ease-in-out transform hover:scale-105"
          >
            <FaEye className="text-lg" />
            <span className="text-sm hidden sm:inline"></span>
          </button>
          <button
            onClick={handleDownload}
            className="bg-gray-600 hover:bg-gray-500 border-2 border-gray-500 px-3 py-2 rounded-full flex items-center justify-center transition duration-300 ease-in-out transform hover:scale-105"
          >
            <FaDownload className="text-lg" />
            <span className="text-sm hidden sm:inline"></span>
          </button>
          <button
            onClick={() => onDelete(file.id)}
            className="bg-red-600 hover:bg-red-500 border-2 border-red-600 px-3 py-2 rounded-full flex items-center justify-center transition duration-300 ease-in-out transform hover:scale-105"
          >
            <FaTrash className="text-lg" />
            <span className="text-sm hidden sm:inline"></span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileCard;
