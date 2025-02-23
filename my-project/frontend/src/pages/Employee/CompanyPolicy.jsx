import React, { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import EmployeeSidebar from "../../Components/EmployeeSidebar";
import EmployeeNav from "../../Components/EmployeeNav";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handleChange = () => setMatches(mediaQuery.matches);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
};

const CompanyPolicy = () => {
  useEffect(() => {
    document.title = "Company Policy";
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const isMobileView = useMediaQuery("(max-width: 768px)");
  const [policies, setPolicies] = useState([]);
  const [acknowledgedPolicies, setAcknowledgedPolicies] = useState([]);
  const employeeUsername = localStorage.getItem("employeeUsername");
  const authToken = localStorage.getItem("employeeToken");

  const APIBase_URL = "https://backend-hr1.jjm-manufacturing.com";

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const response = await fetch(`${APIBase_URL}/api/policies/fetch`);
        const data = await response.json();
        setPolicies(data);
      } catch (error) {
        console.error("Error fetching policies:", error);
      }
    };

    const fetchAcknowledgedPolicies = async () => {
      try {
        const response = await fetch(
          `${APIBase_URL}/api/policies/acknowledged/${employeeUsername}`
        );
        const acknowledgedData = await response.json();

        if (Array.isArray(acknowledgedData)) {
          const acknowledgedPolicyIds = acknowledgedData.map(
            (policy) => policy.policy_id
          );
          setAcknowledgedPolicies(acknowledgedPolicyIds);
        } else {
          console.error("Expected an array but received:", acknowledgedData);
          setAcknowledgedPolicies([]);
        }
      } catch (error) {
        console.error("Error fetching acknowledged policies:", error);
      }
    };

    fetchPolicies();
    fetchAcknowledgedPolicies();
  }, [employeeUsername]);

  const acknowledgePolicy = async (policyId) => {
    try {
      const response = await fetch(
        `${APIBase_URL}/api/policies/acknowledge/${policyId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ employee_username: employeeUsername }),
        }
      );

      if (response.ok) {
        setAcknowledgedPolicies((prevAcknowledged) => [
          ...prevAcknowledged,
          policyId,
        ]);
        toast.success("Acknowledge successfully!", { position: "top-right" });
      } else {
        const data = await response.json();
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error acknowledging policy:", error);
    }
  };

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (!authToken) {
    return <Navigate to="/employeelogin" replace />;
  }

  const Breadcrumbs = ({ items }) => {
    return (
      <nav className="pl-5">
        <ol className="list-reset flex">
          {items.map((item, index) => (
            <li key={index} className="flex items-center">
              <span className="text-blue-800 text-sm">{item.label}</span>
              {index < items.length - 1 && <span className="mx-2">{">"}</span>}
            </li>
          ))}
        </ol>
      </nav>
    );
  };

  const breadcrumbItems = [
    { label: "HR Compliance" },
    { label: "Policies", className: "font-bold" },
  ];

  const handleResize = () => {
    if (window.innerWidth >= 768) {
      setIsSidebarOpen(true);
    } else {
      setIsSidebarOpen(false);
    }
  };

  useEffect(() => {
    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div>
      <div>
        <ToastContainer />
        <EmployeeSidebar
          onSidebarToggle={handleSidebarToggle}
          isSidebarOpen={isSidebarOpen}
        />
        <div
          className={`flex-grow transition-all duration-300 ease-in-out ${
            isSidebarOpen ? "ml-0 md:ml-72" : "ml-0"
          } relative`}
        >
          <EmployeeNav
            onSidebarToggle={handleSidebarToggle}
            isSidebarOpen={isSidebarOpen}
          />

          {/* Mobile overlay */}
          {isSidebarOpen && isMobileView && (
            <div
              className="fixed inset-0 bg-black opacity-50 z-10"
              onClick={() => setIsSidebarOpen(false)}
            ></div>
          )}
          <div className="flex-1 overflow-y-auto bg-base-500">
            <div className="border rounded-lg m-5 py-5">
              <h2 className="text-2xl font-bold pl-5 dark:text-white">
                Company Policies
              </h2>
              <Breadcrumbs items={breadcrumbItems} />
            </div>

            {/* MAIN CONTENT */}
            <div className="p-5">
              <table className="table-auto w-full">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-start text-sm text-gray-500 font-medium border-b dark:text-white">
                      Title
                    </th>
                    <th className="px-4 py-2 text-start text-sm text-gray-500 font-medium border-b dark:text-white">
                      Description
                    </th>
                    <th className="px-4 py-2 text-start text-sm text-gray-500 font-medium border-b dark:text-white">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {policies.map((policy) => (
                    <tr key={policy._id}>
                      <td className="border-b px-4 py-2 font-bold text-sm">
                        {policy.title}
                      </td>
                      <td className="border-b px-4 py-2 text-sm ">
                        {policy.description}
                      </td>
                      <td className="border-b px-4 py-2">
                        <button
                          onClick={() => acknowledgePolicy(policy._id)}
                          disabled={acknowledgedPolicies.includes(policy._id)}
                          className={`w-full px-4 py-2 rounded ${
                            acknowledgedPolicies.includes(policy._id)
                              ? "bg-green-600 text-white text-sm cursor-not-allowed rounded-3xl"
                              : "bg-blue-500 hover:bg-blue-700 text-white"
                          }`}
                        >
                          {acknowledgedPolicies.includes(policy._id)
                            ? "Done"
                            : "Acknowledge"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* END OF MAIN CONTENT */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyPolicy;
