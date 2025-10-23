import { useState, useRef, useEffect } from "react";
import { FaPlus, FaTimes } from "react-icons/fa"; 

const SearchBar = ({ files, setFilteredFiles, setIsUploading, setSearchActive, searchResetSignal }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const timerRef = useRef(null);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (typeof searchResetSignal !== 'undefined' && searchResetSignal > 0) {
      setSearchQuery("");
      if (typeof setSearchActive === "function") setSearchActive(false);
      runFilter("");
    }
  }, [searchResetSignal]);

  const runFilter = (raw) => {
    const query = (raw || "").trim().toLowerCase();
    if (!query) {
      if (typeof setSearchActive === "function") setSearchActive(false);
      setFilteredFiles(files); 
      return;
    }

    if (typeof setSearchActive === "function") setSearchActive(true);

    const safeIncludes = (val) => {
      if (val === undefined || val === null) return false;
      return String(val).toLowerCase().includes(query);
    };

    const filtered = files.filter((file) => {
      return (
        safeIncludes(file.fileName) ||
        safeIncludes(file.fileSize) || 
        safeIncludes(file.fileType) ||
        safeIncludes(file.uploadedAt) 
      );
    });

    setFilteredFiles(filtered);
  };

  const handleSearch = (e) => {
    const raw = e.target.value || "";
    setSearchQuery(raw);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => runFilter(raw), 150); 
  };

  const toggleUpload = () => {
      const nextState = !showUpload;
      setShowUpload(nextState);
      setIsUploading(nextState);
  }

  return (
    <div className="flex items-center justify-between bg-surface0 text-text rounded-xl shadow-md p-3 mx-auto my-4 w-full sm:w-[92%] md:w-[85%] lg:w-[75%] xl:w-[70%] max-w-[1200px] border border-surface1">
      <input
        type="text"
        placeholder="Search files..."
        value={searchQuery}
        onChange={handleSearch}
        className="bg-surface1 text-text placeholder-subtext0 p-2 rounded-lg border border-surface2 focus:outline-none focus:border-mauve w-full mr-3"
      />
      <button
        onClick={toggleUpload}
        className={`w-10 h-10 flex items-center justify-center rounded-full ml-auto hover:scale-110 transition duration-200 ease-in-out flex-shrink-0 ${showUpload ? 'bg-red text-base hover:bg-maroon' : 'bg-blue text-base hover:bg-sapphire'}`}
        aria-label={showUpload ? "Close Upload Panel" : "Open Upload Panel"}
        title={showUpload ? "Close Upload" : "Upload Files/Folders"}
      >
        {showUpload ? <FaTimes /> : <FaPlus />}
      </button>
    </div>
  );
};

export default SearchBar;