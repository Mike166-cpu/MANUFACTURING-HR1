import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  // If token does not exist, redirect to login
  if (!token) {
      return <Navigate to="/login" replace />;
  }

  // If token exists, render the child component (e.g., Dashboard)
  return children;
};

export default ProtectedRoute;
