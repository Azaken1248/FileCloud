import { FaSignOutAlt, FaTimes } from "react-icons/fa";

const Sidebar = ({ isOpen, onClose }) => {
  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("token");
    window.location.reload();
    console.log("Logged out");
  };

  return (
    <div
      className={`fixed top-0 left-0 h-full w-64 bg-crust text-text shadow-lg transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } transition-transform duration-300 ease-in-out z-50 border-r border-surface0`}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-subtext1 hover:text-text"
      >
        <FaTimes className="text-2xl" />
      </button>

      <div className="flex flex-col items-start space-y-6 mt-16 px-6">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 text-subtext1 hover:text-red transition"
        >
          <FaSignOutAlt className="text-xl" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;