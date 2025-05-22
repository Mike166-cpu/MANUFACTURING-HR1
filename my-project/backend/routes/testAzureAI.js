const express = require("express");
const { askAI } = require("../utils/aiClient");
const TimeTracking = require("../models/TimeTracking");
const router = express.Router();
const Employee = require("../models/Employee");

router.get("/test-ai", async (req, res) => {
  try {
    const prompt =
      "Suggest the best shift for an employee who is often late in the morning.";
    console.log("[DEBUG] Sending prompt to AI:", prompt);

    const response = await askAI(prompt);

    console.log("[DEBUG] AI Response received:", response);
    res.json({ suggestion: response });
  } catch (err) {
    console.error("[ERROR] Azure AI error:", err);
    res.status(500).json({ error: "Failed to get AI suggestion" });
  }
});

router.post("/test-ai", async (req, res) => {
  try {
    const prompt = req.body.prompt;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }
    console.log("[DEBUG] Sending prompt to AI:", prompt);

    const response = await askAI(prompt);

    console.log("[DEBUG] AI Response received:", response);
    res.json({ response });
  } catch (err) {
    console.error("[ERROR] Azure AI error:", err);
    res.status(500).json({ error: "Failed to get AI suggestion" });
  }
});

router.get("/suggest-shift/:employeeId", async (req, res) => {
  const { employeeId } = req.params;

  try {
    // Fetch the latest 2 weeks of attendance records for the employee
    const records = await TimeTracking.find({
      employee_id: employeeId,
    })
      .sort({ createdAt: -1 })
      .limit(14);

    if (!records || records.length === 0) {
      return res.status(404).json({ error: "No attendance records found." });
    }

    // Analyze lateness
    const lateMorning = records.filter(
      (r) => r.entry_status === "late" && r.shift_period === "morning"
    ).length;
    const lateAfternoon = records.filter(
      (r) => r.entry_status === "late" && r.shift_period === "afternoon"
    ).length;

    const summary = `
        Employee has ${lateMorning} late records in the morning and ${lateAfternoon} late records in the afternoon out of ${records.length} entries in the past 2 weeks.
      `;

    console.log("AI Prompt Summary:", summary);

    const prompt = `Based on this attendance data, suggest the best shift period (morning or afternoon) for the employee to reduce lateness:\n${summary}`;
    const suggestion = await askAI(prompt);

    res.json({ suggestion });
  } catch (err) {
    console.error("Error generating shift suggestion:", err);
    res.status(500).json({ error: "Failed to generate shift suggestion" });
  }
});

router.get("/promotion-analytics", async (req, res) => {
  try {
    // Fetch all employees, regardless of status or archived
    const employees = await Employee.find({});

    if (!employees || employees.length === 0) {
      return res.status(404).json({ error: "No employees found." });
    }

    // 2. Rank employees (example: by experience years, number of skills, education level)
    const educationRank = {
      "Graduate School": 4,
      College: 3,
      "High School": 2,
      Elementary: 1,
      Other: 0,
    };

    const ranked = employees
      .map((emp) => {
        // Parse years of experience if possible
        const yearsExp = parseInt(emp.experience) || 0;
        // Get highest education level
        const highestEdu = emp.education?.reduce((max, edu) => {
          return educationRank[edu.level] > educationRank[max]
            ? edu.level
            : max;
        }, "Other");
        return {
          id: emp.employeeId,
          name: emp.fullname,
          position: emp.position,
          department: emp.department,
          yearsExp,
          skillsCount: emp.skills?.length || 0,
          highestEdu,
          educationRank: educationRank[highestEdu] || 0,
        };
      })
      .sort((a, b) => {
        // Sort by experience, then skills, then education
        if (b.yearsExp !== a.yearsExp) return b.yearsExp - a.yearsExp;
        if (b.skillsCount !== a.skillsCount)
          return b.skillsCount - a.skillsCount;
        return b.educationRank - a.educationRank;
      });

    // 3. Analytics summary
    const top1 = ranked[0];
    const avgExp =
      ranked.reduce((sum, emp) => sum + emp.yearsExp, 0) / ranked.length;

    const analytics = `
        Top Performer Analysis:
        ${top1?.name} (${top1?.position})
        Experience: ${top1?.yearsExp} years
        Skills: ${top1?.skillsCount}
        Education: ${top1?.highestEdu}
        
        Department: ${top1?.department}
        Company Average Experience: ${avgExp.toFixed(2)} years
        Total Employees Evaluated: ${ranked.length}

        Current Career Level: ${top1?.position}
        Suggested Next Positions:
        1. Senior ${top1?.position}
        2. Lead ${top1?.position}
        3. ${top1?.position} Manager
    `;

    const prompt = `Based on this employee data:\n${analytics}\nProvide a brief 2-3 sentence analysis highlighting key strengths and specific recommendations for advancing to the suggested next positions. Consider their current position, experience, and skills.`;

    // 4. Ask AI to describe the analytics
    const aiDescription = await askAI(prompt);

    // Fix: Always return the full ranked array as 'rankings'
    res.json({
      topPerformer: {
        ...top1,
        educationRank: educationRank[top1.highestEdu] || 0,
      },
      rankings: ranked, // <-- ensure this is always present and is an array
      analytics,
      aiDescription,
    });
  } catch (err) {
    console.error("Error generating promotion analytics:", err);
    res.status(500).json({ error: "Failed to generate promotion analytics" });
  }
});

router.get("/approveSessions", async (req, res) => {
  try {
    const sessions = await TimeTracking.find({ status: "approved" });

    const formatDuration = (duration) => {
      if (typeof duration === "string") {
        const match = duration.match(/^(\d+)H (\d+)M$/);
        if (match) {
          const hours = parseInt(match[1]);
          const minutes = parseInt(match[2]);
          return `${hours}H ${minutes.toString().padStart(2, '0')}M`;
        }
      }
      return duration || "0H 00M";
    };

    const formattedSessions = sessions.map((session) => {
      const totalHours = session.total_hours || "0H 00M";
      const overtimeHours = session.overtime_hours || "0H 00M";
      
      return {
        ...session._doc,
        total_hours: formatDuration(totalHours),
        overtime_hours: formatDuration(overtimeHours),
      };
    });

    res.status(200).json(formattedSessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
