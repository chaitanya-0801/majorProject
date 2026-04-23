import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SHA256 } from "crypto-js";
import axios from "axios";
import "../styles/Login.css";
import image from "../assets/image.png";
import image192 from "../assets/logo192.png";
import see from "../assets/see.png";
import hide from "../assets/hide.png";

const queryParameters = new URLSearchParams(window.location.search);
axios.defaults.withCredentials = true;
const BASE_URL = "http://localhost:5050";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const navigate = useNavigate();

  const computeHash = (input) => SHA256(input).toString();

 const handleLoginSubmit = async (e) => {
  e.preventDefault();

  const email = e.target.email.value.trim();
  const password = e.target.password.value.trim();

  if (!email || !password) {
    alert("Please fill all the fields");
    return;
  }

  try {
    const { data } = await axios.post(`${BASE_URL}/users/signin`, {
      email,
      password,
    });
console.log(data)
    const { user, type, token: authToken } = data;

    localStorage.setItem("email", user.email);
    localStorage.setItem("name", user.name);
    localStorage.setItem("type", type);
    localStorage.setItem("token", authToken);

    setToken(authToken);

    if (type === "student") {
      navigate("/student-dashboard");
    } else {
      navigate("/teacher-dashboard");
    }

  } catch (err) {
    alert(err.response?.data?.message || "Login failed");
  }
};

  useEffect(() => {
    const session_id = queryParameters.get("session_id") || "";
    const teacher = queryParameters.get("email") || "";

    if (token) {
      const type = localStorage.getItem("type");
      const path =
        type === "teacher"
          ? "/teacher-dashboard"
          : session_id && teacher
          ? `/student-dashboard?session_id=${session_id}&email=${teacher}`
          : "/student-dashboard";
      navigate(path);
    }
  }, [token, navigate]);

  return (
    <div className="login-main">
      <div className="login-left">
        <img alt="Logo" src={image} />
      </div>
      <div className="login-right">
        <div className="login-right-container">
          <div className="login-logo">
            <img alt="Mini Logo" src={image192} />
          </div>
          <div className="login-center">
            <h2>Welcome back!</h2>
            <p>Please enter your details</p>
            <form onSubmit={handleLoginSubmit}>
              <input type="email" placeholder="Email" name="email" required />
              <div className="pass-input-div">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  name="password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ padding: 0 }}
                >
                  <img src={showPassword ? hide : see} alt="toggle visibility" />
                </button>
              </div>

              <div className="login-center-options">
                <Link
                  to="/forgot-password"
                  className="forgot-pass-link"
                  style={{ color: "#76ABAE" }}
                >
                  Forgot password?
                </Link>
              </div>

              <div className="login-center-buttons">
                <button type="submit">Log In</button>
              </div>
            </form>
          </div>

          <p className="login-bottom-p">
            Don't have an account?{" "}
            <Link to="/register" style={{ color: "#76ABAE" }}>
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
