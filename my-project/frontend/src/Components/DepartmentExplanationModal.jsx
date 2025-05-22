import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const DepartmentExplanationModal = ({ isOpen, onClose, departmentStats }) => {
  if (!isOpen) return null;

  const chartData = Object.entries(departmentStats).map(([dept, stats]) => ({
    department: dept,
    score: stats.averageScore * 100,
  }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-4xl w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Department Performance Analysis</h2>
        
        {/* Chart Section */}
        <div className="h-64 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="score" fill="#4F46E5" name="Performance Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Analysis Section */}
        <div className="space-y-4">
          {Object.entries(departmentStats).map(([dept, stats]) => (
            <div key={dept} className="border-b pb-4">
              <h3 className="font-semibold text-lg">{dept}</h3>
              <p className="text-gray-600">Average Score: {(stats.averageScore * 100).toFixed(1)}%</p>
              <p className="text-sm text-gray-500 mt-2">
                {stats.averageScore >= 0.8 ? 
                  "Excellent performance! This department is exceeding expectations." :
                  stats.averageScore >= 0.6 ?
                  "Good performance with room for improvement." :
                  "This department needs attention and performance improvement measures."}
              </p>
            </div>
          ))}
        </div>
        
        <button
          onClick={onClose}
          className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default DepartmentExplanationModal;
