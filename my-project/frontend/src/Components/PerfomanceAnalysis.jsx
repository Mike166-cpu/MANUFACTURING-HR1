import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiTrendingUp, FiUsers, FiAward, FiBriefcase, FiEye, FiInfo } from "react-icons/fi";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import EmployeeAnalyticsModal from "./EmployeeAnalyticsModal";
import DepartmentExplanationModal from "./DepartmentExplanationModal";

const PerformanceAnalysis = () => {
  const [analysisData, setAnalysisData] = useState({
    topPerformers: [],
    totalEmployees: 0,
    averageScore: 0,
    departmentStats: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDepartmentExplanation, setShowDepartmentExplanation] = useState(false);

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "http://localhost:7685/api/analyze-performance"
      );
      setAnalysisData(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        Loading analysis...
      </div>
    );
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="space-y-6">
      {/* Ensure this div is properly closed at the end of the JSX structure */}
      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <FiUsers className="text-3xl text-blue-500 mr-4" />
            <div>
              <p className="text-gray-500">Total Employees</p>
              <p className="text-2xl font-bold">
                {analysisData.totalEmployees}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <FiTrendingUp className="text-3xl text-green-500 mr-4" />
            <div>
              <p className="text-gray-500">Average Score</p>
              <p className="text-2xl font-bold">
                {(analysisData.averageScore * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="col-span-2 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FiAward className="mr-2" /> Top Performer
          </h3>
          {analysisData.topPerformers[0] && (
            <div>
              <p className="text-xl font-bold">
                {analysisData.topPerformers[0].name}
              </p>
              <p className="text-gray-500">
                Score: {(analysisData.topPerformers[0].score * 100).toFixed(1)}%
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Department Performance Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center">
            <FiBriefcase className="mr-2" /> Department Performance
          </h3>
          <button
            onClick={() => setShowDepartmentExplanation(true)}
            className="flex items-center text-indigo-600 hover:text-indigo-800 px-4 py-2 border border-indigo-600 rounded"
          >
            <FiInfo className="mr-1" /> View Department Analysis
          </button>
        </div>
      </div>

      <DepartmentExplanationModal
        isOpen={showDepartmentExplanation}
        onClose={() => setShowDepartmentExplanation(false)}
        departmentStats={analysisData.departmentStats}
      />

      {/* Top Performers Cards */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Top Performers</h3>
        <div className="space-y-4">
          {analysisData.topPerformers?.map((performer, index) => (
            <div 
              key={performer.employee_id || `performer-${index}`}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-white"
              onClick={() => setSelectedEmployee(performer)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6 flex-1">
                  <div className="space-y-1 min-w-[200px]">
                    <h4 className="text-lg font-medium text-gray-900">{performer.name}</h4>
                    <p className="text-sm text-gray-500">{performer.position || 'Position Not Specified'}</p>
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold">Department</p>
                    <p className="text-gray-600">{performer.department || 'Not Specified'}</p>
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold">Score</p>
                    <p className="text-gray-600">{(performer.score * 100).toFixed(1)}%</p>
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold">Recent Performance</p>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        performer.recentTrend === "improving"
                          ? "bg-green-100 text-green-800"
                          : performer.recentTrend === "declining"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {performer.recentTrend}
                    </span>
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold">Last Review</p>
                    <p className="text-gray-600">{performer.lastReview || 'Not Available'}</p>
                  </div>
                </div>
                <button className="flex items-center text-indigo-600 hover:text-indigo-800">
                  <FiEye className="h-5 w-5" />
                  <span className="ml-2 text-sm">View Details</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedEmployee && (
        <EmployeeAnalyticsModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </div>
  );
};

export default PerformanceAnalysis;
