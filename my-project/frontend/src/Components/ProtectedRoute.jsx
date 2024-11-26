import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const adminToken = sessionStorage.getItem("adminToken");
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (!adminToken) {
      Swal.fire({
        title: "Access Denied",
        text: "You are not logged in. Redirecting to login page...",
        icon: "warning",
        confirmButtonText: "OK",
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/login", { state: { from: location }, replace: true });
        }
      });
    } else {
      setShowAlert(true); 
    }
  }, [adminToken, navigate, location]);

  return adminToken ? children : null;
};

export default ProtectedRoute;
