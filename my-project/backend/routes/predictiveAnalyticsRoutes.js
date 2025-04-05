const express = require("express");
const router = express.Router();
const timeTrackingController = require("../controllers/timeTrackingController");
const {
  trainModelAndPredict,
  trainLeaveModelAndPredict,
  getAbsenteeismPrediction,
} = require("../services/predictiveAnalytics");

router.get("/attendance-predictions", async (req, res) => {
  const result = await trainModelAndPredict();
  res.json(result);
});

router.get("/leave-predictions", async (req, res) => {
  const result = await trainLeaveModelAndPredict();
  res.json(result);
});

router.get("/predict-absent", async (req, res) => {
  const result = await getAbsenteeismPrediction();
  res.json(result);
});

router.get("/predict-absenteeism", async (req, res) => {
  const result = await getAbsenteeismPrediction();
  res.json(result);
});

module.exports = router;
