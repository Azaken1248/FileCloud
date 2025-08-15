import { useState } from "react";

const SearchBar = ({ files, setFilteredFiles, setIsUploading }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    const filteredFiles = files.filter((file) => {
      return (
        file.fileName.toLowerCase().includes(query) ||
        file.fileSize.toString().toLowerCase().includes(query) ||
        file.fileType.toLowerCase().includes(query) ||
        file.uploadedAt.toLowerCase().includes(query)
      );
    });

    setFilteredFiles(filteredFiles);
  };

  return (
    <div className="flex items-center justify-between bg-gray-700 text-gray-100 rounded-xl shadow-md p-4 mx-auto my-4 sm:w-[85%] w-[95%]">
      <input
        type="text"
        placeholder="Search files..."
        value={searchQuery}
        onChange={handleSearch}
        className="bg-gray-800 text-gray-100 p-2 rounded border-2 border-gray-500 focus:outline-none w-full"
      />
      <button
        onClick={() => setIsUploading((prevState) => !prevState)}
        className="bg-gray-600 text-white w-12 h-12 flex items-center justify-center rounded-full ml-2 hover:bg-gray-500 transition duration-300 ease-in-out flex-shrink-0" // Added flex-shrink-0
        aria-label="Upload Files"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>
    </div>
  );
};

export default SearchBar;