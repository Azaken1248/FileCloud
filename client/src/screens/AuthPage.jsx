import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import Loader from "../components/Loader";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false); 
  const navigate = useNavigate(); 

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setMessage("");
    setFormData({ name: "", email: "", password: "" });
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); 

    const url = isLogin
      ? "https://skibidi2.rrex.cc/login"
      : "https://skibidi2.rrex.cc/signup";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(isLogin ? "Login successful!" : "Signup successful!");
        if (isLogin) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("username", data.username);
          navigate("/dashboard"); 
        }
      } else {
        setMessage(data.error || "An error occurred");
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.");
    } finally {
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
      <div className="w-full max-w-md bg-gray-800 text-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-6 text-center">
          {isLogin ? "Login to Your Account" : "Create an Account"}
        </h2>
        {message && (
          <div
            className={`mb-4 text-center ${
              message.includes("successful")
                ? "text-green-500"
                : "text-red-500"
            }`}
          >
            {message}
          </div>
        )}
        {loading ? ( 
          <div className="flex justify-center mb-4">
            <Loader />
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full mt-1 px-4 py-2 bg-gray-700 rounded focus:outline-none focus:ring focus:ring-indigo-500"
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full mt-1 px-4 py-2 bg-gray-700 rounded focus:outline-none focus:ring focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
              <input
                type="password"
                id="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full mt-1 px-4 py-2 bg-gray-700 rounded focus:outline-none focus:ring focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 py-2 px-4 rounded text-white font-medium hover:bg-indigo-700 transition"
            >
              {isLogin ? "Login" : "Sign Up"}
            </button>
          </form>
        )}
        <div className="mt-4 text-center">
          <button
            onClick={toggleAuthMode}
            className="text-indigo-400 hover:underline"
          >
            {isLogin
              ? "Don't have an account? Sign Up"
              : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
