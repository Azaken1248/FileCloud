import React, { useState } from "react";
import { FaBars, FaUserCircle } from "react-icons/fa";

const Navbar = ({ onToggleSidebar }) => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("token");
    window.location.reload();
    console.log("Logged out");
  };

  return (
    <nav className="bg-gray-700 text-gray-100 px-4 py-3 flex justify-between items-center shadow-lg">
      <div className="text-lg font-semibold">
        <span className="text-indigo-500 text-2xl">File</span><span className="text-2xl">Cloud</span>
      </div>
      <button
        onClick={onToggleSidebar}
        className="text-gray-300 hover:text-white transition transform hover:scale-105 lg:hidden"
      >
        <FaBars className="text-2xl" />
      </button>

      <div className="relative">
        <div
          onClick={toggleDropdown}
          className="grid grid-cols-2 gap-3 cursor-pointer"
        >
          <span className="text-gray-300 hover:text-indigo-500 transition mt-1">
            {localStorage.getItem("username") || "User"}
          </span>
          <FaUserCircle className="text-3xl text-gray-300 hover:text-indigo-500 transition" />
        </div>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-32 bg-gray-800 shadow-lg rounded-md">
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition"
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
