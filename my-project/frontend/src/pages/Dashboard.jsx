import React, { useEffect, useState } from "react";
import Navbar from "../Components/Navbar";
import Sidebar from "../Components/Sidebar";
import { Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from "chart.js";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  Filler, 
  ArcElement 
);



const Dashboard = () => {
  useEffect(() => {
    document.title = "Dashboard";
  }, []); // Add dependency array for useEffect

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Sample data for the line graph
  const lineData = {
    labels: ["January", "February", "March", "April", "May", "June", "July"],
    datasets: [
      {
        label: "Sales",
        fill: true,
        backgroundColor: "rgba(75, 192, 192, 0.3)", // Lighter fill for gradient
        borderColor: "rgba(75, 192, 192, 1)", // Line color
        borderWidth: 2,
        data: [65, 59, 80, 81, 56, 55, 40],
        tension: 0.4, // Smooth curve
      },
      {
        label: "Expenses",
        fill: true,
        backgroundColor: "rgba(255, 99, 132, 0.3)", // Lighter fill for second line
        borderColor: "rgba(255, 99, 132, 1)", // Line color for second line
        borderWidth: 2,
        data: [45, 39, 60, 71, 46, 55, 30],
        tension: 0.4, // Smooth curve
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: {
          usePointStyle: true,
          boxWidth: 10,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  // Sample data for the pie chart
  const pieData = {
    labels: ["Direct", "Referral", "Social Media", "Email", "Others"],
    datasets: [
      {
        data: [300, 50, 100, 40, 30],
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
        ],
        borderColor: "rgba(255, 255, 255, 1)",
        borderWidth: 2,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
    },
  };

  return (
    <div className="flex">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      <div
        className={`flex-1 transition-all duration-300 ${
          isSidebarOpen ? "ml-80" : "ml-0"
        }`}
      >
        <Navbar toggleSidebar={toggleSidebar} />
        {/* MAIN CONTENT */}
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-6 pb-4">Welcome to the Dashboard</h1>

          {/* Line Graph and Pie Chart */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Line Graph */}
            <div className="bg-white shadow-lg p-4 rounded-lg overflow-hidden transform transition-transform hover:scale-105 hover:shadow-2xl">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Sales and Expenses Over Time
              </h2>
              <Line data={lineData} options={lineOptions} />
            </div>

            {/* Pie Chart */}
            <div className="bg-white shadow-lg p-4 rounded-lg overflow-hidden transform transition-transform hover:scale-105 hover:shadow-2xl">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Traffic Sources
              </h2>
              <Pie data={pieData} options={pieOptions} />
            </div>
          </div>

          {/* Cards Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden transform transition-transform hover:scale-105 hover:shadow-2xl">
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-700">Total Users</h2>
                <p className="text-3xl font-bold text-gray-900">1,234</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-b-lg">
                <p className="text-center text-sm text-blue-600">+ 25% from last month</p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden transform transition-transform hover:scale-105 hover:shadow-2xl">
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-700">Total Sales</h2>
                <p className="text-3xl font-bold text-gray-900">$56,789</p>
              </div>
              <div className="bg-green-100 p-2 rounded-b-lg">
                <p className="text-center text-sm text-green-600">+ 10% from last month</p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden transform transition-transform hover:scale-105 hover:shadow-2xl">
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-700">Total Revenue</h2>
                <p className="text-3xl font-bold text-gray-900">$98,765</p>
              </div>
              <div className="bg-purple-100 p-2 rounded-b-lg">
                <p className="text-center text-sm text-purple-600">+ 15% from last month</p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden transform transition-transform hover:scale-105 hover:shadow-2xl">
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-700">New Signups</h2>
                <p className="text-3xl font-bold text-gray-900">45</p>
              </div>
              <div className="bg-yellow-100 p-2 rounded-b-lg">
                <p className="text-center text-sm text-yellow-600">+ 5 from last month</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
