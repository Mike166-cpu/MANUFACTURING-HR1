import { useEffect } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

const idleLogout = (timeout = 30000) => {
  const navigate = useNavigate();
  let idleTimer = null;

  const logout = () => {
    Swal.fire({
      title: "Session Expired",
      text: "You have been logged out due to inactivity.",
      icon: "warning",
      confirmButtonText: "OK",
    }).then(() => {
      sessionStorage.removeItem("employeeToken");
      navigate("/employeelogin");
    });
  };

  const resetIdleTimer = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(logout, timeout);
  };

  useEffect(() => {
    resetIdleTimer(); 

    window.addEventListener("mousemove", resetIdleTimer);
    window.addEventListener("keydown", resetIdleTimer);
    window.addEventListener("click", resetIdleTimer);

    return () => {
      clearTimeout(idleTimer);
      window.removeEventListener("mousemove", resetIdleTimer);
      window.removeEventListener("keydown", resetIdleTimer);
      window.removeEventListener("click", resetIdleTimer);
    };
  }, [timeout]);

  return null; 
};

export default idleLogout;
