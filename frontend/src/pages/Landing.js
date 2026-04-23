import React, { useEffect } from "react";
import "../styles/Landing.css";
import { Link } from "react-router-dom";
import logo from "../assets/attendo-logo.png";

const Landing = () => {


  useEffect(() => {
    if (localStorage.getItem("token")) {
      window.location.href = "/login";
    }
  }, []);



  return (
    <div className="landing-main">
    
          <img
            src={logo}
            alt="Attendo Logo"
            className="landing-logo"
          />
          <p>welcome!</p>
          <Link to="/login" className="landing-login-button">
            Login
          </Link>
          <Link to="/register" className="landing-register-button">
            Register
          </Link>    
    </div>
  );
};

export default Landing;
