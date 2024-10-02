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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Portal />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/signup" element={<SignUpForm />} />
        <Route path="/employeesignup" element={<EmployeeSignupForm />} />
        <Route path="/employeelogin" element={<EmployeeLoginForm />} />
        <Route path="/employeesignup" element={<EmployeeSignupForm />} />
        <Route path="/employeedashboard" element={<EmployeeDashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/employeerecords" element={<EmployeeRecords />} />
        <Route path="/compliance" element={<Compliance />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/offboarding" element={<Offboarding />} />
        <Route path="/attendancetime" element={<AttendanceTime />} />
        <Route path="/employeeInfo" element={<EmployeeInfo />} />
        <Route path="*" element={<LoginForm />} />
      </Routes>
    </Router>
  );
}

export default App;
