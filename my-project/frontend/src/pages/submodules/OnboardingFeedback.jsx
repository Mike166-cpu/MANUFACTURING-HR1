import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import EmployeeNavbar from "../../Components/EmployeeNavbar";
import Swal from "sweetalert2";
import EmployeeSidebar from "../../Components/EmployeeSidebar";
import EmployeeNav from "../../Components/EmployeeNav";

const OnboardingFeedback = () => {
  const navigate = useNavigate();
  const [employeeFirstName, setEmployeeFirstName] = useState("");
  const [employeeLastName, setEmployeeLastName] = useState("");
  const [employeeDepartment, setEmployeeDepartment] = useState("");
  const [feedback, setFeedback] = useState({
    experienceRating: "",
    supportRating: "",
    trainingSatisfaction: "",
    communicationClarity: "",
    roleUnderstanding: "",
    companyCulture: "",
    additionalComments: "",
  });

  useEffect(() => {
    const authToken = sessionStorage.getItem("employeeToken");
    const firstName = localStorage.getItem("employeeFirstName") || "";
    const lastName = localStorage.getItem("employeeLastName") || "";
    const department = localStorage.getItem("employee_department") || "Unknown";

    if (!authToken) {
      Swal.fire({
        title: "Not Logged In",
        text: "You are not logged in. Redirecting to Login Page",
        icon: "warning",
        confirmButtonText: "OK",
      }).then(() => {
        navigate("/employeelogin");
      });
    } else {
      setEmployeeFirstName(firstName);
      setEmployeeLastName(lastName);
      setEmployeeDepartment(department);
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFeedback((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    Swal.fire({
      title: "Feedback Submitted",
      text: "Thank you for your feedback!",
      icon: "success",
      confirmButtonText: "OK",
    });
    console.log(feedback);
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleSidebarToggle = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className="flex">
      <EmployeeSidebar
        onSidebarToggle={handleSidebarToggle}
        isSidebarOpen={isSidebarOpen}
      />
      <div
        className={`flex-grow transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "ml-72" : "ml-0"
        }`}
      >
        <EmployeeNav
          onSidebarToggle={handleSidebarToggle}
          isSidebarOpen={isSidebarOpen}
        />
        {/* MAIN CONTENT */}
        <div className="pt-7">
          <div className="max-w-4xl mx-auto shadow-lg bg-white rounded-lg p-6">
            <h2 className="text-2xl font-bold text-center mb-6">
              Onboarding Feedback
            </h2>
            <form onSubmit={handleSubmit}>
              <table className="table-auto w-full mb-6 text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">Question</th>
                    <th className="px-2 py-2">Excellent</th>
                    <th className="px-2 py-2">Good</th>
                    <th className="px-2 py-2">Average</th>
                    <th className="px-2 py-2">Poor</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      question:
                        "How was your overall experience with the onboarding process?",
                      name: "experienceRating",
                    },
                    {
                      question:
                        "How supportive was the team during the onboarding process?",
                      name: "supportRating",
                    },
                    {
                      question:
                        "How satisfied are you with the training provided?",
                      name: "trainingSatisfaction",
                    },
                    {
                      question:
                        "Was the communication clear during the onboarding process?",
                      name: "communicationClarity",
                    },
                    {
                      question:
                        "How well do you understand your role after onboarding?",
                      name: "roleUnderstanding",
                    },
                    {
                      question:
                        "How well do you feel integrated into the company culture?",
                      name: "companyCulture",
                    },
                  ].map((item, index) => (
                    <tr key={index}>
                      <td className="border px-4 py-2 text-left">
                        {item.question}
                      </td>
                      {["Excellent", "Good", "Average", "Poor"].map(
                        (option) => (
                          <td
                            key={option}
                            className="border px-2 py-2 text-center"
                          >
                            <input
                              type="radio"
                              name={item.name}
                              value={option}
                              checked={feedback[item.name] === option}
                              onChange={handleInputChange}
                              className="radio radio-primary"
                              required
                            />
                          </td>
                        )
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mb-4">
                <label
                  htmlFor="additionalComments"
                  className="block text-sm font-medium text-gray-700"
                >
                  Additional Comments:
                </label>
                <textarea
                  id="additionalComments"
                  name="additionalComments"
                  value={feedback.additionalComments}
                  onChange={handleInputChange}
                  rows="4"
                  className="mt-1 block w-full border shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                >
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFeedback;
