import React from "react";
import { Route, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const PrivateRoute = ({ element: Component, ...rest }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  try {
    const decoded = jwtDecode(token);  // Use jwtDecode for decoding
    const currentTime = Date.now() / 1000; // Get the current time in seconds

    if (decoded.exp < currentTime) {
      localStorage.removeItem("token"); // Remove expired token
      return <Navigate to="/" replace />;
    }
  } catch (error) {
    return <Navigate to="/" replace />;
  }

  return <Component {...rest} />;
};

export default PrivateRoute;
