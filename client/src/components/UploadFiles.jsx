import React, { useState } from "react";
import { FaCloudUploadAlt, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

const UploadFiles = ({ onUploadSuccess }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files); 
    console.log("Selected files:", selectedFiles); 
    setFiles(selectedFiles);
    setUploadError(null); 
  };

  const handleUpload = async () => {
    if (!files || files.length === 0) {
      setUploadError("No files selected");
      return;
    }
  
    setUploading(true);
    setProgress(0);
  
    const formData = new FormData();
    files.forEach((file) => {
        console.log("Original file:", file);
      
        const fileData = {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          fileUrl: "", 
          uploadedAt: new Date().toISOString(),
          userEmail: localStorage.getItem("username"), 
        };
      
        console.log("Appending file data:", fileData);
      
        formData.append("file", file); 
        formData.append("fileData", JSON.stringify(fileData)); 
      });
      
  
    const username = localStorage.getItem("username");
    if (username) {
      formData.append("username", username);
    } else {
      setUploadError("Username not found");
      setUploading(false);
      return;
    }
  
    try {
      const response = await fetch("https://skibidi2.rrex.cc/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error("Upload failed");
      }
  
      const data = await response.json();
      console.log("Upload success response:", data); 
      setUploading(false);
      setProgress(100);
      onUploadSuccess(data); 
      window.location.reload();
    } catch (error) {
      setUploading(false);
      console.error("Upload error:", error); 
      setUploadError(error.message);
    }
  };
  

  return (
    <div className="bg-gray-700 text-gray-100 rounded-xl shadow-md p-6 mx-auto max-w-lg">
      <h3 className="text-xl font-semibold mb-4 text-center">Upload Files</h3>

      <div className="mb-6">
        <label htmlFor="file-upload" className="block text-center text-lg mb-2">
          Select Files to Upload
        </label>
        <input
          id="file-upload"
          type="file"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer text-blue-400 hover:text-blue-300 transition duration-300 ease-in-out"
        >
          <FaCloudUploadAlt className="inline text-4xl mr-2" />
          Choose Files
        </label>
      </div>

      <div className="mb-6">
        <h4 className="text-lg">Selected Files</h4>
        {Array.isArray(files) && files.length > 0 ? (
          <ul className="list-disc pl-6 space-y-2">
            {files.map((file, index) => (
              <li key={index} className="text-sm text-gray-300">
                {file.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400">No files selected.</p>
        )}
      </div>

      {uploading && (
        <div className="mb-6">
          <p className="text-sm text-gray-300">Uploading...</p>
          <div className="h-2 bg-gray-500 rounded-full w-full mt-2">
            <div
              className="h-full bg-blue-600 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {uploadError && (
        <div className="mb-4 p-4 bg-red-600 text-white rounded-md flex items-center space-x-2">
          <FaExclamationCircle />
          <p className="text-sm">{uploadError}</p>
        </div>
      )}

      {!uploading && !uploadError && files.length > 0 && (
        <div className="mb-6">
          <button
            onClick={handleUpload}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg transition duration-300 ease-in-out"
          >
            Upload Files
          </button>
        </div>
      )}

      {!uploading && files.length === 0 && (
        <p className="text-sm text-gray-400 text-center">
          No files selected. Please select files to upload.
        </p>
      )}

      {uploading === false && progress === 100 && !uploadError && (
        <div className="p-4 bg-green-600 text-white rounded-md flex items-center space-x-2">
          <FaCheckCircle />
          <p className="text-sm">Files uploaded successfully!</p>
        </div>
      )}
    </div>
  );
};

export default UploadFiles;
