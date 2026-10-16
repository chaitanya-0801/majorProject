import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "../styles/Login.css";
import image192 from "../assets/logo192.png";
import { Lock, Mail, Eye, EyeOff, ArrowRight } from "lucide-react";

axios.defaults.withCredentials = true;

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5050";

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    const type = localStorage.getItem("type");
    const query = new URLSearchParams(location.search);
    const session_id = query.get("session_id") || "";
    const teacher = query.get("email") || "";
    const qr_token = query.get("qr_token") || "";

    if (token) {
      if (type === "teacher") {
        navigate("/teacher-dashboard");
      } else if (type === "admin") {
        navigate("/admin-dashboard");
      } else {
        const dest = session_id
          ? `/student-dashboard?session_id=${session_id}&email=${teacher}&qr_token=${qr_token}`
          : "/student-dashboard";
        navigate(dest);
      }
    }
  }, [navigate, location.search]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const email = e.target.email.value.trim();
    const password = e.target.password.value.trim();

    if (!email || !password) {
      setErrorMessage("Please enter both email address and password");
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(`${BASE_URL}/users/signin`, {
        email,
        password,
      });

      const { user, type, token: authToken } = data;

      localStorage.setItem("email", user.email);
      localStorage.setItem("name", user.name);
      localStorage.setItem("type", type);
      localStorage.setItem("token", authToken);
      if (user.identityNumber) {
        localStorage.setItem("identityNumber", user.identityNumber.toString());
      }

      const query = new URLSearchParams(location.search);
      const session_id = query.get("session_id") || "";
      const teacher = query.get("email") || "";
      const qr_token = query.get("qr_token") || "";

      if (type === "teacher") {
        navigate("/teacher-dashboard");
      } else if (type === "admin") {
        navigate("/admin-dashboard");
      } else {
        const dest = session_id
          ? `/student-dashboard?session_id=${session_id}&email=${teacher}&qr_token=${qr_token}`
          : "/student-dashboard";
        navigate(dest);
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || "Invalid institutional credentials. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "440px", margin: "40px auto", padding: "20px" }}>
      <div className="modern-card" style={{ padding: "36px 30px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <img src={image192} alt="AttendEase" style={{ width: "56px", height: "56px", marginBottom: "12px" }} />
          <h2 style={{ margin: "0 0 6px 0", fontSize: "22px", color: "var(--text-main)" }}>
            Welcome Back
          </h2>
          <p style={{ margin: 0, fontSize: "14px", color: "var(--text-muted)" }}>
            Sign in to your AttendEase institutional portal
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="alert-box alert-danger" style={{ marginBottom: "18px" }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLoginSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: "relative" }}>
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="name@institution.edu"
                required
                style={{ paddingLeft: "36px" }}
              />
              <Mail size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <label className="form-label" style={{ margin: 0 }}>Password</label>
              <Link to="/forgot-password" style={{ fontSize: "12px", color: "var(--primary-600)", textDecoration: "none" }}>
                Forgot Password?
              </Link>
            </div>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                className="form-input"
                placeholder="Enter password"
                required
                style={{ paddingLeft: "36px", paddingRight: "36px" }}
              />
              <Lock size={16} style={{ position: "absolute", left: "12px", top: "12px", color: "var(--text-muted)" }} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: "10px", top: "10px", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", padding: "11px", marginTop: "10px" }}
            disabled={loading}
          >
            {loading ? "Authenticating..." : "Sign In"} <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "24px", fontSize: "13px", color: "var(--text-muted)" }}>
          Don't have an account yet?{" "}
          <Link to="/register" style={{ color: "var(--primary-600)", fontWeight: "600", textDecoration: "none" }}>
            Register Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
