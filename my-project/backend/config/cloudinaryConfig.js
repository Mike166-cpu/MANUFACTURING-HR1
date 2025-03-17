const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "da7oknctx",
  api_key: "786947371466382",
  api_secret: "0A39quvrs5ERPRDqgouy",
  upload_preset: "HR1_UPLOADS" // Add your upload preset here
});

module.exports = cloudinary;
