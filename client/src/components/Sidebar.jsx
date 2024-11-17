import React from "react";
import { FaHome, FaInfoCircle, FaPhoneAlt, FaTimes } from "react-icons/fa";

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <div
      className={`fixed top-0 left-0 h-full w-64 bg-gray-700 text-gray-100 shadow-lg transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } transition-transform duration-300 ease-in-out z-50`}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-300 hover:text-white"
      >
        <FaTimes className="text-2xl" />
      </button>

      {/* Menu Items */}
      <div className="flex flex-col items-start space-y-6 mt-12 px-6">
        <a
          href="#"
          className="flex items-center space-x-3 text-gray-300 hover:text-indigo-500 transition"
        >
          <FaHome className="text-xl" />
          <span>Home</span>
        </a>
        <a
          href="#"
          className="flex items-center space-x-3 text-gray-300 hover:text-indigo-500 transition"
        >
          <FaInfoCircle className="text-xl" />
          <span>About</span>
        </a>
        <a
          href="#"
          className="flex items-center space-x-3 text-gray-300 hover:text-indigo-500 transition"
        >
          <FaPhoneAlt className="text-xl" />
          <span>Contact</span>
        </a>
      </div>
    </div>
  );
};

export default Sidebar;
