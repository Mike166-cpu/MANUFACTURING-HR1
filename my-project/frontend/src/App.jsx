import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LoginForm from "./Components/LoginForm";
import SignUpForm from "./Components/SignUpForm";
import Dashboard from "./pages/Dashboard";
import EmployeeRecords from "./pages/EmployeeRecords";
import Compliance from "./pages/Compliance";
import Onboarding from "./pages/Onboarding";
import Offboarding from "./pages/Offboarding";
import AttendanceTime from "./pages/AttendanceTime";
import EmployeeInfo from "./pages/EmployeeInfo";
import Portal from "./pages/Portal";
import EmployeeSignupForm from "./pages/EmployeeSingupForm";
import EmployeeLoginForm from "./pages/EmployeeLoginForm";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import IncidentReport from "./pages/submodules/IncidentReport.jsx";
import FileIncident from "./pages/submodules/FileIncident.jsx";
import CompanyPolicy from "./pages/submodules/CompanyPolicy.jsx";
import TimeTracking from "./pages/submodules/TimeTracking.jsx";
import OnboardingFeedback from "./pages/submodules/OnboardingFeedback.jsx";
import NotFound from "./pages/NotFound.jsx";
import Profile from "./pages/submodules/Profile.jsx";
import AddEmployee from "./pages/AddEmployee.jsx";
import ForgotPassword from "./Components/ForgotPassword";
import ResetPassword from "./Components/ResestPassword";
import ProtectedRoute from "./Components/ProtectedRoute.jsx";
import EmployeeProtectedRoute from "./Components/EmployeeProtectedRoute.jsx";
import SafetyProtocols from "./pages/submodules/SafetyProtocols.jsx";
import UploadDocuments from "./pages/submodules/UploadDocuments.jsx";
import EmployeeDocuments from "./pages/submodules/EmployeeDocuments.jsx";

import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';



function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDarkMode(mediaQuery.matches);

    const handleChange = (event) => {
      setIsDarkMode(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);
  return (
    <div className={isDarkMode ? "dark" : "light"}>
      <Router>
        <Routes>
          {/*DEFAULT ROUTE*/}
          <Route path="/" element={<Portal />} />

          {/*EMPLOYEE PAGE*/}
          <Route path="/employeesignup" element={<EmployeeSignupForm />} />
          <Route path="/employeelogin" element={<EmployeeLoginForm />} />
          <Route path="/employeedashboard" element={<EmployeeProtectedRoute><EmployeeDashboard /></EmployeeProtectedRoute>} />
          <Route path="/fileincident" element={<EmployeeProtectedRoute><FileIncident /></EmployeeProtectedRoute>} />
          <Route path="/companypolicy" element={<EmployeeProtectedRoute><CompanyPolicy /></EmployeeProtectedRoute>} />
          <Route path="/timeTracking" element={<EmployeeProtectedRoute><TimeTracking /></EmployeeProtectedRoute>} />
          <Route path="/feedback" element={<EmployeeProtectedRoute><OnboardingFeedback /></EmployeeProtectedRoute>} />
          <Route path="/userProfile" element={<EmployeeProtectedRoute><Profile /></EmployeeProtectedRoute>} />
          <Route path="/safety-protocols" element={<EmployeeProtectedRoute><SafetyProtocols /></EmployeeProtectedRoute>} />
          <Route path="/upload-documents" element={<EmployeeProtectedRoute><UploadDocuments /></EmployeeProtectedRoute>} />
          <Route path="/forgotpassword" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/*ADMIN PAGE*/}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/signup" element={<ProtectedRoute><SignUpForm/></ProtectedRoute>} />
          <Route path="/incidentreport" element={<ProtectedRoute><IncidentReport /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}  />
          <Route path="/employeerecords" element={<EmployeeRecords />} />
          <Route path="/compliance" element={<ProtectedRoute><Compliance /></ProtectedRoute>} />
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/offboarding" element={<ProtectedRoute><Offboarding /></ProtectedRoute>} />
          <Route path="/attendancetime" element={<ProtectedRoute><AttendanceTime /></ProtectedRoute>} />
          <Route path="/employeeInfo" element={<ProtectedRoute><EmployeeInfo /></ProtectedRoute>} />
          <Route path="/addemployee" element={<ProtectedRoute><AddEmployee /></ProtectedRoute>} />
          <Route path="/employee-documents" element={<ProtectedRoute><EmployeeDocuments /></ProtectedRoute>} />

          {/*404 not found*/}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
