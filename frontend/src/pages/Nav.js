import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/Nav.css";
import UserDetails from "./UserDetails";
import logo from "../assets/logo192.png";
import { ShieldCheck, LogOut, Sparkles, BookOpen, Clock } from "lucide-react";

const Nav = () => {
  const location = useLocation();
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState({
    email: localStorage.getItem("email") || "",
    name: localStorage.getItem("name") || "",
    pno: localStorage.getItem("pno") || "",
    dob: localStorage.getItem("dob") || "",
    role: localStorage.getItem("type") || "student",
  });

  const refreshUser = () => {
    setToken(localStorage.getItem("token") || "");
    setUser({
      email: localStorage.getItem("email") || "",
      name: localStorage.getItem("name") || "",
      pno: localStorage.getItem("pno") || "",
      dob: localStorage.getItem("dob") || "",
      role: localStorage.getItem("type") || "student",
    });
  };

  useEffect(() => {
    refreshUser();
  }, [location.pathname]);

  const role = user.role?.toLowerCase();

  return (
    <header className="nav-container">
      <nav className="navbar" aria-label="Main Navigation">
        {/* Brand / Logo */}
        <div className="nav-left">
          <Link to="/" className="logo-link">
            <img src={logo} alt="AttendEase Logo" className="logo-img" />
            <div>
              <span className="logo-text" style={{ display: "block", lineHeight: "1.1" }}>AttendEase</span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "500" }}>Smart Attendance & AI Planning</span>
            </div>
          </Link>
        </div>

        {/* Dynamic Navigation Links based on authentication and role */}
        <div className="nav-center">
          {token && (
            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              {role === "student" && (
                <>
                  <Link
                    to="/student-dashboard"
                    className={`btn btn-sm ${location.pathname === "/student-dashboard" ? "btn-primary" : "btn-secondary"}`}
                  >
                    <Clock size={16} /> Attendance
                  </Link>
                  <Link
                    to="/ai-curriculum-assistant"
                    className={`btn btn-sm ${location.pathname === "/ai-curriculum-assistant" ? "btn-primary" : "btn-secondary"}`}
                  >
                    <Sparkles size={16} /> AI Curriculum Assistant
                  </Link>
                  <Link
                    to="/student-dashboard?tab=analytics"
                    className="btn btn-sm btn-secondary"
                  >
                    <BookOpen size={16} /> Analytics
                  </Link>
                </>
              )}

              {(role === "teacher" || role === "faculty") && (
                <>
                  <Link
                    to="/teacher-dashboard"
                    className={`btn btn-sm ${location.pathname === "/teacher-dashboard" ? "btn-primary" : "btn-secondary"}`}
                  >
                    <Clock size={16} /> Sessions
                  </Link>
                  <Link
                    to="/teacher-dashboard?tab=curriculum"
                    className="btn btn-sm btn-secondary"
                  >
                    <BookOpen size={16} /> Curriculum
                  </Link>
                  <Link
                    to="/teacher-dashboard?tab=analytics"
                    className="btn btn-sm btn-secondary"
                  >
                    <Sparkles size={16} /> Class Insights
                  </Link>
                </>
              )}

              {role === "admin" && (
                <>
                  <Link
                    to="/admin-dashboard"
                    className={`btn btn-sm ${location.pathname === "/admin-dashboard" ? "btn-primary" : "btn-secondary"}`}
                  >
                    <ShieldCheck size={16} /> Administration
                  </Link>
                  <Link
                    to="/teacher-dashboard"
                    className="btn btn-sm btn-secondary"
                  >
                    Faculty View
                  </Link>
                  <Link
                    to="/student-dashboard"
                    className="btn btn-sm btn-secondary"
                  >
                    Student View
                  </Link>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Section: Role Badge, Profile, Auth Buttons */}
        <div className="nav-right" style={{ gap: "12px", alignItems: "center" }}>
          {token ? (
            <>
              {/* Role Badge */}
              <span className={`badge ${role === "admin" ? "high" : role === "teacher" ? "proficient" : "active"}`}>
                {role === "admin" ? "Administrator" : role === "teacher" ? "Faculty" : "Student"}
              </span>

              {/* Profile Avatar Component */}
              <UserDetails user={user} onUpdate={refreshUser} />

              {/* Logout Button */}
              <Link to="/logout" className="btn btn-sm btn-danger" title="Sign out of AttendEase">
                <LogOut size={16} />
                <span>Logout</span>
              </Link>
            </>
          ) : (
            <div style={{ display: "flex", gap: "10px" }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Nav;
