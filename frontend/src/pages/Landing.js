import React, { useEffect, useState } from "react";
import "../styles/Landing.css";
import { Link } from "react-router-dom";
import About from "./About";
import logo from "../assets/attendo-logo.png";

const Landing = () => {
  const [showTutorial, setShowTutorial] = useState(() => {
    return localStorage.getItem("tutorial") !== "false";
  });

  useEffect(() => {
    if (localStorage.getItem("token")) {
      window.location.href = "/login";
    }
  }, []);

  const handleTutorialDone = () => {
    setShowTutorial(false);
    localStorage.setItem("tutorial", "false");
  };

  return (
    <div className="landing-main">
      {showTutorial ? (
        <About toggleDone={handleTutorialDone} />
      ) : (
        <>
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
        </>
      )}
    </div>
  );
};

export default Landing;
