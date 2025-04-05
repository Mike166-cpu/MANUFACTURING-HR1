const tf = require("@tensorflow/tfjs");
const TimeTracking = require("../models/TimeTracking");
const Leave = require("../models/Leave");

const getAbsenteeismPrediction = async () => {
  try {
    // Load trained TensorFlow model
    const model = await tf.loadLayersModel("file://./absenteeism_model/model.json");

    // Fetch real employee records
    const records = await TimeTracking.find();

    if (!records.length) return []; // Return empty array instead of object

    const departmentData = {};

    // Group data by department
    records.forEach((record) => {
      const dept = record.position || "Unknown";
      if (!departmentData[dept]) {
        departmentData[dept] = { present: 0, absent: 0 };
      }

      // Create tensor input for prediction
      const inputTensor = tf.tensor2d([
        [record.minutes_late, record.total_hours, record.overtime_hours, record.is_holiday ? 1 : 0]
      ]);

      const prediction = model.predict(inputTensor);
      const probability = prediction.dataSync()[0];

      if (probability > 0.5) {
        departmentData[dept].absent += 1;
      } else {
        departmentData[dept].present += 1;
      }
    });

    return Object.entries(departmentData).map(([department, values]) => ({
      department,
      present: values.present,
      absent: values.absent,
    }));

  } catch (error) {
    console.error("Error predicting absenteeism:", error);
    return []; // Return empty array on error
  }
};

const trainModelAndPredict = async () => {
  try {
    const data = await TimeTracking.find({});

    if (!data.length) return { message: "No data available for predictions" };

    const inputs = data.map((entry) => entry.minutes_late);
    const labels = data.map((entry) => (entry.entry_status === "late" ? 1 : 0));

    const inputTensor = tf.tensor2d(inputs, [inputs.length, 1]);
    const labelTensor = tf.tensor2d(labels, [labels.length, 1]);

    const model = tf.sequential();
    model.add(
      tf.layers.dense({ units: 10, inputShape: [1], activation: "relu" })
    );
    model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));

    model.compile({
      optimizer: "adam",
      loss: "binaryCrossentropy",
      metrics: ["accuracy"],
    });

    await model.fit(inputTensor, labelTensor, { epochs: 10 });

    const futureInputs = tf.tensor2d([[5], [10], [15], [20], [25]]);
    const predictions = model.predict(futureInputs).arraySync();

    return { predictions };
  } catch (error) {
    console.error("Error in training model:", error);
    return { error: "Prediction error" };
  }
};

const trainLeaveModelAndPredict = async () => {
  try {
    const leaveData = await Leave.find({});

    if (!leaveData.length)
      return { message: "No leave data available for predictions" };

    const inputs = leaveData.map((entry) => entry.days_requested);
    const labels = leaveData.map((entry) =>
      entry.status === "Approved" ? 1 : 0
    );

    const inputTensor = tf.tensor2d(inputs, [inputs.length, 1]);
    const labelTensor = tf.tensor2d(labels, [labels.length, 1]);

    const model = tf.sequential();
    model.add(
      tf.layers.dense({ units: 10, inputShape: [1], activation: "relu" })
    );
    model.add(tf.layers.dense({ units: 1, activation: "sigmoid" }));

    model.compile({
      optimizer: "adam",
      loss: "binaryCrossentropy",
      metrics: ["accuracy"],
    });

    await model.fit(inputTensor, labelTensor, { epochs: 10 });

    const futureInputs = tf.tensor2d([[4], [1], [8], [3], [10]]);
    const predictions = model.predict(futureInputs).arraySync();

    return { predictions };
  } catch (error) {
    console.error("Error in training leave model:", error);
    return { error: "Leave prediction error" };
  }
};

const getAttendanceData = async () => {
  try {
    const data = await TimeTracking.find({}, "time_in overtime_hours entry_status is_holiday");

    return data.map(entry => ({
      day_of_week: new Date(entry.time_in).getDay(), 
      overtime_hours: entry.overtime_hours || 0, 
      is_holiday: entry.is_holiday ? 1 : 0, 
      past_absences: entry.entry_status === "absent" ? 1 : 0, 
    }));
  } catch (error) {
    console.error("Error fetching attendance data:", error);
    return [];
  }
};

const createModel = () => {
  const model = tf.sequential();
  model.add(tf.layers.dense({ inputShape: [3], units: 8, activation: "relu" }));
  model.add(tf.layers.dense({ units: 4, activation: "relu" }));
  model.add(tf.layers.dense({ units: 1, activation: "sigmoid" })); 

  model.compile({
    optimizer: "adam",
    loss: "binaryCrossentropy",
    metrics: ["accuracy"],
  });

  return model;
};

module.exports = { trainModelAndPredict, trainLeaveModelAndPredict, getAbsenteeismPrediction };
