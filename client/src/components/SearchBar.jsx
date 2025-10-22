import { useState, useRef, useEffect } from "react";

const SearchBar = ({ files, setFilteredFiles, setIsUploading, setSearchActive, searchResetSignal }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (typeof searchResetSignal !== 'undefined') {
      setSearchQuery("");
      if (typeof setSearchActive === "function") setSearchActive(false);
    }
  }, [searchResetSignal]);

  const runFilter = (raw) => {
    const query = (raw || "").trim().toLowerCase();
    if (!query) {
      setFilteredFiles(files);
      if (typeof setSearchActive === "function") setSearchActive(false);
      return;
    }

    if (typeof setSearchActive === "function") setSearchActive(true);

    const safeIncludes = (val) => {
      if (val === undefined || val === null) return false;
      return String(val).toLowerCase().includes(query);
    };

    const filteredFiles = files.filter((file) => {
      return (
        safeIncludes(file.fileName) ||
        safeIncludes(file.fileSize) ||
        safeIncludes(file.fileType) ||
        safeIncludes(file.uploadedAt)
      );
    });

    setFilteredFiles(filteredFiles);
  };

  const handleSearch = (e) => {
    const raw = e.target.value || "";
    setSearchQuery(raw);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => runFilter(raw), 120);
  };

  return (
    <div className="flex items-center justify-between bg-gray-700 text-gray-100 rounded-xl shadow-md p-4 mx-auto my-4 w-full sm:w-[92%] md:w-[85%] lg:w-[75%] xl:w-[70%] max-w-[1200px]">
      <input
        type="text"
        placeholder="Search files..."
        value={searchQuery}
        onChange={handleSearch}
  className="bg-gray-700 text-gray-100 p-2 rounded border-2 border-gray-500 focus:outline-none w-full"
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