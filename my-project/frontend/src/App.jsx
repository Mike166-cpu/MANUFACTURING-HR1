import React, { useState } from "react";

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
import IncidentReportForm from "./pages/submodules/IncidentReportForm.jsx";
import FileIncident from "./pages/submodules/FileIncident.jsx";
import CompanyPolicy from "./pages/submodules/CompanyPolicy.jsx";
import TimeTracking from "./pages/submodules/TimeTracking.jsx";
import EditProfile from "./pages/submodules/EditProfile.jsx";
import OnboardingFeedback from "./pages/submodules/OnboardingFeedback.jsx";
import NotFound from "./pages/NotFound.jsx";
import Profile from "./pages/submodules/Profile.jsx";


function App() {
  return (
    <Router>
      <Routes>

        {/*DEFAULT ROUTE*/}
        <Route path="/" element={<Portal />} />

        {/*EMPLOYEE PAGE*/}
        <Route path="/employeesignup" element={<EmployeeSignupForm />} />
        <Route path="/employeelogin" element={<EmployeeLoginForm />} />
        <Route path="/employeesignup" element={<EmployeeSignupForm />} />
        <Route path="/employeedashboard" element={<EmployeeDashboard />} />
        <Route path="/fileincident" element={<FileIncident />} />
        <Route path="/companypolicy" element={<CompanyPolicy />} />
        <Route path="/timeTracking" element={<TimeTracking />} />
        <Route path="/profile" element={<EditProfile />} />
        <Route path="/feedback" element={<OnboardingFeedback />} />
        <Route path="/userProfile" element={<Profile />}></Route>


        {/*ADMIN PAGE*/}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/signup" element={<SignUpForm />} />
        <Route path="/incidentreport" element={<IncidentReport />} />
        <Route path="/reportform" element={<IncidentReportForm />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/employeerecords" element={<EmployeeRecords />} />
        <Route path="/compliance" element={<Compliance />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/offboarding" element={<Offboarding />} />
        <Route path="/attendancetime" element={<AttendanceTime />} />
        <Route path="/employeeInfo" element={<EmployeeInfo />} />

        
        {/*404 not found*/}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
