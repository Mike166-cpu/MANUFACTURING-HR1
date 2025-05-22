import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import SkeletonLoader from "./Components/SkeletonLoader.jsx";

// ADMIN IMPORTS
import LoginForm from "./Components/LoginForm";
import Dashboard from "./pages/Admin/Dashboard";
import Compliance from "./pages/Admin/Compliance";
import AttendanceTime from "./pages/Admin/AttendanceTime";
import EmployeeSchedule from "./pages/Admin/EmployeeSchedule.jsx";
import LeaveManagement from "./pages/Admin/LeaveManagement.jsx";
import RequestDocuments from "./pages/Admin/RequestDocuments.jsx";
import ResignationRequest from "./pages/Admin/ResignationRequest.jsx";
import EmployeeInfo from "./pages/Admin/EmployeeInfo";
import ObRequest from "./pages/Admin/ObRequest";
import SignUpForm from "./Components/SignUpForm";
import EmployeeRecords from "./pages/EmployeeRecords";
import Onboarding from "./pages/Onboarding";
import Offboarding from "./pages/Offboarding";
import UserLogs from "./pages/Admin/UserLogs.jsx";
import DocumentRecords from "./pages/Admin/DocumentRecords.jsx";
import AuditLogs from "./pages/Admin/AuditLogs.jsx";
import TimeTrackingRecord from "./pages/Admin/TimeTrackingRecords.jsx";
import OnboardEmployee from "./pages/Admin/OnboardEmployee.jsx";
import AddEmployee from "./pages/AddEmployee.jsx";
import EmployeeDocuments from "./pages/Admin/EmployeeDocuments.jsx";
import Policies from  "./pages/Admin/Policies.jsx";
import Logs from "./pages/Admin/Logs.jsx";
import Promotion from "./pages/Admin/Promotion.jsx";
import AdminSettings from "./pages/Admin/AdminSettings.jsx";

// EMPLOYEE IMPORTS
// import TimeTracking from "./pages/submodules/TimeTracking.jsx";
import EmployeeDashboard from "./pages/Employee/EmployeeDashboard";

import Portal from "./pages/Portal";
import EmployeeSignupForm from "./pages/EmployeeSingupForm";
import EmployeeLoginForm from "./pages/Employee/EmployeeLoginForm";
import CompanyPolicy from "./pages/Employee/CompanyPolicy.jsx";
import NotFound from "./pages/NotFound.jsx";
import Profile from "./pages/Employee/Profile.jsx";
import ForgotPassword from "./Components/ForgotPassword";
import ResetPassword from "./Components/ResestPassword";
import ProtectedRoute from "./Components/ProtectedRoute.jsx";
import EmployeeProtectedRoute from "./Components/EmployeeProtectedRoute.jsx";
import TestTimer from "./pages/Employee/TestTimer.jsx";
import WorkSchedule from "./pages/Employee/WorkSchedule.jsx"; 
import FileLeave from "./pages/Employee/FileLeave.jsx";
import RequestForm from "./pages/Employee/RequestForm.jsx";
import ResignationForm from "./pages/Employee/ResignationForm.jsx";
import UploadRequiremens from "./pages/Employee/UploadRequirements.jsx";
import TimeTracking from "./pages/Employee/TimeTracking.jsx";
import Settings from "./pages/Employee/Settings.jsx"

//HR LOGIN
import HumanResources from "./pages/HumanResources.jsx";


//Template
import AdminTemplate from "./pages/AdminTemplate.jsx";

//TO REMOVE
import IncidentReport from "./pages/submodules/IncidentReport.jsx";
import UploadDocuments from "./pages/Employee/UploadDocuments.jsx";
import OnboardingFeedback from "./pages/submodules/OnboardingFeedback.jsx";
import FileIncident from "./pages/submodules/FileIncident.jsx";


import 'react-toastify/dist/ReactToastify.css';

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
          <Route path="/" element={<LoginForm />} />
        
    

          {/*EMPLOYEE DASBOARD*/}
          <Route path="/employeesignup" element={<EmployeeSignupForm />} />
          <Route path="/employeelogin" element={<EmployeeLoginForm />} />  {/* ESS LOGIN */}
          <Route path="/employeedashboard" element={<EmployeeProtectedRoute><EmployeeDashboard /></EmployeeProtectedRoute>} /> {/* EMPLOYEE DASHBOARD */}
          <Route path="/user-handbook" element={<EmployeeProtectedRoute><CompanyPolicy /></EmployeeProtectedRoute>} />  {/* USERHANDBOOK */}
          <Route path="/timeTracking" element={<EmployeeProtectedRoute><TimeTracking /></EmployeeProtectedRoute>} />  {/* TIME TRACKING */}
          <Route path="/userProfile" element={<EmployeeProtectedRoute><Profile /></EmployeeProtectedRoute>} />  {/* EMPLOYEE PROFILE  */}
          <Route path="/work-schedule" element={<EmployeeProtectedRoute><WorkSchedule /></EmployeeProtectedRoute>} /> {/* EMPLOYEE SCHEDULE  */}
          <Route path="/file-leave" element={<EmployeeProtectedRoute><FileLeave /></EmployeeProtectedRoute>} />  {/* EMPLOYEE LEAVE REQUEST  */}
          <Route path="/request-form" element={<EmployeeProtectedRoute><RequestForm /></EmployeeProtectedRoute>} />  {/* MANUAL TIME ENTRIES  */}
          <Route path="/resignation-form" element={<EmployeeProtectedRoute><ResignationForm /></EmployeeProtectedRoute>} /> {/*RESIGNATION FORM*/}
          <Route path="/upload-requirements" element={<EmployeeProtectedRoute><UploadRequiremens /></EmployeeProtectedRoute>} />  {/*EMPLOYEE UPLOAD REQUIREMENTS*/}
          <Route path="/my-calendar" element={<EmployeeProtectedRoute><UploadDocuments /></EmployeeProtectedRoute>} />
          <Route path="/settings" element={<EmployeeProtectedRoute><Settings /></EmployeeProtectedRoute>} />
          

         

          {/*ADMIN DASHBORAD*/}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}  /> {/* ADMIN DASHBOARD */}
          <Route path="/compliance" element={<ProtectedRoute><Compliance /></ProtectedRoute>} />  {/* FOR CREATING USER HANDBOOK*/}
          <Route path="/attendancetime" element={<ProtectedRoute><AttendanceTime /></ProtectedRoute>} />   {/* FOR MANAGING TIME TRACKING*/}
          <Route path="/employee-info" element={<ProtectedRoute><EmployeeInfo /></ProtectedRoute>} />   {/* FOR VIEWING EMPLOYEE LIST*/}
          <Route path="/employee-schedule" element={<ProtectedRoute><EmployeeSchedule /></ProtectedRoute>} />   {/* FOR CREATING EMPLOYEES WORK SCHEUDLE*/}
          <Route path="/leave-management" element={<ProtectedRoute><LeaveManagement /></ProtectedRoute>} />     {/* FOR EMPLOYEE LEAVES*/}
          <Route path="/request-documents" element={<ProtectedRoute><RequestDocuments /></ProtectedRoute>} />
          <Route path="/admin-template" element={<ProtectedRoute><AdminTemplate /></ProtectedRoute>} />
          <Route path="/resignation-request" element={<ProtectedRoute><ResignationRequest /></ProtectedRoute>} />
          <Route path="/ob-request" element={<ProtectedRoute><ObRequest /></ProtectedRoute>} />
          <Route path="/admin-template" element={<ProtectedRoute><AdminTemplate /></ProtectedRoute>} />
          <Route path="/user-logs" element={<ProtectedRoute><UserLogs /></ProtectedRoute>} />
          <Route path="/document-records" element={<ProtectedRoute><DocumentRecords /></ProtectedRoute>} />
          <Route path="/audit-logs" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
          <Route path="/time-records" element={<ProtectedRoute><TimeTrackingRecord /></ProtectedRoute>} />
          <Route path="/onboard-employee" element={<ProtectedRoute><OnboardEmployee /></ProtectedRoute>} />
          <Route path="/signup" element={<ProtectedRoute><SignUpForm /></ProtectedRoute>} />
          <Route path="/policy" element={<ProtectedRoute><Policies /></ProtectedRoute>} /> 
          <Route path="/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} /> 
          <Route path="/promotion" element={<ProtectedRoute><Promotion /></ProtectedRoute>} />
          <Route path="/user-settings" element={<ProtectedRoute><AdminSettings /></ProtectedRoute>} /> {/* ADD EMPLOYEE */}

          

          
          {/* HR LOGIN */}
          <Route path="/hr-login" element={<HumanResources />} />
       
          

          {/*404 not found*/}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
