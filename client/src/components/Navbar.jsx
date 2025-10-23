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
    <nav className="bg-mantle text-text px-4 py-3 flex justify-between items-center shadow-lg border-b border-surface0">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="text-subtext1 hover:text-text transition transform hover:scale-105 lg:hidden"
          aria-label="Toggle Sidebar"
        >
          <FaBars className="text-2xl" />
        </button>
        <div className="text-lg font-semibold">
          <span className="text-mauve text-2xl">File</span>
          <span className="text-text text-2xl">Cloud</span>
        </div>
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={toggleDropdown}
          className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-surface0 transition"
          aria-label="User Menu"
        >
          <span className="hidden sm:inline text-subtext1 transition">
            {localStorage.getItem("username") || "User"}
          </span>
          <FaUserCircle className="text-3xl text-subtext1 transition" />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-36 bg-surface0 shadow-lg rounded-md z-10 border border-surface1">
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-subtext1 hover:bg-red hover:text-base transition rounded-md"
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