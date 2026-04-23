import React, { useEffect, useState } from "react";
import "../styles/Nav.css";
import UserDetails from "./UserDetails";
import logo from "../assets/logo192.png";
import logout from "../assets/logout.png";

const Nav = () => {
  const [user, setUser] = useState({
    email: localStorage.getItem("email"),
    name: localStorage.getItem("name"),
    pno: localStorage.getItem("pno"),
    dob: localStorage.getItem("dob"),
  });

  const [token, setToken] = useState(
    localStorage.getItem("token")
  );

  const refresh = () => {
    setUser({
      email: localStorage.getItem("email"),
      name: localStorage.getItem("name"),
      pno: localStorage.getItem("pno"),
      dob: localStorage.getItem("dob"),
    });

    setToken(localStorage.getItem("token"));
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="nav-container">
      <nav className="navbar">

        {/* Left Logo */}
        <div className="nav-left">
          <a href="/" className="logo-link">
            <img
              src={logo}
              alt="Logo"
              className="logo-img"
            />
            <span className="logo-text">
              AttendEase
            </span>
          </a>
        </div>

        {/* Show user details only if logged in */}
        {token && (
          <div className="nav-center">
            <UserDetails user={user} />
          </div>
        )}

        {/* Right section */}
        <div className="nav-right">
          {token ? (
            <a
              href="/logout"
              className="logout-btn"
            >
              <img
                src={logout}
                alt="Logout"
              />
              <span>Logout</span>
            </a>
          ) : (
            <a
              href="/register"
              className="signup-btn"
            >
              Signup
            </a>
          )}
        </div>

      </nav>
    </div>
  );
};

export default Nav;