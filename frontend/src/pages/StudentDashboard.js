import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import StudentForm from "./StudentForm";
import {
  Clock,
  Sparkles,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Camera,
  PlayCircle,
  Award,
  Eye,
  CheckSquare,
  Square,
  Radio,
  GraduationCap,
} from "lucide-react";

axios.defaults.withCredentials = true;

const StudentDashboard = () => {
  const [token] = useState(localStorage.getItem("token") || "");
  const [userProfile, setUserProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  });
  const [activeTab, setActiveTab] = useState("live");
  const [liveSessions, setLiveSessions] = useState([]);
  const [sessionList, setSessionList] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [studyPlan, setStudyPlan] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [activeAssessment, setActiveAssessment] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Selected session to attend
  const [targetSession, setTargetSession] = useState({ id: "", email: "", qrToken: "" });

  const navigate = useNavigate();
  const location = useLocation();
  const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5050";

  // Check URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab && ["live", "attendance", "plan", "analytics", "assessments"].includes(tab)) {
      setActiveTab(tab);
    }

    const sessionId = params.get("session_id");
    const email = params.get("email");
    const qrToken = params.get("qr_token");

    if (sessionId) {
      setTargetSession({
        id: sessionId,
        email: email || "",
        qrToken: qrToken || "",
      });
      setIsFormOpen(true);
    }
  }, [location.search]);

  // Fetch Student Profile (to obtain verified class_code and identityNumber)
  const fetchProfile = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${BASE_URL}/users/profile`, { headers });
      if (res.data?.user) {
        setUserProfile(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        if (res.data.user.class_code) localStorage.setItem("class_code", res.data.user.class_code);
        if (res.data.user.identityNumber) localStorage.setItem("identityNumber", res.data.user.identityNumber);
      }
    } catch (err) {
      console.warn("[Student] Could not refresh profile:", err);
    }
  }, [token, BASE_URL]);

  // Fetch Live Sessions for Enrolled Class
  const fetchLiveSessions = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${BASE_URL}/sessions/active`, { headers });
      setLiveSessions(res.data.sessions || []);
    } catch (err) {
      console.error("[Student] Error fetching live sessions:", err);
    }
  }, [token, BASE_URL]);

  // Fetch Attendance History
  const fetchAttendanceHistory = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(
        `${BASE_URL}/sessions/getStudentSessions`,
        { token },
        { headers }
      );
      setSessionList(res.data.sessions || []);
    } catch (err) {
      console.error("[Student] Error fetching student sessions:", err);
    }
  }, [token, BASE_URL]);

  // Fetch Student Analytics
  const fetchAnalytics = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${BASE_URL}/curriculum/student-analytics`, {
        headers,
        params: { token },
      });
      setAnalyticsData(res.data);
    } catch (err) {
      console.error("[Student] Error fetching analytics:", err);
    }
  }, [token, BASE_URL]);

  // Fetch AI Study Plan
  const fetchStudyPlan = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${BASE_URL}/curriculum/plan/active`, {
        headers,
        params: { token },
      });
      setStudyPlan(res.data.plan || null);
    } catch (err) {
      console.error("[Student] Error fetching study plan:", err);
    }
  }, [token, BASE_URL]);

  // Fetch Assessments
  const fetchAssessments = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${BASE_URL}/curriculum/assessments`, {
        headers,
        params: { token },
      });
      setAssessments(res.data.assessments || []);
    } catch (err) {
      console.error("[Student] Error fetching assessments:", err);
    }
  }, [token, BASE_URL]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    setLoading(true);
    Promise.all([
      fetchProfile(),
      fetchLiveSessions(),
      fetchAttendanceHistory(),
      fetchAnalytics(),
      fetchStudyPlan(),
      fetchAssessments(),
    ]).finally(() => setLoading(false));

    // Auto-poll live sessions every 20 seconds so students immediately see new sessions
    const interval = setInterval(fetchLiveSessions, 20000);
    return () => clearInterval(interval);
  }, [
    token,
    navigate,
    fetchProfile,
    fetchLiveSessions,
    fetchAttendanceHistory,
    fetchAnalytics,
    fetchStudyPlan,
    fetchAssessments,
  ]);

  // Toggle Activity Status
  const handleToggleActivity = async (activityId) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(
        `${BASE_URL}/curriculum/plan/toggle-activity`,
        { activity_id: activityId, token },
        { headers }
      );
      setStudyPlan(res.data.plan);
    } catch (err) {
      alert("Failed to update activity status");
    }
  };

  // Regenerate AI Plan
  const handleRegeneratePlan = async () => {
    setGeneratingPlan(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(
        `${BASE_URL}/curriculum/plan/generate`,
        { token },
        { headers }
      );
      setStudyPlan(res.data.plan);
      alert("Personalized study plan regenerated based on your latest performance data!");
    } catch (err) {
      alert("Failed to regenerate study plan");
    } finally {
      setGeneratingPlan(false);
    }
  };

  // Submit Diagnostic Assessment
  const handleSubmitAssessment = async (e) => {
    e.preventDefault();
    if (!activeAssessment) return;

    const formattedAnswers = Object.keys(quizAnswers).map((qId) => ({
      question_id: qId,
      selected_index: quizAnswers[qId],
    }));

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(
        `${BASE_URL}/curriculum/assessments/submit`,
        {
          assessment_id: activeAssessment.assessment_id,
          answers: formattedAnswers,
          token,
        },
        { headers }
      );
      setQuizResult(res.data);
      fetchAnalytics();
      fetchStudyPlan();
    } catch (err) {
      alert("Failed to submit assessment");
    }
  };

  // Attendance metrics from analytics or calculation
  const attendanceOverall = analyticsData?.attendance?.overallPercentage ?? 0;
  const isShortage = analyticsData?.attendance?.attendanceWarning ?? (attendanceOverall < 75);
  const totalAttended = analyticsData?.attendance?.totalSessionsAttended ?? sessionList.length;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Student Academic Portal</h1>
          <p className="page-subtitle">Smart Geolocation Attendance & Personalized AI Curriculum Planning</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setLoading(true);
              Promise.all([
                fetchProfile(),
                fetchLiveSessions(),
                fetchAttendanceHistory(),
                fetchAnalytics(),
                fetchStudyPlan(),
              ]).finally(() => setLoading(false));
            }}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setTargetSession({ id: "", email: "", qrToken: "" });
              setIsFormOpen(true);
            }}
          >
            <Camera size={16} /> Mark Attendance Now
          </button>
        </div>
      </div>

      {/* Student Academic Identity Banner */}
      <div
        className="modern-card"
        style={{
          background: "#ffffff",
          border: "1px solid var(--border-color)",
          padding: "16px 20px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "10px",
              background: "#eff6ff",
              color: "#2563eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              fontSize: "18px",
              flexShrink: 0,
            }}
          >
            <GraduationCap size={24} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h2 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "var(--text-main)" }}>
                {userProfile.name || "Enrolled Student"}
              </h2>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 10px",
                  borderRadius: "6px",
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  border: "1px solid #bfdbfe",
                  fontSize: "12px",
                  fontWeight: "700",
                  letterSpacing: "0.5px",
                }}
              >
                CLASS: {userProfile.class_code || "4CSEA"}
              </span>
              <span
                style={{
                  padding: "3px 8px",
                  borderRadius: "6px",
                  background: "#f1f5f9",
                  color: "#475569",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              >
                Roll: {userProfile.identityNumber || userProfile.regno || "N/A"}
              </span>
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--text-muted)" }}>
              {userProfile.class_name || "Department of Computer Science & Engineering"} &bull; Standing:{" "}
              <strong style={{ color: attendanceOverall >= 75 ? "var(--accent-emerald)" : "var(--accent-rose)" }}>
                {attendanceOverall >= 75 ? "Compliant (≥ 75%)" : "Debarment Warning (< 75%)"}
              </strong>
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Active Class Sessions</div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: liveSessions.length > 0 ? "var(--accent-emerald)" : "var(--text-muted)",
              }}
            >
              {liveSessions.length} {liveSessions.length === 1 ? "Session" : "Sessions"}
            </div>
          </div>
          {liveSessions.length > 0 && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setActiveTab("live")}
              style={{ padding: "6px 12px" }}
            >
              <Radio size={14} className="animate-pulse" /> View Live
            </button>
          )}
        </div>
      </div>

      {/* Attendance Shortage Warning Banner */}
      {isShortage && (
        <div className="alert-box alert-warning">
          <AlertTriangle size={24} style={{ flexShrink: 0 }} />
          <div>
            <strong>Institutional Attendance Alert</strong>
            <p style={{ margin: "2px 0 0 0" }}>
              Your current attendance rate is <strong>{attendanceOverall}%</strong>, which is below the mandatory 75% institutional requirement. Attend all upcoming sessions to avoid debarment from semester examinations.
            </p>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="stats-grid">
        <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => setActiveTab("live")}>
          <div className={`stat-icon ${liveSessions.length > 0 ? "emerald" : "blue"}`}><Radio /></div>
          <div className="stat-info">
            <h3>{liveSessions.length}</h3>
            <p>Live Class Sessions</p>
          </div>
        </div>
        <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => setActiveTab("attendance")}>
          <div className={`stat-icon ${attendanceOverall >= 75 ? "emerald" : "rose"}`}><Clock /></div>
          <div className="stat-info">
            <h3>{attendanceOverall}%</h3>
            <p>Overall Attendance Rate</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><CheckCircle /></div>
          <div className="stat-info">
            <h3>{totalAttended}</h3>
            <p>Sessions Attended</p>
          </div>
        </div>
        <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => setActiveTab("analytics")}>
          <div className="stat-icon purple"><Award /></div>
          <div className="stat-info">
            <h3>{analyticsData?.academic?.overallAverage || 0}%</h3>
            <p>Academic Average Score</p>
          </div>
        </div>
        <div className="stat-card" style={{ cursor: "pointer" }} onClick={() => setActiveTab("plan")}>
          <div className="stat-icon amber"><Sparkles /></div>
          <div className="stat-info">
            <h3>{studyPlan?.topics?.length || 0}</h3>
            <p>Active Study Plan Topics</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === "live" ? "active" : ""}`}
          onClick={() => setActiveTab("live")}
        >
          <Radio size={16} /> Live Classes {liveSessions.length > 0 && `(${liveSessions.length})`}
        </button>
        <button
          className={`tab-btn ${activeTab === "attendance" ? "active" : ""}`}
          onClick={() => setActiveTab("attendance")}
        >
          <Clock size={16} /> Attendance & 75% Rule
        </button>
        <button
          className={`tab-btn ${activeTab === "plan" ? "active" : ""}`}
          onClick={() => setActiveTab("plan")}
        >
          <Sparkles size={16} /> AI Personalized Study Plan
        </button>
        <button
          className={`tab-btn ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          <BookOpen size={16} /> Learning Gaps & Analytics
        </button>
        <button
          className={`tab-btn ${activeTab === "assessments" ? "active" : ""}`}
          onClick={() => setActiveTab("assessments")}
        >
          <PlayCircle size={16} /> Diagnostic Quizzes
        </button>
      </div>

      {/* TAB 0: Live Classes for Enrolled Class */}
      {activeTab === "live" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="modern-card">
            <div className="card-header">
              <div>
                <h2 className="card-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Radio size={20} style={{ color: liveSessions.length > 0 ? "var(--accent-emerald)" : "var(--text-muted)" }} />
                  Live Attendance Sessions for Class {userProfile.class_code || "4CSEA"}
                </h2>
                <p style={{ margin: "3px 0 0 0", fontSize: "13px", color: "var(--text-muted)" }}>
                  Only authorized sessions for your registered academic section appear here. Submissions are verified via GPS radius and webcam proof.
                </p>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={fetchLiveSessions}
                disabled={loading}
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
              </button>
            </div>

            {liveSessions.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px", marginTop: "12px" }}>
                {liveSessions.map((session) => (
                  <div
                    key={session.session_id}
                    style={{
                      border: "1px solid var(--border-color)",
                      borderRadius: "8px",
                      padding: "16px",
                      background: "#ffffff",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "14px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "700",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            background: "#f1f5f9",
                            color: "#334155",
                            textTransform: "uppercase",
                          }}
                        >
                          {session.course_code || "COURSE"}
                        </span>
                        <span
                          className={`badge ${session.already_attended ? "active" : "pending"}`}
                          style={{
                            background: session.already_attended ? "#ecfdf5" : "#fffbeb",
                            color: session.already_attended ? "#065f46" : "#92400e",
                            border: `1px solid ${session.already_attended ? "#a7f3d0" : "#fde68a"}`,
                            fontWeight: "700",
                          }}
                        >
                          {session.already_attended ? "Marked ✓" : "Active - Pending"}
                        </span>
                      </div>

                      <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", color: "var(--text-main)" }}>
                        {session.subject_name || session.name}
                      </h3>
                      <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "4px" }}>
                        Topic: {session.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        Instructor: <strong>{session.teacher_name || session.teacher_email}</strong>
                      </div>
                    </div>

                    <div
                      style={{
                        background: "#f8fafc",
                        padding: "10px",
                        borderRadius: "6px",
                        border: "1px solid var(--border-color)",
                        fontSize: "12px",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "6px",
                      }}
                    >
                      <div>Started: <strong>{session.time || "Now"}</strong></div>
                      <div>Duration: <strong>{session.duration}</strong></div>
                      <div>Radius: <strong>{session.radius}m</strong></div>
                      <div>Class: <strong>{session.class_code || userProfile.class_code}</strong></div>
                    </div>

                    <div>
                      {session.already_attended ? (
                        <button
                          className="btn btn-secondary btn-sm"
                          disabled
                          style={{ width: "100%", opacity: 0.85, cursor: "default", justifyContent: "center" }}
                        >
                          <CheckCircle size={15} style={{ color: "var(--accent-emerald)" }} /> Attendance Confirmed
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            setTargetSession({
                              id: session.session_id,
                              email: session.teacher_email || "",
                              qrToken: "",
                            });
                            setIsFormOpen(true);
                          }}
                          style={{ width: "100%", justifyContent: "center" }}
                        >
                          <Camera size={15} /> Mark Attendance Now
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: "40px 20px" }}>
                <Clock className="empty-state-icon" style={{ opacity: 0.4 }} />
                <div className="empty-state-title">No Active Sessions Right Now</div>
                <div className="empty-state-desc" style={{ maxWidth: "500px", margin: "6px auto 0 auto" }}>
                  There are currently no active attendance sessions for class <strong>{userProfile.class_code || "4CSEA"}</strong>. When your instructor starts an attendance check, it will appear here in real time.
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={fetchLiveSessions}
                  style={{ marginTop: "16px" }}
                >
                  <RefreshCw size={14} /> Check for Live Sessions
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 1: Attendance Hub */}
      {activeTab === "attendance" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* AI Curriculum Assistant Callout Banner */}
          <div
            className="modern-card"
            style={{
              background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
              color: "#ffffff",
              border: "1px solid #334155",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
              <div style={{ maxWidth: "600px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <Sparkles size={20} style={{ color: "#38bdf8" }} />
                  <h3 style={{ margin: 0, fontSize: "18px", color: "#f8fafc" }}>
                    AI Curriculum & 75% Attendance Assistant
                  </h3>
                  <span className="badge active" style={{ background: "#0284c7", color: "#ffffff" }}>
                    Interactive
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "14px", color: "#94a3b8", lineHeight: 1.5 }}>
                  Have questions about reaching your 75% attendance threshold, missing an upcoming lecture, or planning a balanced study routine? Converse in real time with your AI academic advisor.
                </p>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => navigate("/ai-curriculum-assistant")}
                style={{
                  background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                  padding: "10px 18px",
                  fontSize: "14px",
                  fontWeight: "600",
                }}
              >
                <Sparkles size={16} /> Launch AI Assistant
              </button>
            </div>
          </div>

          {/* Subject-wise Attendance Breakdown & 75% Planning */}
          {analyticsData?.attendance?.subjectWise?.length > 0 && (
            <div className="modern-card">
              <div className="card-header">
                <div>
                  <h2 className="card-title"><BookOpen size={20} /> Course-Wise Attendance Standing (75% Rule Engine)</h2>
                  <p style={{ margin: "2px 0 0 0", fontSize: "13px", color: "var(--text-muted)" }}>
                    Institutional threshold: 75% minimum attendance required for final examination eligibility
                  </p>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
                {analyticsData.attendance.subjectWise.map((sub, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "16px",
                      border: "1px solid var(--border-color)",
                      borderRadius: "8px",
                      background: "#ffffff",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <strong style={{ fontSize: "15px" }}>{sub.subject}</strong>
                      <span
                        className="badge"
                        style={{
                          background: sub.percentage >= 75 ? "#ecfdf5" : sub.percentage >= 65 ? "#fffbeb" : "#fef2f2",
                          color: sub.percentage >= 75 ? "#065f46" : sub.percentage >= 65 ? "#92400e" : "#991b1b",
                          border: `1px solid ${sub.percentage >= 75 ? "#a7f3d0" : sub.percentage >= 65 ? "#fde68a" : "#fecaca"}`,
                          fontWeight: "700",
                        }}
                      >
                        {sub.status || (sub.percentage >= 75 ? "On Track" : "At Risk")} ({sub.percentage}%)
                      </span>
                    </div>

                    <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "8px" }}>
                      Attended: <strong>{sub.attended}</strong> / Total Held: <strong>{sub.total}</strong> sessions
                    </div>

                    <div className="progress-bar-bg" style={{ marginBottom: "12px" }}>
                      <div
                        className={`progress-bar-fill ${sub.percentage >= 75 ? "green" : sub.percentage >= 65 ? "amber" : "red"}`}
                        style={{ width: `${Math.min(sub.percentage, 100)}%` }}
                      />
                    </div>

                    {/* 75% Planning Math Callouts */}
                    <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "6px", fontSize: "12px", border: "1px solid var(--border-color)" }}>
                      {sub.percentage < 75 ? (
                        <div style={{ color: "#b91c1c" }}>
                          🎯 <strong>Recovery Target:</strong> Must attend next <strong>{sub.consecutiveNeededToReach75}</strong> consecutive session(s) without absence to reach 75%.
                        </div>
                      ) : (
                        <div style={{ color: "#15803d" }}>
                          🛡️ <strong>Safe Buffer:</strong> Can safely miss up to <strong>{sub.safeClassesCanMiss}</strong> session(s) while maintaining ≥ 75%.
                        </div>
                      )}
                      <div style={{ color: "var(--text-muted)", marginTop: "4px" }}>
                        ⚠️ If next session missed: projected attendance drops to <strong>{sub.projectedIfMissNext}%</strong>.
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attendance History Table */}
          <div className="modern-card">
            <div className="card-header">
              <h2 className="card-title"><Clock size={20} /> Attendance Verification History</h2>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setTargetSession({ id: "", email: "", qrToken: "" });
                  setIsFormOpen(true);
                }}
              >
                <Camera size={14} /> Mark Attendance
              </button>
            </div>

            <div className="modern-table-container">
              {sessionList.length > 0 ? (
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Session Name</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>GPS Distance Verified</th>
                      <th>Verification Status</th>
                      <th>Photo Proof</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionList.map((session, index) => {
                      const dist = parseFloat(session.distance) || 0;
                      const rad = parseFloat(session.radius) || 50;
                      const isWithin = dist <= rad + 5;

                      return (
                        <tr key={index}>
                          <td><strong>{session.name || "Lecture Session"}</strong></td>
                          <td>{session.date ? (typeof session.date === "string" ? session.date.split("T")[0] : new Date(session.date).toLocaleDateString()) : "N/A"}</td>
                          <td>{session.time || "N/A"}</td>
                          <td>
                            <span style={{ color: isWithin ? "var(--accent-emerald)" : "var(--accent-rose)", fontWeight: "600" }}>
                              {dist}m
                            </span>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "4px" }}>
                              (Limit: {rad}m)
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${session.status || "present"}`}>
                              {session.status || "Present"}
                            </span>
                          </td>
                          <td>
                            {session.image ? (
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => setSelectedPhoto(session.image)}
                                style={{ padding: "4px 8px" }}
                              >
                                <Eye size={13} /> View Photo
                              </button>
                            ) : (
                              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>N/A</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <Clock className="empty-state-icon" />
                  <div className="empty-state-title">No Attendance Recorded</div>
                  <div className="empty-state-desc">Join an active lecture session to submit your verified attendance.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AI Personalized Study Plan */}
      {activeTab === "plan" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Plan Header */}
          <div className="modern-card" style={{ borderLeft: "4px solid var(--primary-600)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <h2 style={{ margin: 0, fontSize: "18px", color: "var(--text-main)" }}>
                    Personalized Weekly Academic Plan
                  </h2>
                  <span className="badge active">AI-Driven</span>
                </div>
                <p style={{ margin: 0, fontSize: "14px", color: "var(--text-muted)", maxWidth: "750px", lineHeight: "1.5" }}>
                  {studyPlan?.summary || "Personalized roadmap based on verified academic assessments and institutional syllabus objectives."}
                </p>
                <div style={{ fontSize: "11px", color: "var(--primary-700)", marginTop: "6px" }}>
                  Engine: {studyPlan?.ai_provider || "AttendEase Pedagogical Model"}
                </div>
              </div>

              <button
                className="btn btn-secondary btn-sm"
                onClick={handleRegeneratePlan}
                disabled={generatingPlan}
              >
                <Sparkles size={14} className={generatingPlan ? "animate-spin" : ""} />
                {generatingPlan ? "Analyzing Gaps..." : "Regenerate Plan"}
              </button>
            </div>
          </div>

          {/* Topic Cards */}
          {studyPlan?.topics?.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {studyPlan.topics.map((t, idx) => {
                const completedActivities = (t.activities || []).filter((a) => a.completed).length;
                const totalActivities = t.activities?.length || 0;
                const topicPct = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;

                return (
                  <div key={t.topic_id || idx} className="modern-card">
                    {/* Topic Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <h3 style={{ margin: 0, fontSize: "17px", color: "var(--text-main)" }}>
                            {t.topic_title}
                          </h3>
                          <span className={`badge ${t.priority || "high"}`}>{t.priority} Priority</span>
                          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                            Est. {t.estimated_hours} Hours
                          </span>
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "3px" }}>
                          Subject: {t.course_code}
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "13px", fontWeight: "600", color: topicPct === 100 ? "var(--accent-emerald)" : "var(--primary-600)" }}>
                          {topicPct}% Completed
                        </span>
                        <div className="progress-bar-bg" style={{ width: "120px" }}>
                          <div
                            className={`progress-bar-fill ${topicPct === 100 ? "green" : "blue"}`}
                            style={{ width: `${topicPct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Pedagogical Explanation */}
                    <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--border-color)", marginBottom: "16px", fontSize: "13px", lineHeight: "1.5" }}>
                      <strong>Why this is recommended:</strong>
                      <div style={{ color: "var(--text-muted)", marginTop: "2px" }}>{t.reason}</div>
                    </div>

                    {/* Learning Objectives */}
                    {t.learning_objectives?.length > 0 && (
                      <div style={{ marginBottom: "16px" }}>
                        <strong style={{ fontSize: "13px" }}>Learning Objectives:</strong>
                        <ul style={{ margin: "4px 0 0 0", paddingLeft: "20px", fontSize: "13px", color: "var(--text-muted)" }}>
                          {t.learning_objectives.map((obj, i) => (
                            <li key={i}>{obj}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Interactive Activities Checklist */}
                    <div>
                      <strong style={{ fontSize: "13px", display: "block", marginBottom: "8px" }}>
                        Recommended Learning Activities:
                      </strong>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {(t.activities || []).map((act) => (
                          <div
                            key={act.activity_id}
                            onClick={() => handleToggleActivity(act.activity_id)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "10px 14px",
                              background: act.completed ? "#f0fdf4" : "#ffffff",
                              border: "1px solid",
                              borderColor: act.completed ? "#bbf7d0" : "var(--border-color)",
                              borderRadius: "6px",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              {act.completed ? (
                                <CheckSquare size={18} style={{ color: "var(--accent-emerald)" }} />
                              ) : (
                                <Square size={18} style={{ color: "var(--text-light)" }} />
                              )}
                              <span style={{ fontSize: "13px", textDecoration: act.completed ? "line-through" : "none", color: act.completed ? "var(--text-muted)" : "var(--text-main)" }}>
                                {act.title}
                              </span>
                            </div>

                            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                              {act.duration_minutes} mins
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="modern-card">
              <div className="empty-state">
                <Sparkles className="empty-state-icon" />
                <div className="empty-state-title">No Study Plan Generated</div>
                <div className="empty-state-desc">Generate a personalized curriculum roadmap tailored to your specific assessment outcomes.</div>
                <button className="btn btn-primary btn-sm" onClick={handleRegeneratePlan} style={{ marginTop: "16px" }}>
                  Generate Study Plan
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Learning Gaps & Analytics */}
      {activeTab === "analytics" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Strengths & Weaknesses Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
            {/* Identified Learning Gaps */}
            <div className="modern-card">
              <div className="card-header">
                <h2 className="card-title" style={{ color: "var(--accent-rose)" }}>
                  <AlertTriangle size={18} /> Identified Learning Gaps
                </h2>
                <span className="badge high">{analyticsData?.academic?.weakTopics?.length || 0} Topics</span>
              </div>
              <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "var(--text-muted)" }}>
                Topics where assessment score is under 65%. Automatically prioritized in study plans.
              </p>

              {analyticsData?.academic?.weakTopics?.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {analyticsData.academic.weakTopics.map((g) => (
                    <div key={g.topic_id} style={{ padding: "12px", background: "#fff1f2", borderRadius: "8px", border: "1px solid #ffe4e6" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong>{g.topic_title}</strong>
                        <span className="badge high">{g.percentage}%</span>
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
                        Severity: <strong style={{ color: "var(--accent-rose)" }}>{g.severity}</strong> | Course: {g.course_code}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ padding: "20px" }}>
                  <CheckCircle size={32} style={{ color: "var(--accent-emerald)", marginBottom: "8px" }} />
                  <div className="empty-state-title">No Critical Learning Gaps!</div>
                  <div className="empty-state-desc">You are meeting or exceeding learning goals across evaluated units.</div>
                </div>
              )}
            </div>

            {/* Academic Strengths */}
            <div className="modern-card">
              <div className="card-header">
                <h2 className="card-title" style={{ color: "var(--accent-emerald)" }}>
                  <CheckCircle size={18} /> Conceptual Strengths (Mastered &ge; 75%)
                </h2>
                <span className="badge active">{analyticsData?.academic?.strengths?.length || 0} Topics</span>
              </div>
              <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "var(--text-muted)" }}>
                Topics where you have demonstrated consistent proficiency.
              </p>

              {analyticsData?.academic?.strengths?.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {analyticsData.academic.strengths.map((title, i) => (
                    <div key={i} style={{ padding: "12px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                      <strong>{title}</strong>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>Mastered Concept</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state" style={{ padding: "20px" }}>
                  <div className="empty-state-title">Take diagnostic assessments to identify strengths</div>
                </div>
              )}
            </div>
          </div>

          {/* Syllabus Completion Meter */}
          {analyticsData?.syllabus && (
            <div className="modern-card">
              <div className="card-header">
                <h2 className="card-title"><BookOpen size={20} /> Syllabus Coverage & Mastery Progress</h2>
                <span className="badge active">{analyticsData.syllabus.completionPercentage}% Completed</span>
              </div>
              <p style={{ margin: "0 0 12px 0", fontSize: "13px", color: "var(--text-muted)" }}>
                Tracking topic mastery against the official curriculum for {analyticsData.syllabus.courseName} ({analyticsData.syllabus.courseCode}).
              </p>
              <div className="progress-bar-bg" style={{ height: "12px", marginBottom: "16px" }}>
                <div
                  className="progress-bar-fill green"
                  style={{ width: `${analyticsData.syllabus.completionPercentage}%` }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "10px" }}>
                {(analyticsData.syllabus.topics || []).map((t) => (
                  <div
                    key={t.topic_id}
                    style={{
                      padding: "10px 14px",
                      background: t.isCompleted ? "#f0fdf4" : "#f8fafc",
                      border: "1px solid var(--border-color)",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "13px",
                    }}
                  >
                    {t.isCompleted ? <CheckCircle size={16} color="var(--accent-emerald)" /> : <Clock size={16} color="var(--text-light)" />}
                    <span style={{ color: t.isCompleted ? "var(--text-main)" : "var(--text-muted)" }}>{t.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Diagnostic Quizzes */}
      {activeTab === "assessments" && (
        <div className="modern-card">
          <div className="card-header">
            <h2 className="card-title"><PlayCircle size={20} /> Course Diagnostic Assessments</h2>
            <span className="badge active">Adaptive Evaluation</span>
          </div>
          <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "var(--text-muted)" }}>
            Complete short diagnostic quizzes to pinpoint specific conceptual gaps and trigger AI curriculum plan adjustments.
          </p>

          {!activeAssessment ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
              {assessments.map((a) => (
                <div key={a.assessment_id} style={{ border: "1px solid var(--border-color)", padding: "18px", borderRadius: "10px", background: "#f8fafc" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <span className="badge active">{a.course_code}</span>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{a.questions?.length || 0} Questions</span>
                  </div>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "16px" }}>{a.title}</h3>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "14px" }}>
                    Topics: {(a.topics_covered || []).join(", ")}
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ width: "100%" }}
                    onClick={() => {
                      setActiveAssessment(a);
                      setQuizAnswers({});
                      setQuizResult(null);
                    }}
                  >
                    Start Diagnostic Quiz
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ margin: 0, fontSize: "17px" }}>{activeAssessment.title}</h3>
                <button className="btn btn-secondary btn-sm" onClick={() => setActiveAssessment(null)}>
                  Back to List
                </button>
              </div>

              {quizResult ? (
                <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "10px", border: "1px solid var(--border-color)", textAlign: "center" }}>
                  <CheckCircle size={40} style={{ color: "var(--accent-emerald)", margin: "0 auto 10px auto" }} />
                  <h3 style={{ margin: "0 0 6px 0", fontSize: "18px" }}>Assessment Evaluated!</h3>
                  <p style={{ margin: "0 0 16px 0", fontSize: "14px", color: "var(--text-muted)" }}>
                    You scored <strong>{quizResult.score} / {quizResult.maxMarks} ({quizResult.percentage}%)</strong>
                  </p>

                  <div style={{ maxWidth: "450px", margin: "0 auto 16px auto", textAlign: "left" }}>
                    <strong>Topic Breakdown:</strong>
                    {(quizResult.topicBreakdown || []).map((tb) => (
                      <div key={tb.topic_id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #e2e8f0", fontSize: "13px" }}>
                        <span>{tb.topic_title}</span>
                        <span className={`badge ${tb.percentage >= 70 ? "active" : "high"}`}>{tb.percentage}%</span>
                      </div>
                    ))}
                  </div>

                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setActiveAssessment(null);
                      setActiveTab("plan");
                      handleRegeneratePlan();
                    }}
                  >
                    <Sparkles size={16} /> Update AI Study Plan with Results
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitAssessment}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "20px" }}>
                    {(activeAssessment.questions || []).map((q, qIndex) => (
                      <div key={q.question_id || qIndex} style={{ padding: "16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                        <div style={{ fontSize: "12px", color: "var(--primary-700)", fontWeight: "600", marginBottom: "4px" }}>
                          Topic: {q.topic_title}
                        </div>
                        <div style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-main)", marginBottom: "12px" }}>
                          {qIndex + 1}. {q.question_text}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {(q.options || []).map((opt, optIdx) => (
                            <label
                              key={optIdx}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "8px 12px",
                                background: quizAnswers[q.question_id] === optIdx ? "#eff6ff" : "white",
                                border: "1px solid",
                                borderColor: quizAnswers[q.question_id] === optIdx ? "var(--primary-600)" : "var(--border-color)",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontSize: "13px",
                              }}
                            >
                              <input
                                type="radio"
                                name={q.question_id}
                                checked={quizAnswers[q.question_id] === optIdx}
                                onChange={() => setQuizAnswers({ ...quizAnswers, [q.question_id]: optIdx })}
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setActiveAssessment(null)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Submit Assessment
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {/* POPUP: Mark Attendance Form */}
      {isFormOpen && (
        <div className="modal-overlay">
          <StudentForm
            togglePopup={() => {
              setIsFormOpen(false);
              fetchAttendanceHistory();
              fetchAnalytics();
              fetchLiveSessions();
            }}
            initialSessionId={targetSession.id}
            initialTeacherEmail={targetSession.email}
            initialQrToken={targetSession.qrToken}
          />
        </div>
      )}

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <div className="modal-overlay" onClick={() => setSelectedPhoto(null)}>
          <div className="modal-content" style={{ maxWidth: "450px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedPhoto(null)}>✖</button>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "16px" }}>Webcam Attendance Photo Proof</h3>
            <img
              src={selectedPhoto}
              alt="Verification Proof"
              style={{ width: "100%", maxHeight: "350px", objectFit: "cover", borderRadius: "8px", border: "1px solid var(--border-color)" }}
            />
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedPhoto(null)} style={{ marginTop: "16px" }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
