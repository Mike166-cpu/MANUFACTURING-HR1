import React from 'react';
import { FiX, FiClock, FiTrendingUp, FiAlertCircle } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const EmployeeAnalyticsModal = ({ employee, onClose }) => {
  if (!employee) return null;

  const getPerformanceColor = (score) => {
    if (score >= 0.8) return 'text-green-500';
    if (score >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getMetricExplanation = (metric, value) => {
    const explanations = {
      performanceScore: 'Calculated based on attendance (60%) and work hours compliance (40%)',
      onTimeRate: 'Percentage of times the employee arrived on time',
      workHoursCompliance: 'Ratio of actual work hours to expected work hours (8h)',
      overtimeHours: 'Total additional hours worked beyond regular schedule'
    };
    return explanations[metric] || 'No explanation available';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Employee Analytics</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <FiX size={24} />
            </button>
          </div>

          {/* Employee Info */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-2">{employee.employee_fullname}</h3>
            <p className="text-gray-600">{employee.position}</p>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <FiTrendingUp className="mr-2" />
                <h4 className="font-semibold">Performance Score</h4>
              </div>
              <p className={`text-2xl font-bold ${getPerformanceColor(employee.score)}`}>
                {(employee.score * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {getMetricExplanation('performanceScore')}
              </p>
            </div>
          </div>

          {/* Detailed Analysis */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Detailed Analysis</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-semibold mb-4">Work Patterns</h5>
              <div className="space-y-4">
                {[
                  {
                    label: 'Attendance',
                    value: employee.metrics?.attendanceStreak || 0,
                    max: 30, // Changed from 10 to 30 days for a more realistic scale
                    unit: 'days',
                    color: '#6366F1' // indigo-500
                  },
                  {
                    label: 'Efficiency',
                    value: employee.metrics?.efficiencyRate || 0,
                    max: 5,
                    unit: 'tasks/hr',
                    color: '#10B981' // emerald-500
                  },
                  {
                    label: 'Break Compliance',
                    value: (employee.metrics?.breakTimeCompliance || 0) * 100,
                    max: 100,
                    unit: '%',
                    color: '#3B82F6' // blue-500
                  },
                  {
                    label: 'Workload',
                    value: (employee.metrics?.workloadDistribution?.workloadScore || 0) * 100,
                    max: 100,
                    unit: '%',
                    color: '#8B5CF6' // violet-500
                  }
                ].map(metric => (
                  <div key={metric.label} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{metric.label}</span>
                      <span className="font-medium">
                        {metric.value.toFixed(1)}{metric.unit}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        style={{ 
                          width: `${(metric.value / metric.max) * 100}%`,
                          backgroundColor: metric.color,
                          height: '100%',
                          borderRadius: '9999px'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Peak Hours</span>
                    <span className="font-medium">
                      {employee.detailedAnalysis?.workPatterns?.peakProductivityHours?.peak || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pattern</span>
                    <span className="font-medium">
                      {employee.detailedAnalysis?.workPatterns?.peakProductivityHours?.pattern || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Department Performance Context */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-semibold mb-4">Department Context</h5>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Individual vs Department Average</span>
                    <span className="font-medium">
                      {employee.score ? (employee.score * 100).toFixed(1) : 'N/A'}% vs {
                        employee.departmentAverage ? (employee.departmentAverage * 100).toFixed(1) : 'N/A'
                      }%
                    </span>
                  </div>
                  {employee.score && employee.departmentAverage && (
                    <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full"
                        style={{ width: `${(employee.score * 100)}%` }}
                      />
                      <div 
                        className="absolute top-0 h-full w-0.5 bg-yellow-500"
                        style={{ left: `${(employee.departmentAverage * 100)}%` }}
                      />
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Yellow line indicates department average
                  </p>
                </div>
                <div className="space-y-2">
                  <h6 className="text-sm font-medium">Key Insights:</h6>
                  <ul className="text-sm space-y-1">
                    {employee.score > (employee.departmentAverage || 0) ? (
                      <li className="text-green-600">
                        • Performing above department average by {
                          ((employee.score - (employee.departmentAverage || 0)) * 100).toFixed(1)
                        }%
                      </li>
                    ) : (
                      <li className="text-yellow-600">
                        • Opportunity to improve performance to meet department average
                      </li>
                    )}
                    {employee.metrics?.efficiencyRate > (employee.departmentEfficiencyAverage || 0) && (
                      <li className="text-green-600">
                        • Higher task efficiency than department average
                      </li>
                    )}
                    {employee.recentTrend === 'improving' && (
                      <li className="text-green-600">
                        • Showing consistent improvement in performance
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Recommendations */}
            <div className="mt-6">
              <h5 className="font-semibold mb-2">Recommended Actions</h5>
              <div className="space-y-3">
                {employee.recommendations?.map((rec, index) => (
                  <div key={index} className={`p-3 rounded-lg ${
                    rec.severity === 'high' ? 'bg-red-50 border-l-4 border-red-400' :
                    rec.severity === 'medium' ? 'bg-yellow-50 border-l-4 border-yellow-400' :
                    'bg-blue-50 border-l-4 border-blue-400'
                  }`}>
                    <p className="font-medium text-gray-800">{rec.message}</p>
                    <p className="text-sm text-gray-600 mt-1">{rec.suggestion}</p>
                    {rec.actionItems && (
                      <ul className="mt-2 space-y-1">
                        {rec.actionItems.map((item, i) => (
                          <li key={i} className="text-sm text-gray-600 flex items-center">
                            <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeAnalyticsModal;