import React from "react";
import { useNavigate } from "react-router-dom";

const Portal = () => {
  const navigate = useNavigate();

  const admin = () => {
    navigate("/login");
  };

  const employee = () => {
    navigate("/employeelogin");
  };
  return (
    <div className="relative flex flex-col justify-center items-center h-screen bg-gradient-to-r from-blue-300 to-purple-200 overflow-hidden">
      {/* Vector-like design */}
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.svgrepo.com/show/303002/abstract-shapes.svg')] bg-no-repeat bg-center bg-cover"></div>

      {/* Centered Title */}
      <h1 className="text-4xl font-bold mb-8 text-white text-center z-10">
        Welcome to the Employee Portal
      </h1>

      {/* Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-4xl z-10">
        {/* Admin Login */}
        <div
          onClick={admin}
          className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300 p-6 cursor-pointer"
        >
          <div className="card-body text-center">
            <h2 className="card-title text-2xl justify-center">
              Login as Admin
            </h2>
            <div className="card-actions justify-center">
              <button className="btn btn-primary">Admin Login</button>
            </div>
          </div>
        </div>

        {/* Employee Login */}
        <div
          onClick={employee}
          className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300 p-6 cursor-pointer"
        >
          <div className="card-body text-center">
            <h2 className="card-title text-2xl justify-center">
              Login as Employee
            </h2>
            <div className="card-actions justify-center">
              <button className="btn btn-primary">Proceed to Login</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portal;
