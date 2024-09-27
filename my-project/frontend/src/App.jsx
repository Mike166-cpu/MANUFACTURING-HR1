import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LoginForm from "./Components/LoginForm";
import SignUpForm from "./Components/SignupForm";
import Dashboard from "./pages/Dashboard";
import EmployeeRecords from "./pages/EmployeeRecords";
import Compliance from "./pages/Compliance";

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
        <Route path="*" element={<LoginForm />} />
      </Routes>
    </Router>
  );
}

export default App;
