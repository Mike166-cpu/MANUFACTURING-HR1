import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import { loginUser } from "../store/authStore";
import { useAuthStore } from "../store/authHumanResources";

const HumanResourcesLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState(""); // Added department state
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();

  const handleLogin = async (e) => {
    e.preventDefault();
    const success = await loginUser(email, password, navigate, location);
    if (!success) {
      setError("Login failed");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleHR3Login = async (e) => {
    e.preventDefault();
    const success = await login(email, password, true);
    if (!success) {
      setError("Login failed");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (department === "hr1") {
      await handleLogin(e);
    } else if (department === "hr3") {
      await handleHR3Login(e);
    } else {
      setError("Invalid department");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="hero bg-base-200 min-h-screen">
      <div className="hero-content flex-col lg:flex-row-reverse">
        <div className="text-center lg:text-left">
          <h1 className="text-5xl font-bold">Login now!</h1>
        </div>
        <div className="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
          <form className="card-body" onSubmit={handleSubmit}>
            {error && <p className="text-red-500">{error}</p>}
            <div className={`form-control ${shake ? "animate-shake" : ""}`}>
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                className="input input-bordered"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className={`form-control ${shake ? "animate-shake" : ""}`}>
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                className="input input-bordered"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <label className="label">
                <a href="#" className="label-text-alt link link-hover">
                  Forgot password?
                </a>
              </label>
            </div>

            {/* Dropdown for department selection */}
            <div className={`form-control ${shake ? "animate-shake" : ""}`}>
              <label className="label">
                <span className="label-text">Select Department</span>
              </label>
              <select
                className="select select-bordered"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              >
                <option value="">Select Department</option>
                <option value="hr1">HR1</option>
                <option value="hr3">HR3</option>
              </select>
            </div>

            <div className="form-control mt-6">
              <button type="submit" className="btn btn-primary">
                Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default HumanResourcesLogin;
