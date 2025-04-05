import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import EmployeeSidebar from "../../Components/EmployeeSidebar";
import EmployeeNav from "../../Components/EmployeeNav";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction"; // Added for more interactions
import axios from "axios";
const UploadDocument = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const APIBASED_URL = "https://backend-hr1.jjm-manufacturing.com";

  useEffect(() => {
    document.title = "Employee Calendar";
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async () => {
    const employeeId = localStorage.getItem("employeeId");

    if (!employeeId) {
      Swal.fire({
        title: "Not Logged In",
        text: "You are not logged in. Redirecting to Login Page",
        icon: "warning",
        confirmButtonText: "OK",
      }).then(() => {
        navigate("/employeelogin");
      });
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(
        `${APIBASED_URL}/api/timetrack/calendar/${employeeId}`
      );

      const scheduleResponse = await axios.get(
        `${APIBASED_URL}/api/timetrack/schedule/${employeeId}`
      );

      const workingDays = scheduleResponse.data.days || [];
      const firstDayOfWork = new Date(scheduleResponse.data.createdAt);
      const currentDate = new Date();
      const events = [];

      // Add first day of work event
      events.push({
        title: "First Day of Work",
        start: firstDayOfWork,
        allDay: true,
        backgroundColor: "#9c27b0",
        textColor: "#fff",
        display: "block",
        classNames: ["first-day-work"],
      });

      // Add 3 months of day labels (previous, current, and next month)
      for (let i = -31; i < 62; i++) {
        const date = new Date(currentDate);
        date.setDate(currentDate.getDate() + i);
        const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
        const isWorkingDay = workingDays.includes(dayName);

        // Only add working/non-working day labels for dates after first day of work
        if (date >= firstDayOfWork) {
          events.push({
            title: isWorkingDay ? "Working Day" : "Day Off",
            start: date,
            allDay: true,
            display: "background",
            backgroundColor: isWorkingDay
              ? "rgba(0, 123, 255, 0.1)"
              : "rgba(255, 77, 77, 0.1)",
          });
        }
      }
      response.data.forEach((event) => {
        events.push({
          ...event,
          display: "block",
        });
      });

      setEvents(events);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching calendar data:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to load calendar data",
        icon: "error",
        confirmButtonText: "OK",
      });
      setLoading(false);
    }
  };

  const handleEventClick = (clickInfo) => {
    setSelectedEvent(clickInfo.event);
  };

  const renderEventContent = (eventInfo) => {
    const eventType = eventInfo.event.title;

    if (eventType === "First Day of Work") {
      return (
        <div className="p-1 rounded-md text-white flex items-center bg-purple-600">
          <span className="mr-1">🎯</span>
          <span className="text-xs truncate">First Day of Work</span>
        </div>
      );
    }

    // Return empty content for background events (working/non-working days)
    if (eventInfo.event.display === "background") {
      return (
        <div className="text-xs font-semibold px-1 py-0.5 text-gray-600">
          {eventType}
        </div>
      );
    }

    // For regular events (attendance records)
    let bgColor = "";
    let icon = "";

    switch (eventType) {
      case "Absent":
        bgColor = "bg-red-500";
        icon = "❌";
        break;
      case "Present":
        bgColor = "bg-green-500";
        icon = "✅";
        break;
      case "Scheduled Work":
        bgColor = "bg-blue-500";
        icon = "📅";
        break;
      default:
        bgColor = "bg-gray-500";
        icon = "📆";
    }

    return (
      <div
        className={`p-1 rounded-md text-white flex items-center ${bgColor}`}
        title={`${eventType} on ${eventInfo.event.start.toLocaleDateString()}`}
      >
        <span className="mr-1">{icon}</span>
        <span className="text-xs truncate">{eventType}</span>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <EmployeeSidebar
        isSidebarOpen={isSidebarOpen}
        onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div
        className={`flex-grow transition-all duration-300 ${
          isSidebarOpen ? "ml-72" : "ml-0"
        }`}
      >
        <EmployeeNav
          isSidebarOpen={isSidebarOpen}
          onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <div className="rounded-lg p-10 mt-4 max-w-full">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center md:text-left">
            My Work Calendar
          </h2>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto p-4 bg-white">
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,dayGridWeek,dayGridDay",
                }}
                events={events}
                eventContent={renderEventContent}
                eventClick={handleEventClick}
                height="auto"
                displayEventTime={false}
                viewClassNames="border rounded-lg"
                className="custom-calendar w-full"
                eventOrder="display" // This ensures background events are rendered first
              />
            </div>
          )}
        </div>

        {selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">{selectedEvent.title}</h3>
              <p>Date: {selectedEvent.start.toLocaleDateString()}</p>
              <button
                onClick={() => setSelectedEvent(null)}
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadDocument;
