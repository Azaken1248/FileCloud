import { useState, useEffect, useRef } from "react";
import { FaBars, FaUserCircle } from "react-icons/fa";

const Navbar = ({ onToggleSidebar }) => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => {
    setDropdownOpen(!isDropdownOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("token");
    window.location.reload();
    console.log("Logged out");
  };

  return (
    <nav className="bg-gray-700 text-gray-100 px-4 py-3 flex justify-between items-center shadow-lg">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="text-gray-300 hover:text-white transition transform hover:scale-105 lg:hidden"
          aria-label="Toggle Sidebar"
        >
          <FaBars className="text-2xl" />
        </button>
        <div className="text-lg font-semibold">
          <span className="text-indigo-500 text-2xl">File</span>
          <span className="text-2xl">Cloud</span>
        </div>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={toggleDropdown}
          className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-600 transition"
          aria-label="User Menu"
        >
          <span className="hidden sm:inline text-gray-300 transition">
            {localStorage.getItem("username") || "User"}
          </span>
          <FaUserCircle className="text-3xl text-gray-300 transition" />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-36 bg-gray-800 shadow-lg rounded-md z-10">
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-gray-300 hover:bg-indigo-600 hover:text-white transition rounded-md"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;