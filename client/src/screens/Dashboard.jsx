import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import FileCard from "../components/FileCard";
import SearchBar from "../components/SearchBar";
import UploadFiles from "../components/UploadFiles";
import Loader from "../components/Loader";

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); 
  const [previewFile, setPreviewFile] = useState(null); 

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleUploadSuccess = (newFiles) => {
    console.log("Upload success response:", newFiles);

    const filesToAdd = Array.isArray(newFiles) ? newFiles : [newFiles];

    setFiles((prevFiles) => [...prevFiles, ...filesToAdd]);
    setFilteredFiles((prevFilteredFiles) => [...prevFilteredFiles, ...filesToAdd]);
    setIsUploading(false); 
  };

  const username = localStorage.getItem("username"); 

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      if (!username) {
        setError("Username is required");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`https://api.filecloud.azaken.com/files?username=${username}`, { 
          method: "GET",
        });

        const contentType = response.headers.get("Content-Type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          setFiles(data);
          setFilteredFiles(data); 
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        setError(err.message); 
      } finally {
        setLoading(false); 
      }
    };

    fetchFiles();
  }, [username]);

  const handleDelete = async (fileId) => {
    try {
      const confirmation = window.confirm("Are you sure you want to delete this file?");
      if (!confirmation) return;
  
      const response = await fetch(`https://api.filecloud.azaken.com/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (response.ok) {
        const result = await response.json();
        console.log(result.message); 

      } else {
        const errorData = await response.json();
        console.error('Error:', errorData.error);
      }
    } catch (err) {
      console.error('Error during delete operation:', err);
    }
  };
  

  const handleDownload = async (file) => {
    console.log(file);

    if (file && file.fileUrl) {
      const fileUrl = file.fileUrl;
  
      window.open(fileUrl, "_blank");
    } else {
      console.error("Invalid file URL");
    }
  };

  console.log(files);

  return (
    <div className="relative">
      <Navbar onToggleSidebar={toggleSidebar} />

      <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />

      <div className={`transition-all duration-300 ${isSidebarOpen ? "lg:ml-64" : ""} min-h-screen bg-gray-800 text-white p-6`}>
        <div className="flex items-center justify-center mb-6 gap-4">
          <SearchBar setFilteredFiles={setFilteredFiles} files={files} setIsUploading={setIsUploading} />
        </div>

        {isUploading && (
          <div className="bg-gray-900 p-4 rounded-lg mb-6">
            <UploadFiles onUploadSuccess={handleUploadSuccess} />
          </div>
        )}

        {loading && (
          <div className="flex justify-center min-h-screen bg-gray-800">
            <Loader />
          </div>
        )}
    
        {error && <div className="text-center text-red-500">{error}</div>}

        {previewFile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-1/2">
              <h2 className="text-2xl mb-4">Preview: {previewFile.fileName}</h2>
              {previewFile.fileType.startsWith("image") && (
                <img src={previewFile.fileUrl} alt="Preview" className="w-full h-auto" />
              )}

              <button
                onClick={() => setPreviewFile(null)}
                className="mt-4 text-red-500 hover:text-red-700"
              >
                Close Preview
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 sm:grid sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-7">
          {filteredFiles.length === 0 ? (
            <div className="col-span-full text-center text-gray-500">No files available</div> 
          ) : (
            filteredFiles.map((file) => (
              <FileCard
                key={file.fileId}
                file={file}
                onDelete={() => handleDelete(file.fileId)} 
                onDownload={() => handleDownload(file)} 
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
