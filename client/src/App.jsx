import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthPage from "./screens/AuthPage";
import Dashboard from "./screens/Dashboard";
import PrivateRoute from "./router/PrivateRoute";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route
          path="/dashboard"
          element={<PrivateRoute element={Dashboard} />}
        />
      </Routes>
    </Router>
  );
};

export default App;
