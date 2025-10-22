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
      className={`fixed top-0 left-0 h-full w-64 bg-gray-700 text-gray-100 shadow-lg transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } transition-transform duration-300 ease-in-out z-50`}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-gray-300 hover:text-white"
      >
        <FaTimes className="text-2xl" />
      </button>

      <div className="flex flex-col items-start space-y-6 mt-12 px-6">
        <button
          onClick={() => {
            console.log("User logged out");
          }}
          className="flex items-center space-x-3 text-gray-300 hover:text-red-500 transition"
        >
          <FaSignOutAlt className="text-xl" />
          <span onClick={handleLogout}>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
