import React from "react";
import { FaBars, FaUserCircle } from "react-icons/fa";

const Navbar = ({ onToggleSidebar }) => {
  return (
    <nav className="bg-gray-700 text-gray-100 px-4 py-3 flex justify-between items-center shadow-lg">
      {/* Logo */}
      <div className="text-lg font-semibold">
        <span className="text-indigo-500">File</span>Cloud
      </div>

      {/* Sidebar Toggle */}
      <button
        onClick={onToggleSidebar}
        className="text-gray-300 hover:text-white transition transform hover:scale-105 lg:hidden"
      >
        <FaBars className="text-2xl" />
      </button>

      {/* Right Section */}
      <div className="hidden lg:flex items-center space-x-6">
        <a
          href="#"
          className="text-gray-300 hover:text-indigo-500 transition"
        >
          username
        </a>
        <a
          href="#"
          className="text-gray-300 hover:text-indigo-500 transition"
        >
          share
        </a>
        <FaUserCircle className="text-3xl text-gray-300 cursor-pointer hover:text-indigo-500 transition" />
      </div>
    </nav>
  );
};

export default Navbar;
