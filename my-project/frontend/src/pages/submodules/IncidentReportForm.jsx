import React, { useState } from "react";
import axios from "axios";

const IncidentReportForm = () => {
  const [incidentData, setIncidentData] = useState({
    date: "",
    description: "",
    status: "Pending", // Set default status to Pending
  });

  const handleChange = (e) => {
    setIncidentData({
      ...incidentData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { status, ...dataToSubmit } = incidentData;

      const response = await axios.post(
        "http://localhost:5000/api/incidentreport",
        { ...dataToSubmit, status }
      );

      if (response.status === 201) {
        alert("Incident Report Submitted Successfully!");
        setIncidentData({ date: "", description: "", status: "Pending" }); // Reset form, default status is Pending
      }
    } catch (error) {
      console.error("Error submitting the incident report:", error);
      alert("Failed to submit the report.");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Incident Report Form</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block font-bold mb-2">Date</label>
          <input
            type="date"
            name="date"
            value={incidentData.date}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block font-bold mb-2">Incident Description</label>
          <textarea
            name="description"
            value={incidentData.description}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Submit Incident Report
        </button>
      </form>
    </div>
  );
};

export default IncidentReportForm;
