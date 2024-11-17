import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import FileCard from "../components/FileCard";
import SearchBar from "../components/SearchBar"; // Import the SearchBar component

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [files, setFiles] = useState([
    { id: 1, name: "Document1.pdf", type: "PDF", size: "2 MB", lastModified: "2024-11-01" },
    { id: 2, name: "Image1.jpg", type: "Image", size: "1.5 MB", lastModified: "2024-10-25" },
    { id: 3, name: "Report.xlsx", type: "Excel", size: "3 MB", lastModified: "2024-10-30" },
    { id: 4, name: "Video.mp4", type: "Video", size: "15 MB", lastModified: "2024-11-02" },
    { id: 5, name: "Audio.mp3", type: "Audio", size: "4 MB", lastModified: "2024-10-28" },
    { id: 6, name: "Presentation.pptx", type: "PowerPoint", size: "5 MB", lastModified: "2024-10-20" },
    { id: 7, name: "Archive.zip", type: "Archive", size: "20 MB", lastModified: "2024-09-15" },
    { id: 8, name: "Code.js", type: "JavaScript", size: "500 KB", lastModified: "2024-11-03" },
    { id: 9, name: "Styles.css", type: "CSS", size: "200 KB", lastModified: "2024-10-18" },
    { id: 10, name: "Notes.txt", type: "Text", size: "50 KB", lastModified: "2024-11-05" },
    { id: 11, name: "Image2.png", type: "Image", size: "3.2 MB", lastModified: "2024-10-22" },
    { id: 12, name: "VideoClip.mov", type: "Video", size: "10 MB", lastModified: "2024-10-30" },
    { id: 13, name: "Sound.wav", type: "Audio", size: "6 MB", lastModified: "2024-11-01" },
    { id: 14, name: "Diagram.svg", type: "Vector Image", size: "1 MB", lastModified: "2024-09-30" },
    { id: 15, name: "Archive.rar", type: "Archive", size: "12 MB", lastModified: "2024-08-25" },
  ]);
  
  const [filteredFiles, setFilteredFiles] = useState(files); // State for filtered files

  const handleDelete = (fileId) => {
    setFiles(files.filter((f) => f.id !== fileId));
    setFilteredFiles(filteredFiles.filter((f) => f.id !== fileId)); // Update filtered files as well
  };

  const handleDownload = (fileId) => {
    const file = files.find((f) => f.id === fileId);
    console.log(`Downloading ${file.name}`);
    // Add actual download logic here
  };

  const handlePreview = (fileId) => {
    const file = files.find((f) => f.id === fileId);
    console.log(`Previewing ${file.name}`);
    // Add actual preview logic here
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="relative">
      {/* Navbar */}
      <Navbar onToggleSidebar={toggleSidebar} />

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${isSidebarOpen ? "lg:ml-64" : ""} min-h-screen bg-gray-800 text-white p-6`}
      >
        {/* SearchBar Component */}
        <SearchBar setFilteredFiles={setFilteredFiles} files={files} />

        {/* Grid Layout for Files */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-7">
          {filteredFiles.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              onDelete={() => handleDelete(file.id)}
              onDownload={() => handleDownload(file.id)}
              onPreview={() => handlePreview(file.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
