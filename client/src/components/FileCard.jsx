import React, { useState } from "react";
import { FaFile, FaTrash, FaDownload} from "react-icons/fa";
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

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
};

const getFileIcon = (fileName) => {
  if (!fileName) {
    return <FaFile className="text-gray-300 text-6xl" />;
  }

  const extension = fileName.split(".").pop().toLowerCase();

  const iconMapping = {
    pdf: <FaFilePdf className="text-red-600 text-6xl" />,
    doc: <FaFileWord className="text-blue-600 text-6xl" />,
    docx: <FaFileWord className="text-blue-600 text-6xl" />,
    xls: <FaFileExcel className="text-green-600 text-6xl" />,
    xlsx: <FaFileExcel className="text-green-600 text-6xl" />,
    csv: <FaFileExcel className="text-green-500 text-6xl" />,
    ppt: <FaFile className="text-orange-600 text-6xl" />,
    pptx: <FaFile className="text-orange-600 text-6xl" />,

    png: <FaFileImage className="text-orange-600 text-6xl" />,
    jpg: <FaFileImage className="text-orange-600 text-6xl" />,
    jpeg: <FaFileImage className="text-orange-600 text-6xl" />,
    gif: <FaFileImage className="text-orange-600 text-6xl" />,
    bmp: <FaFileImage className="text-blue-700 text-6xl" />,
    tiff: <FaFileImage className="text-yellow-700 text-6xl" />,

    mp4: <FaFileVideo className="text-purple-600 text-6xl" />,
    mov: <FaFileVideo className="text-purple-600 text-6xl" />,
    avi: <FaFileVideo className="text-purple-700 text-6xl" />,
    mkv: <FaFileVideo className="text-indigo-600 text-6xl" />,

    mp3: <FaFileAudio className="text-teal-600 text-6xl" />,
    wav: <FaFileAudio className="text-teal-600 text-6xl" />,
    flac: <FaFileAudio className="text-blue-500 text-6xl" />,

    zip: <FaFileArchive className="text-yellow-600 text-6xl" />,
    rar: <FaFileArchive className="text-yellow-600 text-6xl" />,
    tar: <FaFileArchive className="text-yellow-700 text-6xl" />,
    gz: <FaFileArchive className="text-yellow-800 text-6xl" />,

    txt: <FaFileAlt className="text-gray-500 text-6xl" />,
    md: <FaFileAlt className="text-gray-500 text-6xl" />, 
    js: <FaFileCode className="text-yellow-400 text-6xl" />,
    ts: <FaFileCode className="text-blue-400 text-6xl" />, 
    jsx: <FaFileCode className="text-blue-500 text-6xl" />,
    tsx: <FaFileCode className="text-blue-500 text-6xl" />,
    css: <FaFileCode className="text-blue-400 text-6xl" />,
    scss: <FaFileCode className="text-pink-400 text-6xl" />,
    html: <FaFileCode className="text-red-400 text-6xl" />,
    xml: <FaFileCode className="text-orange-400 text-6xl" />,
    json: <FaFileCode className="text-green-500 text-6xl" />,
    yaml: <FaFileAlt className="text-yellow-500 text-6xl" />,
    yml: <FaFileAlt className="text-yellow-500 text-6xl" />,

    c: <FaFileCode className="text-gray-400 text-6xl" />,
    cpp: <FaFileCode className="text-gray-400 text-6xl" />,
    py: <FaFileCode className="text-blue-500 text-6xl" />,
    java: <FaFileCode className="text-red-500 text-6xl" />,
    php: <FaFileCode className="text-violet-500 text-6xl" />,
    rb: <FaFileCode className="text-red-600 text-6xl" />, 
    go: <FaFileCode className="text-teal-500 text-6xl" />, 
    cs: <FaFileCode className="text-purple-500 text-6xl" />, 
    kotlin: <FaFileCode className="text-orange-500 text-6xl" />,

    osu: <FaFileAudio className="text-pink-500 text-6xl" />, 
    osz: <FaFileAudio className="text-pink-500 text-6xl" />,  

    env: <FaFileAlt className="text-gray-400 text-6xl" />,
    ini: <FaFileAlt className="text-gray-300 text-6xl" />,
    config: <FaFileAlt className="text-gray-500 text-6xl" />,
    settings: <FaFileAlt className="text-gray-500 text-6xl" />,
    log: <FaFileAlt className="text-gray-400 text-6xl" />,
    sh: <FaFileCode className="text-green-400 text-6xl" />,
    bat: <FaFileCode className="text-blue-500 text-6xl" />,
    dockerfile: <FaFileAlt className="text-blue-500 text-6xl" />,
    makefile: <FaFileAlt className="text-gray-500 text-6xl" />,

    vue: <FaFileCode className="text-green-500 text-6xl" />,
    svelte: <FaFileCode className="text-orange-500 text-6xl" />,
    angular: <FaFileCode className="text-red-500 text-6xl" />,

    default: <FaFile className="text-gray-300 text-6xl" />,
  };

  return iconMapping[extension] || iconMapping.default;
};


const FileCard = ({ file, onDelete, onDownload }) => {
  const [loading, setLoading] = useState(false); 

  const handleDownload = () => {
    setLoading(true);
    onDownload(file.fileId) 
      .finally(() => setLoading(false)); 
  };

  const handleDelete = () => {
    setLoading(true);
    onDelete(file.fileId) 
      .finally(() => {setLoading(false);window.location.reload()});
  }

  return (
    <div className="bg-gray-700 text-gray-100 rounded-xl shadow-md p-6 w-full sm:max-w-md hover:scale-105 transition-transform duration-300 ease-in-out relative overflow-hidden">

      {loading && (
        <div className="absolute inset-0 flex justify-center items-center bg-black bg-opacity-40 rounded-xl z-10">
          <Loader />
        </div>
      )}

      <div className="flex flex-col items-center space-y-4">
        <div className="text-center">
          <div className="flex justify-center mb-3">
            {getFileIcon(file.fileName)}
          </div>
          <h3 className="text-sm sm:text-l font-semibold truncate w-full overflow-ellipsis">{file.fileName}</h3>
          <p className="text-sm text-gray-300 truncate">{formatFileSize(file.fileSize)}</p>
          <p className="text-xs text-gray-400">{file.uploadedAt}</p>
        </div>

        <div className="flex space-x-4 mt-4">
          <button
            onClick={handleDownload}
            className="bg-gray-600 hover:bg-gray-500 border-2 border-gray-500 px-3 py-2 rounded-full flex items-center justify-center transition duration-300 ease-in-out transform hover:scale-105"
          >
            <FaDownload className="text-lg" />
            <span className="text-sm hidden sm:inline"></span>
          </button>
          <button
            onClick={handleDelete}
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
