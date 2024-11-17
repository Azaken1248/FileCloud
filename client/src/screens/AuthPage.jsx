import React, { useState } from "react";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  const toggleAuthMode = () => setIsLogin(!isLogin);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
      <div className="w-full max-w-md bg-gray-800 text-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-6 text-center">
          {isLogin ? "Login to Your Account" : "Create an Account"}
        </h2>
        <form className="space-y-6">
          {!isLogin && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium">
                Name
              </label>
              <input
                type="text"
                id="name"
                placeholder="Your Name"
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
