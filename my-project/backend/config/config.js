const apiUrl =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://backend-hr1.jjm-manufacturing.com";

export default apiUrl;
