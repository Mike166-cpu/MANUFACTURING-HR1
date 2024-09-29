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

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={<LoginForm />} //
        />

        <Route path="/signup" element={<SignUpForm />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/employeerecords" element={<EmployeeRecords />} />
        <Route path="/compliance" element={<Compliance/>} />
        <Route path="/onboarding" element={<Onboarding/>} />
        <Route path="/offboarding" element={<Offboarding/>} />
        <Route path="/attendancetime" element={<AttendanceTime/>} />
        <Route path="*" element={<LoginForm />} />
      </Routes>
    </Router>
  );
}

export default App;
