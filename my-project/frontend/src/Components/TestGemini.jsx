import React, { useState, useEffect } from "react";
import axios from "axios";
import { SiOpenai } from "react-icons/si";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const TestGemini = () => {
  const [topPerformer, setTopPerformer] = useState(null);
  const [analytics, setAnalytics] = useState("");
  const [aiDescription, setAIDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [suggestionModal, setSuggestionModal] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";
  const LOCAL = "http://localhost:7685";

  const handlePromotionAnalytics = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${APIBASED_URL}/api/ai/promotion-analytics`);
      if (res.data && res.data.topPerformer) {
        setTopPerformer(res.data.topPerformer);
        setAnalytics(res.data.analytics);
        setAIDescription(res.data.aiDescription);
        setShowModal(true);
      } else {
        setError("No analytics data received from server.");
      }
    } catch (err) {
      setError("Failed to fetch promotion analytics.");
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axios.get(
          `${APIBASED_URL}/api/ai/promotion-analytics`
        );
        if (res.data && Array.isArray(res.data.rankings)) {
          setEmployees(res.data.rankings);
        } else if (res.data && res.data.topPerformer) {
          setEmployees([res.data.topPerformer]);
        } else {
          setEmployees([]);
        }
      } catch (err) {
        setError("Failed to fetch employees");
        setEmployees([]);
      }
    };
    fetchEmployees();
  }, []);

  const getPromotionSuggestion = async (employee) => {
    setSelectedEmployee(employee);
    setSuggestionModal(true);
    setLoadingSuggestion(true);
    setSuggestion("");
    try {
      const prompt = `
          Employee Profile:
          Name: ${employee.name}
          Position: ${employee.position}
          Department: ${employee.department}
          Experience: ${employee.yearsExp} years
          Skills: ${employee.skillsCount}
          Education: ${employee.highestEdu}

          Based on this employee's profile, suggest:
          1. The most suitable next career move or position for this employee.
          2. The specific skills or certifications they should develop to be ready for that move.
          3. A realistic timeline for achieving this promotion.
          Please format your answer as a table with columns: "Suggested Position", "Required Skills/Certifications", "Estimated Timeline".
        `;
      const res = await axios.post(`${APIBASED_URL}/api/ai/test-ai`, {
        prompt,
      });
      setSuggestion(
        res.data.response || res.data.suggestion || "No suggestion available."
      );
    } catch (err) {
      setSuggestion("Failed to get AI suggestion.");
    }
    setLoadingSuggestion(false);
  };

  const parseSuggestionTable = (text) => {
    if (!text) return [];
    const lines = text.split("\n").filter((l) => l.trim());
    return lines
      .map((line) => {
        const parts = line.split("|").map((p) => p.trim());
        if (parts.length >= 3) {
          return parts;
        }
        const fields = line.split(":").map((f) => f.trim());
        if (fields.length >= 2) {
          return [fields[0], fields.slice(1).join(":")];
        }
        return null;
      })
      .filter(Boolean);
  };

  const performanceChart = {
    labels: ["Experience", "Skills", "Education", "Company Avg"],
    datasets: [
      {
        label: "Performance Metrics",
        data: topPerformer
          ? [
              topPerformer.yearsExp,
              topPerformer.skillsCount,
              topPerformer.educationRank,
              parseFloat(
                analytics?.match(/Average Experience: ([\d.]+)/)?.[1] || 0
              ),
            ]
          : [],
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
        fill: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Employee Performance Analysis",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex justify-center items-center">
        <div className="bg-white rounded-lg shadow-xl w-[900px] max-h-[90vh] m-4 overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-xl font-semibold">Performance Analysis</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {children}
          </div>
        </div>
      </div>
    );
  };

  const SuggestionModal = ({ isOpen, onClose, employee, suggestion }) => {
    const [followup, setFollowup] = useState("");
    const [followupLoading, setFollowupLoading] = useState(false);
    const [followupResult, setFollowupResult] = useState("");

    if (!isOpen || !employee) return null;

    const handleFollowup = async (e) => {
      e.preventDefault();
      if (!followup.trim()) return;
      setFollowupLoading(true);
      setFollowupResult("");
      try {
        const prompt = `
            Employee Profile:
            Name: ${employee.name}
            Position: ${employee.position}
            Department: ${employee.department}
            Experience: ${employee.yearsExp} years
            Skills: ${employee.skillsCount}
            Education: ${employee.highestEdu}

            Previous Suggestion:
            ${suggestion}

            User Follow-up Question:
            ${followup}

            Please answer the user's follow-up question based on the employee's profile and previous suggestion.
          `;
        const res = await axios.post(`${APIBASED_URL}/api/ai/test-ai`, {
          prompt,
        });
        setFollowupResult(
          res.data.response ||
            res.data.suggestion ||
            "No follow-up suggestion available."
        );
      } catch (err) {
        setFollowupResult("Failed to get follow-up suggestion.");
      }
      setFollowupLoading(false);
    };

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex justify-center items-center">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] m-4 overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-xl font-semibold">
              Personalized Career Suggestion
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[calc(80vh-64px)]">
            <div className="mb-6">
              <div className="font-semibold">{employee.name}</div>
              <div className="text-sm text-gray-600">
                {employee.position} - {employee.department}
              </div>
            </div>
            <div className="mb-6">
              <Line
                data={{
                  labels: ["Experience", "Skills", "Education"],
                  datasets: [
                    {
                      label: "Performance Metrics",
                      data: [
                        employee.yearsExp,
                        employee.skillsCount,
                        employee.educationRank,
                      ],
                      borderColor: "rgb(75, 192, 192)",
                      backgroundColor: "rgba(75, 192, 192, 0.2)",
                      tension: 0.2,
                      fill: true,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    title: { display: true, text: "Employee Analytics" },
                  },
                  scales: { y: { beginAtZero: true } },
                }}
              />
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 mb-2">
                AI Suggestion
              </h4>
              {loadingSuggestion ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-blue-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-blue-700 uppercase">
                          Suggested Position
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-blue-700 uppercase">
                          Required Skills/Certifications
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {parseSuggestionTable(suggestion).length > 0 ? (
                        parseSuggestionTable(suggestion).map((row, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2 text-blue-900">
                              {row[1]}
                            </td>
                            <td className="px-4 py-2 text-blue-900">
                              {row[2]}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td className="px-4 py-2 text-blue-900" colSpan={3}>
                            No suggestion available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <form className="mt-8 flex gap-2" onSubmit={handleFollowup}>
              <input
                type="text"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Ask a follow-up question..."
                value={followup}
                onChange={(e) => setFollowup(e.target.value)}
                disabled={followupLoading}
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                disabled={followupLoading || !followup.trim()}
              >
                {followupLoading ? "Asking..." : "Ask"}
              </button>
            </form>
            {followupResult && (
              <div className="mt-4 bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">
                  Follow-up Suggestion
                </h4>
                <div className="text-blue-900 whitespace-pre-line text-sm">
                  {followupResult}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 space-y-6 bg-gray-50 min-h-screen">
      {/* Remove the big card on top, use a simple header and button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <button
          onClick={handlePromotionAnalytics}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 transition-all duration-150"
        >
          {loading ? "Processing..." : "Analyze"}
        </button>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-700">Employees</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500">
                  Name
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">
                  Position
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">
                  Department
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">
                  Education
                </th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {employees.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-4 text-center text-gray-400"
                  >
                    No employees found.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id}>
                    <td className="px-4 py-2">{emp.name}</td>
                    <td className="px-4 py-2">{emp.position}</td>
                    <td className="px-4 py-2">{emp.department}</td>
                    <td className="px-4 py-2">{emp.highestEdu}</td>
                    <td className="px-4 py-2">
                      <button
                        className="px-3 py-1 rounded border border-blue-600 text-blue-600 hover:bg-blue-50 transition-all duration-100"
                        onClick={() => getPromotionSuggestion(emp)}
                      >
                        AI Suggestion
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SuggestionModal
        isOpen={suggestionModal}
        onClose={() => setSuggestionModal(false)}
        employee={selectedEmployee}
        suggestion={suggestion}
      />

      {/* Top Performer Card - make it minimal and clean */}
      {topPerformer && (
        <div className="bg-white rounded-lg shadow border border-gray-200 mt-6">
          <div className="p-4 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Current Top Performer
                </h3>
                <div className="text-gray-600 text-sm">
                  {topPerformer.name} - {topPerformer.position} (
                  {topPerformer.department})
                </div>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="mt-2 md:mt-0 px-3 py-1 rounded border border-blue-600 text-blue-600 hover:bg-blue-50 transition-all duration-100"
              >
                View Detailed Analysis
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-gray-500">Experience</div>
                <div className="font-medium">{topPerformer.yearsExp} years</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Skills</div>
                <div className="font-medium">{topPerformer.skillsCount}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Education</div>
                <div className="font-medium">{topPerformer.highestEdu}</div>
              </div>
            </div>
            <div className="bg-blue-50 rounded p-3 mt-2">
              <div className="text-xs text-blue-700 font-semibold mb-1">
                AI Insights
              </div>
              <div className="text-blue-900 text-sm">{aiDescription}</div>
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            {/* Left Column */}
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h4 className="font-semibold">{topPerformer?.name}</h4>
                <p className="text-sm text-gray-600">
                  {topPerformer?.position} • {topPerformer?.department}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Experience</div>
                <div className="font-semibold">
                  {topPerformer?.yearsExp} years
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm text-blue-600">Skills</div>
                <div className="font-semibold">{topPerformer?.skillsCount}</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-sm text-green-600">Education</div>
                <div className="font-semibold">{topPerformer?.highestEdu}</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-sm text-purple-600">Rank</div>
                <div className="font-semibold">Top Performer</div>
              </div>
            </div>

            {/* Career Path */}
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h4 className="font-semibold text-indigo-800 mb-2">
                Career Path
              </h4>
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-indigo-400"></div>
                <span className="text-indigo-900 font-medium">
                  Current: {topPerformer?.position}
                </span>
              </div>
              <div className="border-l-2 border-indigo-200 ml-1.5 pl-6 space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-300"></div>
                  <span className="text-indigo-800">
                    Senior {topPerformer?.position}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-300"></div>
                  <span className="text-indigo-800">
                    Lead {topPerformer?.position}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-300"></div>
                  <span className="text-indigo-800">
                    {topPerformer?.position} Manager
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Right Column */}
            {/* Performance Chart */}
            <div className="bg-white p-4 rounded-lg border">
              <Line data={performanceChart} options={chartOptions} />
            </div>

            {/* AI Analysis */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">
                AI Recommendations
              </h4>
              <p className="text-blue-900 text-sm">
                {aiDescription ===
                "AI analysis is currently disabled for faster response."
                  ? "AI analysis is temporarily disabled. Please try again later or contact your administrator."
                  : aiDescription}
              </p>
            </div>
          </div>
        </div>
      </Modal>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mt-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
};

export default TestGemini;
