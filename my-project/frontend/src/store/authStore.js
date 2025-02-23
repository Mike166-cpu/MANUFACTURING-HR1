//HR1 authStore

import Swal from "sweetalert2";

const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";
const LOCAL = "http://localhost:7685";

// export const loginUser = async (email, password, navigate, location) => {
//   try {
//     console.log("HR1 login attempt:", { email, password });
//     const response = await fetch(`${LOCAL}/api/employee/loginTest`, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ email, password }),
//     });

//     console.log("HR1 login response status:", response.status);

//     if (response.status === 429) {
//       const data = await response.json();
//       Swal.fire({
//         title: "Too Many Requests, Please back in 15 minutes",
//         text: data.message,
//         icon: "warning",
//         confirmButtonText: "OK",
//       });
//       return false; // Indicate failure
//     }

//     if (!response.ok) {
//       const data = await response.json();
//       Swal.fire({
//         title: "Login Failed",
//         text: data.message || "Incorrect username or password.",
//         icon: "error",
//         confirmButtonText: "Try Again",
//       });
//       return false; // Indicate failure
//     }

//     const data = await response.json();

//     console.log("HR1 login response data:", data);

//     localStorage.setItem("adminToken", data.token);
//     localStorage.setItem("firstName", data.firstName);
//     localStorage.setItem("lastName", data.lastName);
//     localStorage.setItem("employeeUsername", data.employeeUsername);
//     localStorage.setItem("employeeFirstname", data.employeeFirstname);
//     localStorage.setItem("role", data.role);

//     if (data.accessLevel === "Super Admin") {
//       localStorage.setItem("accessLevel", "Super Admin");
//     }

//     if (data.department === "HR1") {
//       window.location.href = "https://hr1.jjm-manufacturing.com/";
//       return true; // Indicate success
//     }

//     Swal.fire({
//       title: "Login Successful",
//       text: "Welcome back!",
//       icon: "success",
//       confirmButtonText: "Proceed",
//     }).then(() => {
//       const redirectTo = location.state?.from?.pathname || "/dashboard";
//       navigate(redirectTo, { replace: true });
//     });
//     return true; // Indicate success
//   } catch (error) {
//     console.error("HR1 login error:", error);
//     Swal.fire({
//       title: "Error",
//       text: "Something went wrong. Please try again later.",
//       icon: "error",
//       confirmButtonText: "OK",
//     });
//     return false; // Indicate failure
//   }
// };



export const loginUser = async (email, password, navigate, location) => {
  try {
    console.log("HR1 login attempt:", { email, password });

    // Make the request to the new login endpoint
    const response = await fetch(`${LOCAL}/api/employee/testLog`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    console.log("HR1 login response status:", response.status);

    if (response.status === 429) {
      const data = await response.json();
      Swal.fire({
        title: "Too Many Requests, Please try again in 15 minutes",
        text: data.message,
        icon: "warning",
        confirmButtonText: "OK",
      });
      return false;
    }

    if (!response.ok) {
      const data = await response.json();
      Swal.fire({
        title: "Login Failed",
        text: data.message || "Incorrect username or password.",
        icon: "error",
        confirmButtonText: "Try Again",
      });
      return false;
    }

    const data = await response.json();
    console.log("HR1 login response data:", data);

    // Store token and user details in localStorage
    localStorage.setItem("adminToken", data.token);
    localStorage.setItem("firstName", data.user.firstName);
    localStorage.setItem("lastName", data.user.lastName);
    localStorage.setItem("email", data.user.email);
    localStorage.setItem("role", data.user.role);

    if (data.user.accessLevel === "Super Admin") {
      localStorage.setItem("accessLevel", "Super Admin");
    }

    if (data.user.department === "HR1") {
      window.location.href = "https://hr1.jjm-manufacturing.com/";
      return true;
    }

    Swal.fire({
      title: "Login Successful",
      text: "Welcome back!",
      icon: "success",
      confirmButtonText: "Proceed",
    }).then(() => {
      const redirectTo = location.state?.from?.pathname || "/dashboard";
      navigate(redirectTo, { replace: true });
    });

    return true;
  } catch (error) {
    console.error("HR1 login error:", error);
    Swal.fire({
      title: "Error",
      text: "Something went wrong. Please try again later.",
      icon: "error",
      confirmButtonText: "OK",
    });
    return false;
  }
};

