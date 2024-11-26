import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const employeeToken = sessionStorage.getItem("employeeToken");
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (!employeeToken) {
      Swal.fire({
        title: "Access Denied",
        text: "You are not logged in. Redirecting to login page...",
        icon: "warning",
        confirmButtonText: "OK",
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/employeelogin", { state: { from: location }, replace: true });
        }
      });
    } else {
      setShowAlert(true); 
    }
  }, [employeeToken, navigate, location]);

  return employeeToken ? children : null;
};

export default ProtectedRoute;
