const cors = require("cors");

const corsMiddleware = () => cors(); // Enable CORS for all origins

module.exports = corsMiddleware;
