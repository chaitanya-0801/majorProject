import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
// import logo from "../assets/attendo-logo.png";
import { MapPin, Sparkles, Clock, Camera, ArrowRight } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("type");
    if (token) {
      if (role === "teacher") {
        navigate("/teacher-dashboard");
      } else if (role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/student-dashboard");
      }
    }
  }, [navigate]);

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 20px" }}>
      {/* Hero Section */}
      <div style={{ textAlign: "center", marginBottom: "60px" }}>
        {/* <img
          src={logo}
          alt="AttendEase Logo"
          style={{ width: "90px", height: "auto", marginBottom: "16px" }}
        /> */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "var(--primary-50)", color: "var(--primary-700)", padding: "6px 14px", borderRadius: "9999px", fontSize: "13px", fontWeight: "600", marginBottom: "16px" }}>
          <Sparkles size={16} /> Next-Generation Institutional Attendance & Learning Platform
        </div>
        <h1 style={{ fontSize: "40px", fontWeight: "800", color: "var(--text-main)", lineHeight: "1.2", margin: "0 0 16px 0" }}>
          Smart Geolocation Attendance & AI-Based Curriculum Planning
        </h1>
        <p style={{ fontSize: "18px", color: "var(--text-muted)", maxWidth: "700px", margin: "0 auto 30px auto", lineHeight: "1.6" }}>
          Ensure authentic classroom presence using GPS geofencing and live webcam verification, while empowering students with adaptive, syllabus-aligned personalized study plans.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "14px", flexWrap: "wrap" }}>
          <Link to="/login" className="btn btn-primary" style={{ padding: "12px 28px", fontSize: "15px" }}>
            Sign In to Portal <ArrowRight size={18} />
          </Link>
          <Link to="/register" className="btn btn-secondary" style={{ padding: "12px 28px", fontSize: "15px" }}>
            Create Student or Faculty Account
          </Link>
        </div>
      </div>

      {/* 4 Feature Pillars */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px", marginBottom: "60px" }}>
        <div className="modern-card" style={{ textAlign: "center", padding: "28px 20px" }}>
          <div className="stat-icon emerald" style={{ width: "52px", height: "52px", margin: "0 auto 16px auto" }}>
            <MapPin size={26} />
          </div>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "17px" }}>GPS Distance Geofencing</h3>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)", lineHeight: "1.5" }}>
            Attendance is strictly validated using real-time Haversine distance from the lecture location, eliminating proxy attendance.
          </p>
        </div>

        <div className="modern-card" style={{ textAlign: "center", padding: "28px 20px" }}>
          <div className="stat-icon blue" style={{ width: "52px", height: "52px", margin: "0 auto 16px auto" }}>
            <Camera size={26} />
          </div>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "17px" }}>Webcam Photo Proof</h3>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)", lineHeight: "1.5" }}>
            Students capture a live timestamped photograph during submission for complete verification transparency.
          </p>
        </div>

        <div className="modern-card" style={{ textAlign: "center", padding: "28px 20px" }}>
          <div className="stat-icon purple" style={{ width: "52px", height: "52px", margin: "0 auto 16px auto" }}>
            <Clock size={26} />
          </div>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "17px" }}>Expiring Dynamic QR</h3>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)", lineHeight: "1.5" }}>
            QR codes contain cryptographic signed tokens that refresh periodically, preventing unauthorized link sharing.
          </p>
        </div>

        <div className="modern-card" style={{ textAlign: "center", padding: "28px 20px" }}>
          <div className="stat-icon amber" style={{ width: "52px", height: "52px", margin: "0 auto 16px auto" }}>
            <Sparkles size={26} />
          </div>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "17px" }}>AI Curriculum Planning</h3>
          <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)", lineHeight: "1.5" }}>
            Detects weak topics from assessment scores and produces personalized, weekly study roadmaps grounded in your institutional syllabus.
          </p>
        </div>
      </div>

      {/* Institutional Highlights */}
      <div style={{ background: "white", border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)", padding: "36px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "30px" }}>
        <div>
          <span className="badge active" style={{ marginBottom: "10px" }}>For Faculty</span>
          <h3 style={{ margin: "0 0 10px 0", fontSize: "20px" }}>Comprehensive Session & Curriculum Control</h3>
          <ul style={{ margin: 0, paddingLeft: "20px", color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.8" }}>
            <li>Create sessions with customizable radius (50m - 150m) and duration</li>
            <li>Monitor live attendance submissions and photo proofs</li>
            <li>Correct attendance records with full audit trail compliance</li>
            <li>Identify class-wide conceptual gaps with AI guidance</li>
            <li>Export formatted attendance reports to CSV with one click</li>
          </ul>
        </div>

        <div>
          <span className="badge proficient" style={{ marginBottom: "10px" }}>For Students</span>
          <h3 style={{ margin: "0 0 10px 0", fontSize: "20px" }}>Personalized Learning & Attendance Hub</h3>
          <ul style={{ margin: 0, paddingLeft: "20px", color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.8" }}>
            <li>1-Click attendance scanning with device GPS verification</li>
            <li>Track attendance percentage with automatic 75% shortage alerts</li>
            <li>Personalized weekly study roadmaps with prioritized topics</li>
            <li>Clear explanations of why topics were recommended</li>
            <li>Interactive diagnostic quizzes and practice problem checklists</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Landing;
