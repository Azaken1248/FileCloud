import React, { useState } from "react";

const SearchBar = ({ files, setFilteredFiles }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    // Filter files based on any parameter (file name, type, etc.)
    const filteredFiles = files.filter((file) => {
      return (
        file.name.toLowerCase().includes(query) ||
        file.size.toLowerCase().includes(query) ||
        file.type.toLowerCase().includes(query) ||
        file.lastModified.toLowerCase().includes(query)
      );
    });

    setFilteredFiles(filteredFiles);
  };

  return (
    <div className="bg-gray-700 text-gray-100 rounded-xl shadow-md p-4 mx-auto my-4 max-w-xs sm:max-w-md">
      <input
        type="text"
        placeholder="Search files..."
        value={searchQuery}
        onChange={handleSearch}
        className="bg-gray-800 text-gray-100 p-2 rounded border-2 border-gray-500 focus:outline-none w-full"
      />
    </div>
  );
};

export default SearchBar;
