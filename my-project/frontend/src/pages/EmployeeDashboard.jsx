import React from "react";

const EmployeeDashboard = () => {
  return (
    <div>
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100">
        <div className="card w-full max-w-4xl bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-center text-2xl">
              Welcome to the Dashboard!
            </h2>
            <p className="text-center mt-4">
              You are now logged in. Here you can manage your employee data,
              view records, and access other features.
            </p>

            {/* Add more dashboard features here */}
            <div className="mt-8 flex justify-center gap-4">
              <button className="btn btn-primary">View Employee Records</button>
              <button className="btn btn-secondary">Manage Compliance</button>
              <button className="btn btn-accent">View Reports</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
